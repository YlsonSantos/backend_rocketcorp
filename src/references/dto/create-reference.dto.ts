import { ApiProperty } from '@nestjs/swagger';

export class CreateReferenceDto {
  @ApiProperty({
    example: 'cycleId',
    description: 'ID of the cycle',
  })
  cycleId: string;

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
