import { IsEnum, IsOptional, IsString, IsNotEmpty, MaxLength, Matches, MinLength } from 'class-validator';
import { Role } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'Maria da Silva' })
  @IsString({ message: 'Nome deve ser uma string válida' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  @Matches(/^[^\s<>'"]+$/, { message: 'Nome contém caracteres inválidos' })
  name: string;

  @ApiProperty({ example: 'maria@email.com' })
  @IsString({ message: 'Email deve ser uma string válida' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  @MaxLength(100, { message: 'Email deve ter no máximo 100 caracteres' })
  @Matches(/^[^\s<>'"]+$/, { message: 'Email contém caracteres inválidos' })
  email: string;

  @ApiProperty({ example: 'senhaSegura123' })
  @IsString({ message: 'Senha deve ser uma string válida' })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  @MaxLength(50, { message: 'Senha deve ter no máximo 50 caracteres' })
  password: string;

  @ApiProperty({ enum: Role, example: Role.COLABORADOR })
  @IsEnum(Role, { message: 'Role deve ser um valor válido' })
  role: Role;

  @ApiProperty({ example: 'pos123-uuid' })
  @IsString({ message: 'ID da posição deve ser uma string válida' })
  @IsNotEmpty({ message: 'ID da posição é obrigatório' })
  @MaxLength(50, { message: 'ID da posição deve ter no máximo 50 caracteres' })
  positionId: string;

  @ApiPropertyOptional({ example: 'manager-uuid-456' })
  @IsOptional()
  @IsString({ message: 'ID do manager deve ser uma string válida' })
  @MaxLength(50, { message: 'ID do manager deve ter no máximo 50 caracteres' })
  managerId?: string;
}
