import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditEventDto, AuditAction, AuditResult } from './dto/audit-event.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(auditEvent: AuditEventDto): Promise<void> {
    try {
      this.logger.debug(`Starting audit log for event: ${auditEvent.eventId}`);

      // Check if user exists, if not use a fallback
      let userId = auditEvent.actorId;

      if (auditEvent.actorId !== 'anonymous') {
        try {
          const user = await this.prisma.user.findUnique({
            where: { id: auditEvent.actorId },
            select: { id: true },
          });

          if (!user) {
            // User doesn't exist, use anonymous
            userId = 'anonymous';
            this.logger.warn(
              `User ${auditEvent.actorId} not found, using anonymous for audit log`,
            );
          }
        } catch (error) {
          // If there's any error checking the user, use anonymous
          userId = 'anonymous';
          this.logger.warn(
            `Error checking user ${auditEvent.actorId}, using anonymous for audit log: ${error.message}`,
          );
        }
      }

      this.logger.debug(
        `Attempting to save audit log to database with userId: ${userId}`,
      );

      // Log to database
      const savedAuditLog = await this.prisma.auditLog.create({
        data: {
          id: auditEvent.eventId,
          userId,
          action: auditEvent.action,
          table: auditEvent.resource,
          timestamp: new Date(auditEvent.timestamp),
          metadata: {
            oldValue: auditEvent.oldValue,
            newValue: auditEvent.newValue,
            result: auditEvent.result,
            ip: auditEvent.ip,
            userAgent: auditEvent.userAgent,
            traceId: auditEvent.traceId,
            additionalContext: auditEvent.additionalContext || {},
            originalActorId: auditEvent.actorId, // Store the original actor ID for reference
          },
        },
      });

      this.logger.debug(
        `Successfully saved audit log to database: ${savedAuditLog.id}`,
      );

      // Also log to console for development/debugging
      this.logger.log(
        `AUDIT: ${auditEvent.action} on ${auditEvent.resource} by ${auditEvent.actorId}`,
        {
          eventId: auditEvent.eventId,
          traceId: auditEvent.traceId,
          result: auditEvent.result,
          databaseId: savedAuditLog.id,
        },
      );
    } catch (error) {
      // Don't let audit failures break the main application
      this.logger.error('Failed to log audit event', {
        error: error.message,
        stack: error.stack,
        auditEvent: {
          eventId: auditEvent.eventId,
          action: auditEvent.action,
          resource: auditEvent.resource,
          actorId: auditEvent.actorId,
        },
      });
    }
  }

  async logSecurityEvent(
    actorId: string,
    action: AuditAction,
    details: any,
    ip?: string,
    userAgent?: string,
    traceId?: string,
  ): Promise<void> {
    await this.log({
      eventId: uuidv4(),
      timestamp: new Date().toISOString(),
      actorId,
      action,
      resource: 'SECURITY',
      oldValue: null,
      newValue: details,
      result: AuditResult.SUCCESS,
      ip,
      userAgent,
      traceId,
      additionalContext: { eventType: 'SECURITY' },
    });
  }

  async logDataAccess(
    actorId: string,
    resource: string,
    resourceId: string,
    ip?: string,
    userAgent?: string,
    traceId?: string,
  ): Promise<void> {
    await this.log({
      eventId: uuidv4(),
      timestamp: new Date().toISOString(),
      actorId,
      action: AuditAction.READ,
      resource,
      oldValue: null,
      newValue: { resourceId },
      result: AuditResult.SUCCESS,
      ip,
      userAgent,
      traceId,
      additionalContext: { eventType: 'DATA_ACCESS' },
    });
  }

  async logDataMutation(
    actorId: string,
    action: AuditAction,
    resource: string,
    resourceId: string,
    oldValue: any,
    newValue: any,
    ip?: string,
    userAgent?: string,
    traceId?: string,
  ): Promise<void> {
    await this.log({
      eventId: uuidv4(),
      timestamp: new Date().toISOString(),
      actorId,
      action,
      resource,
      oldValue,
      newValue,
      result: AuditResult.SUCCESS,
      ip,
      userAgent,
      traceId,
      additionalContext: { eventType: 'DATA_MUTATION', resourceId },
    });
  }
}
