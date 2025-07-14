import { IsString, IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginUserDto {
  @ApiProperty({ example: 'fulaninhodasilva' })
  @IsString({ message: 'Email deve ser uma string válida' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  @MaxLength(100, { message: 'Email deve ter no máximo 100 caracteres' })
  @Matches(/^[^\s<>'"]+$/, { message: 'Email contém caracteres inválidos' })
  email!: string;

  @ApiProperty({ example: 'strongPassword123' })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  @MaxLength(50, { message: 'Senha deve ter no máximo 50 caracteres' })
  password!: string;
}
