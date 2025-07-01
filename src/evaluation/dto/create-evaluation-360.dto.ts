import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateEvaluationAnswerDto } from './create-evaluation-answer.dto';

export class CreateEvaluation360Dto {
  @ApiProperty({
    description: 'ID do usuário sendo avaliado',
    example: 'user2',
  })
  @IsString()
  @IsNotEmpty()
  evaluatedUserId: string;

  @ApiProperty({
    description: 'ID do ciclo de avaliação',
    example: 'cycle2025_1',
  })
  @IsString()
  @IsNotEmpty()
  cycleId: string;

  @ApiProperty({
    description: 'Respostas da avaliação 360',
    type: [CreateEvaluationAnswerDto],
    example: [
      {
        criterionId: '360_evaluation',
        score: 4,
        justification:
          'Demonstra excelente colaboração e capacidade de receber feedback',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEvaluationAnswerDto)
  answers: CreateEvaluationAnswerDto[];

  @ApiProperty({
    description: 'Pontos fortes observados na avaliação 360',
    example: 'Excelente comunicação e liderança de equipe',
    required: false,
  })
  @IsString()
  @IsOptional()
  strongPoints?: string;

  @ApiProperty({
    description: 'Pontos fracos ou áreas de melhoria na avaliação 360',
    example: 'Pode melhorar a gestão de tempo em projetos complexos',
    required: false,
  })
  @IsString()
  @IsOptional()
  weakPoints?: string;

  @ApiProperty({
    description: 'Se a avaliação está completa',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  completed?: boolean;
}
