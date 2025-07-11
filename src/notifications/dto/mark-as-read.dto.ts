import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
 
export class MarkAsReadDto {
  @ApiProperty()
  @IsUUID()
  notificationId: string;
} 