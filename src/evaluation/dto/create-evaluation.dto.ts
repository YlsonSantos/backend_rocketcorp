import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsUUID,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EvaluationType } from '@prisma/client';

export class CreateEvaluationDto {
  @ApiProperty({
    description: 'Tipo da avaliação',
    enum: EvaluationType,
    example: 'LIDER',
  })
  @IsEnum(EvaluationType, {
    message: 'Tipo de avaliação deve ser AUTO, LIDER ou PAR',
  })
  @IsNotEmpty({ message: 'Tipo da avaliação é obrigatório' })
  type: EvaluationType;

  @ApiProperty({
    description: 'ID do ciclo de avaliação',
    example: 'cycle1',
  })
  @IsString({ message: 'ID do ciclo deve ser uma string' })
  @IsNotEmpty({ message: 'ID do ciclo é obrigatório' })
  @IsUUID('4', { message: 'ID do ciclo deve ser um UUID válido' })
  cycleId: string;

  @ApiProperty({
    description: 'ID do usuário avaliador',
    example: 'user1',
  })
  @IsString({ message: 'ID do avaliador deve ser uma string' })
  @IsNotEmpty({ message: 'ID do avaliador é obrigatório' })
  @IsUUID('4', { message: 'ID do avaliador deve ser um UUID válido' })
  evaluatorId: string;

  @ApiProperty({
    description: 'ID do usuário avaliado',
    example: 'user2',
  })
  @IsString({ message: 'ID do avaliado deve ser uma string' })
  @IsNotEmpty({ message: 'ID do avaliado é obrigatório' })
  @IsUUID('4', { message: 'ID do avaliado deve ser um UUID válido' })
  evaluatedId: string;

  @ApiProperty({
    description: 'ID da equipe',
    example: 'team1',
  })
  @IsString({ message: 'ID da equipe deve ser uma string' })
  @IsNotEmpty({ message: 'ID da equipe é obrigatório' })
  @IsUUID('4', { message: 'ID da equipe deve ser um UUID válido' })
  teamId: string;

  @ApiProperty({
    description: 'Se a avaliação está completa',
    example: false,
    required: false,
  })
  @IsBoolean({ message: 'Campo completo deve ser um valor booleano' })
  @IsOptional()
  completed?: boolean;
}
