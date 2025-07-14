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
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    // Check for suspicious requests
    if (this.isSuspiciousRequest(request)) {
      // Log the suspicious request but don't block it
      // The Prisma ORM will handle SQL injection protection
    }

    // Extract user information
    let actorId = 'anonymous';
    let action: AuditAction = AuditAction.READ;
    let resource = 'UNKNOWN';
    let traceId = (request as any).correlationId || request.headers['x-correlation-id'] || 'unknown';

    try {
      // Skip audit for login and test endpoints
      if (request.url === '/auth/login' || request.url === '/auth/test-role') {
        return next.handle();
      }

      // Extract user from JWT if available
      if (request.user) {
        actorId = request.user.userId || request.user.sub || 'authenticated';
      }

      // Determine action and resource from request
      action = this.getAction(request);
      resource = this.getResource(request);

    } catch (error) {
      console.error('Error in audit interceptor:', error);
    }

    return next.handle().pipe(
      tap((result) => {
        const duration = Date.now() - startTime;

        // Capture request data for better audit context
        const requestData = this.captureRequestData(request);
        const oldValue = this.getOldValue(request, action);

        // Log successful operations
        this.auditService.log({
          eventId: uuidv4(),
          timestamp: new Date().toISOString(),
          actorId,
          action,
          resource,
          oldValue: oldValue,
          newValue: this.sanitizeData({
            result: result,
            requestData: requestData
          }),
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

        // Capture request data for failed operations too
        const requestData = this.captureRequestData(request);

        // Log failed operations
        this.auditService.log({
          eventId: uuidv4(),
          timestamp: new Date().toISOString(),
          actorId,
          action,
          resource,
          oldValue: null,
          newValue: this.sanitizeData({
            error: error.message,
            requestData: requestData
          }),
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

  private logSecurityEvent(request: any, suspiciousPattern: string): void {
    const { ip, method, url, headers } = request;
    console.warn(`🚨 Tentativa suspeita detectada:`, {
      ip,
      method,
      url,
      userAgent: headers['user-agent'],
      suspiciousPattern,
      timestamp: new Date().toISOString(),
    });
  }

  private isSuspiciousRequest(request: any): boolean {
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /union\s+select/i,
      /drop\s+table/i,
      /insert\s+into/i,
      /delete\s+from/i,
      /update\s+set/i,
      /alter\s+table/i,
      /create\s+table/i,
    ];
    
    const bodyStr = JSON.stringify(request.body || {});
    const urlStr = request.url;
    const queryStr = JSON.stringify(request.query || {});
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(bodyStr) || pattern.test(urlStr) || pattern.test(queryStr)) {
        this.logSecurityEvent(request, pattern.source);
        return true;
      }
    }
    
    return false;
  }

  private isUUID(str: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  private captureRequestData(request: Request): any {
    const requestData: any = {};

    // Capture body data (for POST, PUT, PATCH)
    if (['POST', 'PUT', 'PATCH'].includes(request.method.toUpperCase()) && request.body) {
      requestData.body = this.sanitizeData(request.body);
    }

    // Capture query parameters
    if (request.query && Object.keys(request.query).length > 0) {
      requestData.query = this.sanitizeData(request.query);
    }

    // Capture URL parameters
    if (request.params && Object.keys(request.params).length > 0) {
      requestData.params = this.sanitizeData(request.params);
    }

    return requestData;
  }

  private getOldValue(request: Request, action: AuditAction): any {
    // For UPDATE operations, we could potentially fetch the current state
    // For now, we'll return null to avoid performance impact
    // This can be enhanced later to fetch current data for specific resources
    if (action === AuditAction.UPDATE) {
      // Could implement fetching current state here if needed
      return null;
    }
    return null;
  }
}
