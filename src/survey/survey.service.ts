import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { CreateSurveyResponseDto } from './dto/create-survey-response.dto';
import { UpdateSurveyDto } from './dto/update-survey.dto';
import { CryptoService } from '../crypto/crypto.service';

@Injectable()
export class SurveyService {
  constructor(
    private prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {}

  async createSurvey(data: CreateSurveyDto) {
    const encryptedQuestions = data.questions.map((q) => ({
      text: this.crypto.encrypt(q.text),
      type: q.type,
    }));

    const createdSurvey = await this.prisma.survey.create({
      data: {
        cycleId: data.cycleId,
        title: data.title,
        description: data.description,
        endDate: data.endDate,
        active: data.active ?? false,
        questions: {
          create: encryptedQuestions,
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
    const surveys = await this.prisma.survey.findMany({
      include: { questions: true },
    });

    // Descriptografar o campo text de cada pergunta
    return surveys.map((survey) => {
      survey.questions = survey.questions.map((q) =>
        this.crypto.deepDecrypt(q, 'SurveyQuestion'),
      );
      return survey;
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

    const encryptedQuestions = (data.questions ?? []).map((q) => ({
      text: this.crypto.encrypt(q.text),
      type: q.type,
    }));

    const updatedSurvey = await this.prisma.survey.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        endDate: data.endDate,
        questions: {
          deleteMany: {},
          create: encryptedQuestions,
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

    const decrypted = survey.map((s) => {
      const surveyDecrypted = this.crypto.deepDecrypt(s, 'Survey');
      surveyDecrypted.questions = surveyDecrypted.questions.map((q: any) =>
        this.crypto.deepDecrypt(q, 'SurveyQuestion'),
      );
      return surveyDecrypted;
    });

    return decrypted;
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

    const encryptedAnswers = data.answers.map((answer) => ({
      answerText: answer.answerText
        ? this.crypto.encrypt(answer.answerText)
        : null,
      answerScore:
        answer.answerScore != null ? Number(answer.answerScore) : null,
      question: {
        connect: { id: answer.questionId },
      },
    }));

    await this.prisma.surveyResponse.create({
      data: {
        surveyId: data.surveyId,
        userId: data.userId ?? null,
        answers: {
          create: encryptedAnswers,
        },
      },
    });

    return {
      message: 'Resposta registrada com sucesso.',
      surveyId: data.surveyId,
    };
  }
}
