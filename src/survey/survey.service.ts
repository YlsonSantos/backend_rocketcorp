import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { CreateSurveyResponseDto } from './dto/create-survey-response.dto';

@Injectable()
export class SurveyService {
  constructor(private prisma: PrismaService) {}

  async createSurvey(data: CreateSurveyDto) {
    return this.prisma.survey.create({
      data: {
        cycleId: data.cycleId,
        title: data.title,
        description: data.description,
        questions: {
          create: data.questions.map((q) => ({
            text: q.text,
            type: q.type,
          })),
        },
      },
      include: {
        questions: true,
      },
    });
  }

  async findAll() {
    return this.prisma.survey.findMany({
      include: { questions: true },
    });
  }

  async findOne(id: string) {
    return this.prisma.survey.findUnique({
      where: { id },
      include: { questions: true },
    });
  }

  async delete(id: string) {
    return this.prisma.survey.delete({
      where: { id },
    });
  }

  async createSurveyResponse(data: CreateSurveyResponseDto) {
    if (data.userId) {
      const exists = await this.prisma.surveyResponse.findFirst({
        where: { surveyId: data.surveyId, userId: data.userId },
      });
      if (exists)
        throw new ConflictException('Usuário já respondeu esta pesquisa');
    }
    return this.prisma.surveyResponse.create({
      data: {
        surveyId: data.surveyId,
        userId: data.userId ?? null,
        answers: {
          create: data.answers.map((answer) => ({
            questionId: answer.questionId,
            answerText: answer.answerText,
            answerScore: answer.answerScore,
          })),
        },
      },
      include: {
        answers: true,
      },
    });
  }
}
