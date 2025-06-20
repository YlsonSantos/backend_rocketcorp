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
    message: 'Tipo deve ser HABILIDADES, VALORES ou METAS',
  })
  @IsOptional()
  type?: CriterionType;

  @ApiProperty({
    description: 'Filtrar por track',
    enum: TrackType,
    required: false,
  })
  @IsEnum(TrackType, {
    message: 'Track deve ser DESENVOLVIMENTO, DESIGN ou FINANCEIRO',
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

  @ApiProperty({
    description: 'Filtrar por ID da equipe',
    required: false,
  })
  @IsUUID('4', { message: 'ID da equipe deve ser um UUID válido' })
  @IsOptional()
  teamId?: string;
} 