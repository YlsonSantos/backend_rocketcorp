import { ApiProperty } from '@nestjs/swagger';

export class GoalAction {
  @ApiProperty({ description: 'ID da ação', example: 'action-uuid' })
  id: string;

  @ApiProperty({ description: 'ID do objetivo', example: 'goal-uuid' })
  goalId: string;

  @ApiProperty({
    description: 'Descrição da ação',
    example: 'Concluir curso de liderança',
  })
  description: string;

  @ApiProperty({
    description: 'Prazo da ação',
    example: '2024-12-31T23:59:59.999Z',
  })
  deadline: Date;

  @ApiProperty({ description: 'Se a ação foi concluída', example: false })
  completed: boolean;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-07-08T12:00:00.000Z',
  })
  createdAt: Date;
}

export class Goal {
  @ApiProperty({ description: 'ID do objetivo', example: 'goal-uuid' })
  id: string;

  @ApiProperty({ description: 'ID do usuário', example: 'user-uuid' })
  userId: string;

  @ApiProperty({
    description: 'Título do objetivo',
    example: 'Aprender NestJS',
  })
  title: string;

  @ApiProperty({
    description: 'Descrição do objetivo',
    example: 'Estudar e praticar NestJS para desenvolvimento de APIs',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Tipo do objetivo',
    enum: ['OKR', 'PDI'],
    example: 'OKR',
  })
  type: 'OKR' | 'PDI';

  @ApiProperty({
    description: 'Ações relacionadas ao objetivo',
    type: [GoalAction],
  })
  actions: GoalAction[];

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-07-08T12:00:00.000Z',
  })
  createdAt: Date;
}
