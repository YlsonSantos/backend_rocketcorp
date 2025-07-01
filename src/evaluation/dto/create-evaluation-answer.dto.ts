import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min, Max, IsNotEmpty } from 'class-validator';

export class CreateEvaluationAnswerDto {
  @ApiProperty({
    description: 'ID do critério de avaliação',
    example: 'crit1',
  })
  @IsString({ message: 'ID do critério deve ser uma string válida' })
  @IsNotEmpty({ message: 'ID do critério é obrigatório' })
  criterionId: string;

  @ApiProperty({
    description: 'Score dado para este critério (1-5)',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber({}, { message: 'Score deve ser um número' })
  @Min(1, { message: 'Score mínimo é 1' })
  @Max(5, { message: 'Score máximo é 5' })
  score: number;

  @ApiProperty({
    description: 'Justificativa para o score dado',
    example: 'Demonstrou excelente trabalho em equipe durante o projeto',
    required: false,
  })
  @IsString({ message: 'Justificativa deve ser uma string' })
  @IsOptional()
  justification?: string;
}
