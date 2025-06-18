import { ApiProperty } from '@nestjs/swagger';

export class Reference {
  @ApiProperty({
    example: 'reference-uuid',
    description: 'ID of the reference',
  })
  id: string;

  @ApiProperty({
    example: 'user-uuid',
    description: 'ID of the evaluator (creator)',
  })
  evaluatorId: string;

  @ApiProperty({
    example: 'user-uuid',
    description: 'ID of the referenced user',
  })
  referencedId: string;

  @ApiProperty({
    example: 'Colaboração',
    description: 'Theme of the reference',
  })
  theme: string;

  @ApiProperty({
    example: 'Ótima colaboração no projeto X',
    description: 'Justification for the reference',
  })
  justification: string;
}
