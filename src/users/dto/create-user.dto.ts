import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Role } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'Maria da Silva' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'maria@email.com' })
  @IsString()
  email: string;

  @ApiProperty({ example: 'senhaSegura123' })
  @IsString()
  password: string;

  @ApiProperty({ enum: Role, example: Role.COLABORADOR })
  @IsEnum(Role)
  role: Role;

  @ApiProperty({ example: 'pos123-uuid' })
  @IsString()
  positionId: string;

  @ApiPropertyOptional({ example: 'manager-uuid-456' })
  @IsOptional()
  @IsString()
  managerId?: string;
}
