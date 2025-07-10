import { IsString, IsEnum, IsArray } from 'class-validator';
import { CriterionType } from '@prisma/client';
export class CreateNextCycleCriterionDto {
  id?: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(CriterionType)
  type: CriterionType;

  @IsArray()
  @IsString({ each: true })
  positions: string[];
}
