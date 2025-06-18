import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { Role } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Maria da Silva' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'maria@email.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'novaSenha123' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ enum: Role, example: Role.COLABORADOR })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ example: 'pos123-uuid' })
  @IsOptional()
  @IsString()
  positionId?: string;

  @ApiPropertyOptional({ example: 'manager-uuid-456' })
  @IsOptional()
  @IsString()
  managerId?: string;
}
