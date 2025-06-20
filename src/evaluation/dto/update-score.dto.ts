import { IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLeaderScoreDto {
  @ApiProperty({ description: 'ID do usuário', example: 'user1' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'ID do ciclo de avaliação', example: 'cycle1' })
  @IsString()
  cycleId: string;

  @ApiProperty({
    description: 'Score do líder (1-5)',
    example: 4.5,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  leaderScore: number;

  @ApiProperty({
    description: 'Feedback opcional',
    required: false,
    example: 'Excelente desempenho',
  })
  @IsOptional()
  @IsString()
  feedback?: string;
}

export class UpdateFinalScoreDto {
  @ApiProperty({ description: 'ID do usuário', example: 'user1' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'ID do ciclo de avaliação', example: 'cycle1' })
  @IsString()
  cycleId: string;

  @ApiProperty({
    description: 'Score final do comitê (1-5)',
    example: 4.2,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  finalScore: number;

  @ApiProperty({
    description: 'Feedback opcional',
    required: false,
    example: 'Aprovado pelo comitê',
  })
  @IsOptional()
  @IsString()
  feedback?: string;
}

export class AddPeerScoreDto {
  @ApiProperty({ description: 'ID do usuário', example: 'user1' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'ID do ciclo de avaliação', example: 'cycle1' })
  @IsString()
  cycleId: string;

  @ApiProperty({
    description: 'Score do colega (1-5)',
    example: 4.0,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  peerScore: number;
}

export class UpdateSelfScoreDto {
  @ApiProperty({ description: 'ID do usuário', example: 'user1' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'ID do ciclo de avaliação', example: 'cycle1' })
  @IsString()
  cycleId: string;

  @ApiProperty({
    description: 'Self score (1-5)',
    example: 3.8,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  selfScore: number;
}
