import { ApiProperty } from '@nestjs/swagger';
import { EvaluationType } from '@prisma/client';

export class Evaluation {
  @ApiProperty({ description: 'Identificador único da avaliação' })
  id: string;

  @ApiProperty({
    description: 'Tipo da avaliação',
    enum: EvaluationType,
    example: 'LIDER',
  })
  type: EvaluationType;

  @ApiProperty({ description: 'ID do ciclo de avaliação' })
  cycleId: string;

  @ApiProperty({ description: 'ID do usuário avaliador' })
  evaluatorId: string;

  @ApiProperty({ description: 'ID do usuário avaliado' })
  evaluatedId: string;

  @ApiProperty({ description: 'ID da equipe' })
  teamId: string;

  @ApiProperty({ description: 'Data de criação da avaliação' })
  createdAt: Date;

  @ApiProperty({ description: 'Indica se a avaliação foi completada' })
  completed: boolean;

  // Relações opcionais para respostas da API
  @ApiProperty({ required: false, description: 'Dados do ciclo de avaliação' })
  cycle?: any;

  @ApiProperty({ required: false, description: 'Dados do avaliador' })
  evaluator?: any;

  @ApiProperty({ required: false, description: 'Dados do avaliado' })
  evaluated?: any;

  @ApiProperty({ required: false, description: 'Dados da equipe' })
  team?: any;

  @ApiProperty({
    required: false,
    isArray: true,
    description: 'Respostas da avaliação',
  })
  answers?: any[];
}
