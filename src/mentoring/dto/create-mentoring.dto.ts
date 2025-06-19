import { IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMentoringDto {
  @ApiProperty({
    description: 'ID do mentor (usuário que está avaliando)',
    example: 'user1',
  })
  @IsString()
  mentorId: string;

  @ApiProperty({
    description: 'ID do mentorado (usuário sendo avaliado)',
    example: 'user2',
  })
  @IsString()
  menteeId: string;

  @ApiProperty({
    description: 'ID do ciclo de avaliação',
    example: 'cycle1',
  })
  @IsString()
  cycleId: string;

  @ApiProperty({
    description: 'Nota atribuída pelo mentor (de 0 a 5',
    example: 4.5,
  })
  @IsNumber()
  score: number;

  @ApiProperty({
    description: 'Feedback textual do mentor sobre o desempenho do mentorado',
    example: 'Demonstrou grande evolução técnica e boa comunicação.',
  })
  @IsString()
  feedback: string;
}
