import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGoalDto {
  @ApiProperty({
    description: 'Título do objetivo',
    example: 'Aprender NestJS',
  })
  @IsNotEmpty({
    message: 'Title is required',
  })
  title: string;

  @ApiProperty({
    description: 'Tipo do objetivo',
    enum: ['OKR', 'PDI'],
    example: 'OKR',
  })
  @IsNotEmpty({
    message: 'Type is required',
  })
  @IsEnum(['OKR', 'PDI'], {
    message: 'Type must be either OKR or PDI',
  })
  type: 'OKR' | 'PDI';
}
