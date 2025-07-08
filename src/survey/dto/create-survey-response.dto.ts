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
  @IsUUID()
  questionId: string;

  @IsOptional()
  @IsString()
  answerText?: string;

  @IsOptional()
  @IsNumber()
  answerScore?: number;
}

export class CreateSurveyResponseDto {
  @IsUUID()
  surveyId: string;

  @IsOptional()
  @IsUUID()
  userId?: string; // para manter anonimato se necessário

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSurveyAnswerDto)
  answers: CreateSurveyAnswerDto[];
}
