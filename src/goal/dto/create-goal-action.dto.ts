import { IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGoalActionDto {
  @ApiProperty({
    description: 'Descrição da ação',
    example: 'Concluir curso de liderança',
  })
  @IsNotEmpty({
    message: 'Description is required',
  })
  description: string;

  @ApiProperty({
    description: 'Prazo da ação',
    example: '2025-12-31T23:59:59.999Z',
    type: String,
    format: 'date-time',
  })
  @IsNotEmpty({
    message: 'Deadline is required',
  })
  deadline: Date;

  @ApiPropertyOptional({
    description: 'Se a ação já está concluída',
    example: false,
  })
  @IsOptional()
  completed?: boolean;
}
