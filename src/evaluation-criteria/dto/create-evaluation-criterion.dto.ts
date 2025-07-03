import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  IsUUID,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CriterionType } from '@prisma/client';

export class CriteriaAssignmentDto {
  @ApiProperty({
    description: 'ID da posição',
    example: 'position-uuid',
  })
  @IsUUID('4', { message: 'ID da posição deve ser um UUID válido' })
  @IsNotEmpty({ message: 'ID da posição é obrigatório' })
  positionId: string;

  @ApiProperty({
    description: 'Se o critério é obrigatório para esta atribuição',
    example: false,
    default: false,
  })
  @IsBoolean({ message: 'Campo isRequired deve ser um valor booleano' })
  @IsOptional()
  isRequired?: boolean;
}

export class CreateEvaluationCriterionDto {
  @ApiProperty({
    description: 'Título do critério de avaliação',
    example: 'Comunicação Efetiva',
  })
  @IsString({ message: 'Título deve ser uma string' })
  @IsNotEmpty({ message: 'Título é obrigatório' })
  title: string;

  @ApiProperty({
    description: 'Descrição detalhada do critério',
    example: 'Capacidade de comunicar ideias de forma clara e eficaz',
  })
  @IsString({ message: 'Descrição deve ser uma string' })
  @IsNotEmpty({ message: 'Descrição é obrigatória' })
  description: string;

  @ApiProperty({
    description: 'Tipo do critério',
    enum: CriterionType,
    example: 'GESTAO',
  })
  @IsEnum(CriterionType, {
    message: 'Tipo deve ser GESTAO, EXECUCAO, COMPORTAMENTO, AV360 ou FROMETL',
  })
  @IsNotEmpty({ message: 'Tipo é obrigatório' })
  type: CriterionType;

  @ApiProperty({
    description: 'Peso do critério (1-10)',
    example: 5,
    minimum: 1,
    maximum: 10,
  })
  @IsNumber({}, { message: 'Peso deve ser um número' })
  @Min(1, { message: 'Peso deve ser no mínimo 1' })
  @Max(10, { message: 'Peso deve ser no máximo 10' })
  @IsOptional()
  weight?: number;

  @ApiProperty({
    description: 'Atribuições do critério para posições',
    type: [CriteriaAssignmentDto],
    required: false,
  })
  @IsArray({ message: 'Atribuições deve ser um array' })
  @ValidateNested({ each: true })
  @Type(() => CriteriaAssignmentDto)
  @IsOptional()
  assignments?: CriteriaAssignmentDto[];
} 