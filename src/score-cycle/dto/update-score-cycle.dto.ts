import { IsOptional, IsNumber, IsString, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateScoreDto {
  @ApiPropertyOptional({ example: 'user1' })
  @IsOptional()
  @IsString()
  userId: string;

  @ApiPropertyOptional({ example: 'cycle1' })
  @IsString()
  cycleId: string;

  @ApiPropertyOptional({ example: 3.5 })
  @IsOptional()
  @IsNumber()
  selfScore?: number;

  @ApiPropertyOptional({ example: 4.0 })
  @IsOptional()
  @IsNumber()
  leaderScore?: number;

  @ApiPropertyOptional({ example: 4.2 })
  @IsOptional()
  @IsNumber()
  finalScore?: number;

  @ApiPropertyOptional({ example: 'Bom desempenho, precisa melhorar em X.' })
  @IsOptional()
  @IsString()
  feedback?: string;

  @ApiPropertyOptional({ example: [4.0, 4.3, 3.8] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  peerScores?: number[];
}
