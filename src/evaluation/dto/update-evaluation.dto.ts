import { PartialType } from '@nestjs/swagger';
import { CreateEvaluationDto } from './create-evaluation.dto';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsUUID,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { EvaluationType } from '@prisma/client';

export class UpdateEvaluationDto extends PartialType(CreateEvaluationDto) {
  @ApiProperty({
    description: 'Tipo da avaliação',
    enum: EvaluationType,
    example: 'LIDER',
    required: false,
  })
  @IsEnum(EvaluationType, {
    message: 'Tipo de avaliação deve ser AUTO, LIDER ou PAR',
  })
  @IsOptional()
  type?: EvaluationType;

  @ApiProperty({
    description: 'ID do ciclo de avaliação',
    example: 'cycle1',
    required: false,
  })
  @IsString({ message: 'ID do ciclo deve ser uma string' })
  @IsUUID('4', { message: 'ID do ciclo deve ser um UUID válido' })
  @IsOptional()
  cycleId?: string;

  @ApiProperty({
    description: 'ID do usuário avaliador',
    example: 'user1',
    required: false,
  })
  @IsString({ message: 'ID do avaliador deve ser uma string' })
  @IsUUID('4', { message: 'ID do avaliador deve ser um UUID válido' })
  @IsOptional()
  evaluatorId?: string;

  @ApiProperty({
    description: 'ID do usuário avaliado',
    example: 'user2',
    required: false,
  })
  @IsString({ message: 'ID do avaliado deve ser uma string' })
  @IsUUID('4', { message: 'ID do avaliado deve ser um UUID válido' })
  @IsOptional()
  evaluatedId?: string;

  @ApiProperty({
    description: 'ID da equipe',
    example: 'team1',
    required: false,
  })
  @IsString({ message: 'ID da equipe deve ser uma string' })
  @IsUUID('4', { message: 'ID da equipe deve ser um UUID válido' })
  @IsOptional()
  teamId?: string;

  @ApiProperty({
    description: 'Se a avaliação está completa',
    example: true,
    required: false,
  })
  @IsBoolean({ message: 'Campo completo deve ser um valor booleano' })
  @IsOptional()
  completed?: boolean;
}
