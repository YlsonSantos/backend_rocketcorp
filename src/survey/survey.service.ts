import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { CreateSurveyResponseDto } from './dto/create-survey-response.dto';

@Injectable()
export class SurveyService {
  constructor(private prisma: PrismaService) {}

  async createSurvey(data: CreateSurveyDto) {
    const createdSurvey = await this.prisma.survey.create({
      data: {
        cycleId: data.cycleId,
        title: data.title,
        description: data.description,
        endDate: data.endDate,
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

    return {
      message: `Survey '${createdSurvey.title}' criada com sucesso.`,
      surveyId: createdSurvey.id,
      title: createdSurvey.title,
    };
  }

  async findAll() {
    return this.prisma.survey.findMany({
      include: { questions: true },
    });
  }

  async findByCurrentCycle(cycleId: string) {
    const survey = await this.prisma.survey.findFirst({
      where: {
        cycleId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        questions: true,
      },
    });

    if (!survey) {
      return {
        message: 'Nenhuma survey encontrada para o ciclo informado.',
      };
    }

    return survey;
  }

  async delete(id: string) {
    await this.prisma.surveyAnswer.deleteMany({
      where: {
        response: {
          surveyId: id,
        },
      },
    });

    await this.prisma.surveyResponse.deleteMany({
      where: {
        surveyId: id,
      },
    });

    await this.prisma.surveyQuestion.deleteMany({
      where: {
        surveyId: id,
      },
    });

    await this.prisma.survey.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Survey deletada com sucesso.',
      surveyId: id,
    };
  }

  async createSurveyResponse(data: CreateSurveyResponseDto) {
    if (data.userId) {
      const exists = await this.prisma.surveyResponse.findFirst({
        where: { surveyId: data.surveyId, userId: data.userId },
      });
      if (exists) {
        throw new ConflictException('Usuário já respondeu esta pesquisa');
      }
    }

    await this.prisma.surveyResponse.create({
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
    });

    return {
      message: 'Resposta registrada com sucesso.',
      surveyId: data.surveyId,
    };
  }
}
