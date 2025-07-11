import { IsString, IsNotEmpty, IsEnum, IsBoolean, IsOptional, IsInt, Min, Max, IsObject, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationType, NotificationPriority } from '@prisma/client';

export class CreateNotificationSettingDto {
  @ApiProperty({
    description: 'Tipo de notificação',
    enum: NotificationType,
    example: 'EVALUATION_DUE',
  })
  @IsEnum(NotificationType, { message: 'Tipo de notificação inválido' })
  @IsNotEmpty({ message: 'Tipo de notificação é obrigatório' })
  notificationType: NotificationType;

  @ApiProperty({
    description: 'Se a notificação está habilitada',
    example: true,
    required: false,
  })
  @IsBoolean({ message: 'Habilitado deve ser um valor booleano' })
  @IsOptional()
  enabled?: boolean;

  @ApiProperty({
    description: 'Dias antes do prazo para enviar lembretes',
    example: 3,
    minimum: 1,
    maximum: 30,
    required: false,
  })
  @IsInt({ message: 'Dias deve ser um número inteiro' })
  @Min(1, { message: 'Dias deve ser pelo menos 1' })
  @Max(30, { message: 'Dias deve ser no máximo 30' })
  @IsOptional()
  reminderDays?: number;

  @ApiProperty({
    description: 'Mensagem personalizada',
    example: 'Lembrete personalizado para avaliações',
    required: false,
  })
  @IsString({ message: 'Mensagem deve ser uma string' })
  @IsOptional()
  customMessage?: string;

  @ApiProperty({
    description: 'Horário para enviar notificação (formato HH:mm)',
    example: '08:00',
    required: false,
  })
  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { 
    message: 'Horário deve estar no formato HH:mm' 
  })
  scheduledTime?: string;

  @ApiProperty({
    description: 'Frequência de envio',
    enum: ['DAILY', 'WEEKLY', 'MONTHLY'],
    example: 'DAILY',
    required: false,
  })
  @IsOptional()
  @IsEnum(['DAILY', 'WEEKLY', 'MONTHLY'])
  frequency?: string;

  @ApiProperty({
    description: 'Dia da semana para envio (quando frequency = WEEKLY)',
    enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
    example: 'MONDAY',
    required: false,
  })
  @IsOptional()
  @IsEnum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'])
  weekDay?: string;

  @ApiProperty({
    description: 'Filtros de usuários para receber notificação',
    example: {
      roles: ['COLABORADOR', 'LIDER'],
      positions: ['DESENVOLVIMENTO', 'DESIGN'],
      teams: ['team1', 'team2'],
      excludeUsers: ['user1', 'user2']
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  userFilters?: {
    roles?: string[];
    positions?: string[];
    teams?: string[];
    excludeUsers?: string[];
    includeUsers?: string[];
  };

  @ApiProperty({
    description: 'Prioridade da notificação',
    enum: NotificationPriority,
    example: 'HIGH',
    required: false,
  })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;
}

export class UpdateNotificationSettingDto {
  @ApiProperty({
    description: 'Se a notificação está habilitada',
    example: true,
    required: false,
  })
  @IsBoolean({ message: 'Habilitado deve ser um valor booleano' })
  @IsOptional()
  enabled?: boolean;

  @ApiProperty({
    description: 'Dias antes do prazo para enviar lembretes',
    example: 5,
    minimum: 1,
    maximum: 30,
    required: false,
  })
  @IsInt({ message: 'Dias deve ser um número inteiro' })
  @Min(1, { message: 'Dias deve ser pelo menos 1' })
  @Max(30, { message: 'Dias deve ser no máximo 30' })
  @IsOptional()
  reminderDays?: number;

  @ApiProperty({
    description: 'Mensagem personalizada',
    example: 'Lembrete personalizado para avaliações',
    required: false,
  })
  @IsString({ message: 'Mensagem deve ser uma string' })
  @IsOptional()
  customMessage?: string;
} 