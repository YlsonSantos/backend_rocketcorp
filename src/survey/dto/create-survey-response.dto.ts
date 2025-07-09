import {
  IsOptional,
  IsUUID,
  ValidateNested,
  IsArray,
  IsString,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSurveyAnswerDto {
  questionId: string;

  @IsOptional()
  @IsString()
  answerText?: string;

  @IsOptional()
  @IsNumber()
  answerScore?: number;
}

export class CreateSurveyResponseDto {
  surveyId: string;

  @IsOptional()
  userId?: string; // para manter anonimato se necessário

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSurveyAnswerDto)
  answers: CreateSurveyAnswerDto[];
}
