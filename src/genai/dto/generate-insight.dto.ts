import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateInsightDto {
  @ApiProperty({
    description: 'ID do ciclo de avaliação',
    example: 'cycle1',
  })
  @IsString()
  @IsNotEmpty()
  cycleId: string;

  @ApiProperty({
    description: 'ID do colaborador a ser analisado',
    example: 'user1',
  })
  @IsString()
  @IsNotEmpty()
  evaluatedId: string;
}
