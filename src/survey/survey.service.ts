import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { CreateSurveyResponseDto } from './dto/create-survey-response.dto';
import { UpdateSurveyDto } from './dto/update-survey.dto';

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
        active: data.active ?? false,
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
      where: {
        active: true,
      },
    });
  }

  async setActive(id: string) {
    const survey = await this.prisma.survey.findUnique({
      where: { id },
    });

    if (!survey) {
      throw new ConflictException('Survey não encontrada');
    }

    await this.prisma.survey.update({
      where: { id },
      data: { active: true },
    });

    return {
      message: `Survey '${survey.title}' ativada com sucesso.`,
    };
  }

  async update(id: string, data: UpdateSurveyDto) {
    const survey = await this.prisma.survey.findUnique({
      where: { id },
    });

    if (!survey) {
      throw new ConflictException('Survey não encontrada');
    }

    if (survey.active) {
      throw new ConflictException('Não é possível atualizar uma survey ativa');
    }
    const updatedSurvey = await this.prisma.survey.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        endDate: data.endDate,
        questions: {
          deleteMany: {},
          create: (data.questions ?? []).map((q) => ({
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
      message: `Survey '${updatedSurvey.title}' atualizada com sucesso.`,
      surveyId: updatedSurvey.id,
      title: updatedSurvey.title,
    };
  }

  async findByCurrentCycle(cycleId: string) {
    const survey = await this.prisma.survey.findMany({
      where: {
        cycleId,
        active: true,
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
    const survey = await this.prisma.survey.findUnique({
      where: { id },
    });

    if (survey?.active) {
      throw new ConflictException('Não é possível deletar uma survey ativa');
    }

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
