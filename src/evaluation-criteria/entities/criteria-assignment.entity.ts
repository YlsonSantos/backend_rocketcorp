import { ApiProperty } from '@nestjs/swagger';

export class CriteriaAssignment {
  @ApiProperty({
    description: 'ID único da atribuição',
    example: 'assignment-uuid',
  })
  id: string;

  @ApiProperty({
    description: 'ID do critério',
    example: 'criterion-uuid',
  })
  criterionId: string;

  @ApiProperty({
    description: 'ID da equipe',
    example: 'team-uuid',
  })
  teamId: string;

  @ApiProperty({
    description: 'ID da posição',
    example: 'position-uuid',
  })
  positionId: string;

  @ApiProperty({
    description: 'Se o critério é obrigatório para esta atribuição',
    example: false,
  })
  isRequired: boolean;

  @ApiProperty({
    description: 'Dados da posição',
    required: false,
  })
  position?: {
    id: string;
    name: string;
    track: string;
  };

  @ApiProperty({
    description: 'Dados da equipe',
    required: false,
  })
  team?: {
    id: string;
    name: string;
  };
} 