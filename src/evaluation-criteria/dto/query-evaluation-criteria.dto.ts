import { IsOptional, IsEnum } from 'class-validator';
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
    description: 'Filtrar por ID da posição (aceita UUID ou string)',
    required: false,
  })
  @IsOptional()
  positionId?: string;
}
