import { SetMetadata } from '@nestjs/common';
import { AuditAction } from '../dto/audit-event.dto';

export const AUDIT_KEY = 'audit';

export interface AuditOptions {
  action: AuditAction;
  resource: string;
  description?: string;
  captureOldValue?: boolean;
  captureNewValue?: boolean;
}

export const Audit = (options: AuditOptions) => SetMetadata(AUDIT_KEY, options);
