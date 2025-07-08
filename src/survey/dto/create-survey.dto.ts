import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSurveyQuestionDto {
  @IsNotEmpty()
  @IsString()
  text: string;

  @IsNotEmpty()
  @IsString()
  type: 'TEXT' | 'NUMBER' | 'YESORNO'; // ou use enum se preferir
}

export class CreateSurveyDto {
  @IsNotEmpty()
  cycleId: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  endDate: Date;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSurveyQuestionDto)
  questions: CreateSurveyQuestionDto[];
}
