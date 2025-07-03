import { IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CriterionType, TrackType } from '@prisma/client';

export class QueryEvaluationCriteriaDto {
  @ApiProperty({
    description: 'Filtrar por tipo de critério',
    enum: CriterionType,
    required: false,
  })
  @IsEnum(CriterionType, {
    message: 'Tipo deve ser GESTAO, EXECUCAO, COMPORTAMENTO, AV360 ou FROMETL',
  })
  @IsOptional()
  type?: CriterionType;

  @ApiProperty({
    description: 'Filtrar por track',
    enum: TrackType,
    required: false,
  })
  @IsEnum(TrackType, {
    message: 'Track deve ser DESENVOLVIMENTO, DESIGN, FINANCEIRO, COMITE ou RH',
  })
  @IsOptional()
  track?: TrackType;

  @ApiProperty({
    description: 'Filtrar por ID da posição',
    required: false,
  })
  @IsUUID('4', { message: 'ID da posição deve ser um UUID válido' })
  @IsOptional()
  positionId?: string;
} 