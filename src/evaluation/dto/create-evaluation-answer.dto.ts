import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class CreateEvaluationAnswerDto {
  @ApiProperty({
    description: 'ID do critério de avaliação',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  criterionId: string;

  @ApiProperty({
    description: 'Pontuação dada ao critério (1-5)',
    minimum: 1,
    maximum: 5,
    example: 4,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  score: number;

  @ApiProperty({
    description: 'Justificativa opcional para a pontuação',
    required: false,
    example: 'Demonstrou excelente capacidade de liderança durante o projeto.',
  })
  @IsOptional()
  @IsString()
  justification?: string;
}
