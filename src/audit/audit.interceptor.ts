import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { AuditService } from './audit.service';
import { AuditAction, AuditResult } from './dto/audit-event.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    // Extract user information from JWT token - handle case where user might not be authenticated yet
    const user = request.user as any;
    const actorId = user?.userId || user?.id || 'anonymous';

    // Get correlation ID from headers or generate one
    const traceId = (request.headers['x-correlation-id'] as string) || uuidv4();

    // Set correlation ID in response headers
    response.setHeader('x-correlation-id', traceId);

    // Determine action and resource from request
    const action = this.getAction(request);
    const resource = this.getResource(request);

    // Skip audit for certain endpoints (health checks, etc.)
    if (this.shouldSkipAudit(request)) {
      return next.handle();
    }

    // Skip audit if user is not authenticated (for endpoints that require auth)
    if (!user && request.url !== '/auth/login') {
      // If no user and not login endpoint, skip audit to avoid interference
      return next.handle();
    }

    return next.handle().pipe(
      tap((result) => {
        const duration = Date.now() - startTime;

        // Log successful operations
        this.auditService.log({
          eventId: uuidv4(),
          timestamp: new Date().toISOString(),
          actorId,
          action,
          resource,
          oldValue: null,
          newValue: this.sanitizeData(result),
          result: AuditResult.SUCCESS,
          ip: this.getClientIp(request),
          userAgent: request.headers['user-agent'],
          traceId,
          additionalContext: {
            method: request.method,
            url: request.url,
            duration,
            statusCode: response.statusCode,
          },
        });
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;

        // Log failed operations
        this.auditService.log({
          eventId: uuidv4(),
          timestamp: new Date().toISOString(),
          actorId,
          action,
          resource,
          oldValue: null,
          newValue: null,
          result: AuditResult.FAILURE,
          ip: this.getClientIp(request),
          userAgent: request.headers['user-agent'],
          traceId,
          additionalContext: {
            method: request.method,
            url: request.url,
            duration,
            statusCode: error.status || 500,
            error: error.message,
          },
        });

        throw error;
      }),
    );
  }

  private getAction(request: Request): AuditAction {
    const method = request.method.toUpperCase();

    switch (method) {
      case 'POST':
        return AuditAction.CREATE;
      case 'GET':
        return AuditAction.READ;
      case 'PATCH':
      case 'PUT':
        return AuditAction.UPDATE;
      case 'DELETE':
        return AuditAction.DELETE;
      default:
        return AuditAction.READ;
    }
  }

  private getResource(request: Request): string {
    const path = request.route?.path || request.url;

    // Extract resource name from path
    const pathParts = path.split('/').filter(Boolean);

    if (pathParts.length === 0) return 'ROOT';

    // Map common paths to resource names
    const resourceMap: Record<string, string> = {
      auth: 'AUTH',
      users: 'USER',
      avaliacao: 'EVALUATION',
      references: 'REFERENCE',
      'score-cycle': 'SCORE_CYCLE',
      mentoring: 'MENTORSHIP',
      'criterios-avaliacao': 'EVALUATION_CRITERIA',
    };

    const resource = resourceMap[pathParts[0]] || pathParts[0].toUpperCase();

    // Add specific resource if ID is present
    if (pathParts.length > 1 && this.isUUID(pathParts[1])) {
      return `${resource}_${pathParts[1]}`;
    }

    return resource;
  }

  private shouldSkipAudit(request: Request): boolean {
    const skipPaths = [
      '/health',
      '/metrics',
      '/favicon.ico',
      '/api', // Swagger documentation
      '/auth/login', // Skip audit for login endpoint
      '/auth/test-role', // Skip audit for test endpoint
    ];

    return skipPaths.some((path) => request.url.startsWith(path));
  }

  private getClientIp(request: Request): string {
    return (
      (request.headers['x-forwarded-for'] as string) ||
      (request.headers['x-real-ip'] as string) ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }

  private sanitizeData(data: any): any {
    if (!data) return data;

    // Create a copy to avoid modifying original data
    const sanitized = JSON.parse(JSON.stringify(data));

    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key'];

    const removeSensitiveFields = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) return obj;

      if (Array.isArray(obj)) {
        return obj.map(removeSensitiveFields);
      }

      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (
          sensitiveFields.some((field) => key.toLowerCase().includes(field))
        ) {
          result[key] = '[REDACTED]';
        } else {
          result[key] = removeSensitiveFields(value);
        }
      }
      return result;
    };

    return removeSensitiveFields(sanitized);
  }

  private isUUID(str: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }
}
