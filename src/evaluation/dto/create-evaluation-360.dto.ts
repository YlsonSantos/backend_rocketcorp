import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreateEvaluationAnswerDto } from './create-evaluation-answer.dto';

export class CreateEvaluation360Dto {
  @ApiProperty({
    description: 'ID do ciclo de avaliação',
    example: 'cycle2025_1',
  })
  @IsString({ message: 'ID do ciclo deve ser uma string válida' })
  @IsNotEmpty({ message: 'ID do ciclo é obrigatório' })
  cycleId: string;

  @ApiProperty({
    description: 'ID do usuário avaliado',
    example: 'user2',
  })
  @IsString({ message: 'ID do avaliado deve ser uma string válida' })
  @IsNotEmpty({ message: 'ID do avaliado é obrigatório' })
  evaluatedId: string;

  @ApiProperty({
    description: 'Se a avaliação está completa',
    example: true,
    required: false,
  })
  @IsBoolean({ message: 'Campo completo deve ser um valor booleano' })
  @IsOptional()
  completed?: boolean;

  @ApiProperty({
    description: 'Pontos fortes observados na avaliação 360',
    example: 'Excelente comunicação e liderança de equipe',
    required: false,
  })
  @IsString({ message: 'Pontos fortes devem ser uma string' })
  @IsOptional()
  strongPoints?: string;

  @ApiProperty({
    description: 'Pontos fracos ou áreas de melhoria na avaliação 360',
    example: 'Pode melhorar a gestão de tempo em projetos complexos',
    required: false,
  })
  @IsString({ message: 'Pontos fracos devem ser uma string' })
  @IsOptional()
  weakPoints?: string;

  @ApiProperty({
    description:
      'Respostas da avaliação - deve conter apenas uma resposta com o critério 360',
    type: [CreateEvaluationAnswerDto],
    minItems: 1,
    maxItems: 1,
    example: [
      {
        criterionId: '360_evaluation',
        score: 4,
        justification: 'Excelente trabalho em equipe e comunicação',
      },
    ],
  })
  @IsArray({ message: 'Respostas devem ser um array' })
  @ArrayMinSize(1, { message: 'Deve haver pelo menos uma resposta' })
  @ArrayMaxSize(1, {
    message: 'Deve haver apenas uma resposta para avaliação 360',
  })
  @ValidateNested({ each: true })
  @Type(() => CreateEvaluationAnswerDto)
  answers: CreateEvaluationAnswerDto[];
}
