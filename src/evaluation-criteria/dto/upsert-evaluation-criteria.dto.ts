import { IsArray, ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateEvaluationCriterionDto } from './create-evaluation-criterion.dto';

export class UpdateCriterionForUpsertDto extends CreateEvaluationCriterionDto {
  @ApiProperty({ description: 'ID do critério existente' })
  @IsString()
  id: string;
}

export class UpsertEvaluationCriteriaDto {
  @ApiProperty({ 
    description: 'Lista de novos critérios para criar',
    type: [CreateEvaluationCriterionDto],
    example: [
      {
        title: 'Novo Critério Técnico',
        description: 'Descrição do novo critério',
        type: 'TECHNICAL'
      }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEvaluationCriterionDto)
  create: CreateEvaluationCriterionDto[];

  @ApiProperty({ 
    description: 'Lista de critérios existentes para atualizar',
    type: [UpdateCriterionForUpsertDto],
    example: [
      {
        id: 'existing-criterion-id',
        title: 'Critério Atualizado',
        description: 'Nova descrição',
        type: 'BEHAVIORAL'
      }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateCriterionForUpsertDto)
  update: UpdateCriterionForUpsertDto[];
}