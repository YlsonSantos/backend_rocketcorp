import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateReferenceDto {
  @ApiProperty({
    example: 'cycleId',
    description: 'ID of the cycle',
  })
  @IsString({ message: 'cycleId deve ser uma string válida' })
  @IsNotEmpty({ message: 'cycleId é obrigatório' })
  cycleId: string;

  @ApiProperty({
    example: 'user-uuid',
    description: 'ID of the referenced user',
  })
  @IsString({ message: 'referencedId deve ser uma string válida' })
  @IsNotEmpty({ message: 'referencedId é obrigatório' })
  referencedId: string;

  @ApiProperty({
    example: 'Colaboração',
    description: 'Theme of the reference',
  })
  @IsString({ message: 'theme deve ser uma string válida' })
  @IsNotEmpty({ message: 'theme é obrigatório' })
  theme: string;

  @ApiProperty({
    example: 'Ótima colaboração no projeto X',
    description: 'Justification for the reference',
  })
  @IsString({ message: 'justification deve ser uma string válida' })
  @IsNotEmpty({ message: 'justification é obrigatório' })
  justification: string;
}
