import { IsString, IsOptional, IsObject, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AuditAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  ACCESS_DENIED = 'ACCESS_DENIED',
}

export enum AuditResult {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  ERROR = 'ERROR',
}

export class AuditEventDto {
  @ApiProperty({ description: 'Unique event identifier' })
  @IsString()
  eventId: string;

  @ApiProperty({ description: 'ISO timestamp of the event' })
  @IsString()
  timestamp: string;

  @ApiProperty({ description: 'ID of the user performing the action' })
  @IsString()
  actorId: string;

  @ApiProperty({ enum: AuditAction, description: 'Type of action performed' })
  @IsEnum(AuditAction)
  action: AuditAction;

  @ApiProperty({ description: 'Resource or table being accessed' })
  @IsString()
  resource: string;

  @ApiPropertyOptional({ description: 'Previous value before change' })
  @IsOptional()
  @IsObject()
  oldValue?: any;

  @ApiPropertyOptional({ description: 'New value after change' })
  @IsOptional()
  @IsObject()
  newValue?: any;

  @ApiProperty({ enum: AuditResult, description: 'Result of the operation' })
  @IsEnum(AuditResult)
  result: AuditResult;

  @ApiPropertyOptional({ description: 'IP address of the request' })
  @IsOptional()
  @IsString()
  ip?: string;

  @ApiPropertyOptional({ description: 'User agent string' })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiPropertyOptional({ description: 'Correlation ID for request tracing' })
  @IsOptional()
  @IsString()
  traceId?: string;

  @ApiPropertyOptional({ description: 'Additional context information' })
  @IsOptional()
  @IsObject()
  additionalContext?: Record<string, any>;
}
