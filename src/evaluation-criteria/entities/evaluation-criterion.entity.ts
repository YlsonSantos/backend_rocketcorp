import { ApiProperty } from '@nestjs/swagger';
import { CriterionType } from '@prisma/client';

export class EvaluationCriterion {
  @ApiProperty({
    description: 'ID único do critério',
    example: 'criterion-uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Título do critério',
    example: 'Comunicação Efetiva',
  })
  title: string;

  @ApiProperty({
    description: 'Descrição detalhada do critério',
    example: 'Capacidade de comunicar ideias de forma clara e eficaz',
  })
  description: string;

  @ApiProperty({
    description: 'Tipo do critério',
    enum: CriterionType,
    example: 'GESTAO',
  })
  type: CriterionType;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt?: Date;

  @ApiProperty({
    description: 'Data de atualização',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt?: Date;
} 