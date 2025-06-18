import { IsOptional, IsNumber, IsString, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateScoreDto {
  @ApiProperty({ example: 'user-uuid-123' })
  @IsString()
  userId: string;

  @ApiProperty({ example: 'cycle-uuid-456' })
  @IsString()
  cycleId: string;

  @ApiProperty({ example: 3.5 })
  @IsNumber()
  selfScore: number;

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
