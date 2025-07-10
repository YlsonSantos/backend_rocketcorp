import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from './notifications.service';
import { NotificationType, NotificationPriority } from '@prisma/client';

@Injectable()
export class AutomaticNotificationsService {
  private readonly logger = new Logger(AutomaticNotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  // Verificar avaliações com prazo próximo (diariamente às 9h)
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkEvaluationDeadlines() {
    this.logger.log('Verificando prazos de avaliação...');
    
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    
    // Buscar ciclos ativos que terminam em 3 dias
    const activeCycles = await this.prisma.evaluationCycle.findMany({
      where: {
        endDate: {
          gte: now,
          lte: threeDaysFromNow,
        },
      },
      include: {
        evaluations: {
          where: { completed: false },
          include: {
            evaluator: true,
            evaluated: true,
          },
        },
      },
    });

    for (const cycle of activeCycles) {
      for (const evaluation of cycle.evaluations) {
        const daysUntilDeadline = Math.ceil(
          (cycle.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        await this.notificationsService.createNotification({
          userId: evaluation.evaluatorId,
          type: NotificationType.EVALUATION_DUE,
          title: 'Prazo de Avaliação',
          message: `Você tem ${daysUntilDeadline} dia(s) para completar a avaliação de ${evaluation.evaluated.name}.`,
          priority: daysUntilDeadline <= 1 ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
          metadata: {
            evaluationId: evaluation.id,
            cycleId: cycle.id,
            evaluatedId: evaluation.evaluatedId,
            daysUntilDeadline,
          },
        });
      }
    }
  }

  // Verificar início de ciclos (diariamente às 8h)
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async checkCycleStart() {
    this.logger.log('Verificando início de ciclos...');
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Buscar ciclos que começam hoje
    const startingCycles = await this.prisma.evaluationCycle.findMany({
      where: {
        startDate: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    for (const cycle of startingCycles) {
      // Buscar todos os usuários ativos
      const users = await this.prisma.user.findMany({
        where: { role: { not: 'RH' } }, // Excluir RH
      });

      for (const user of users) {
        await this.notificationsService.createNotification({
          userId: user.id,
          type: NotificationType.CYCLE_STARTED,
          title: 'Novo Ciclo de Avaliação',
          message: `O ciclo "${cycle.name}" começou hoje. Prepare-se para as avaliações!`,
          priority: NotificationPriority.MEDIUM,
          metadata: {
            cycleId: cycle.id,
            cycleName: cycle.name,
          },
        });
      }
    }
  }

  // Verificar fim de ciclos (diariamente às 17h)
  @Cron(CronExpression.EVERY_DAY_AT_5PM)
  async checkCycleEnd() {
    this.logger.log('Verificando fim de ciclos...');
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Buscar ciclos que terminam hoje
    const endingCycles = await this.prisma.evaluationCycle.findMany({
      where: {
        endDate: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    for (const cycle of endingCycles) {
      // Buscar usuários com avaliações pendentes
      const pendingEvaluations = await this.prisma.evaluation.findMany({
        where: {
          cycleId: cycle.id,
          completed: false,
        },
        include: {
          evaluator: true,
        },
      });

      for (const evaluation of pendingEvaluations) {
        await this.notificationsService.createNotification({
          userId: evaluation.evaluatorId,
          type: NotificationType.CYCLE_ENDING,
          title: 'Ciclo Terminando Hoje',
          message: `O ciclo "${cycle.name}" termina hoje. Complete suas avaliações pendentes!`,
          priority: NotificationPriority.HIGH,
          metadata: {
            cycleId: cycle.id,
            cycleName: cycle.name,
            evaluationId: evaluation.id,
          },
        });
      }
    }
  }

  // Verificar prazos de metas (diariamente às 10h)
  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async checkGoalDeadlines() {
    this.logger.log('Verificando prazos de metas...');
    
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // Buscar ações de metas com prazo próximo
    const goalActions = await this.prisma.goalAction.findMany({
      where: {
        deadline: {
          gte: now,
          lte: oneWeekFromNow,
        },
        completed: false,
      },
      include: {
        goal: {
          include: {
            user: true,
          },
        },
      },
    });

    for (const action of goalActions) {
      const daysUntilDeadline = Math.ceil(
        (action.deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      await this.notificationsService.createNotification({
        userId: action.goal.userId,
        type: NotificationType.GOAL_DEADLINE_APPROACHING,
        title: 'Prazo de Meta',
        message: `A ação "${action.description}" da meta "${action.goal.title}" vence em ${daysUntilDeadline} dia(s).`,
        priority: daysUntilDeadline <= 2 ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
        metadata: {
          goalId: action.goal.id,
          actionId: action.id,
          daysUntilDeadline,
        },
      });
    }
  }

  // Verificar novas pesquisas (diariamente às 9h)
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkNewSurveys() {
    this.logger.log('Verificando novas pesquisas...');
    
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Buscar pesquisas criadas nas últimas 24h
    const newSurveys = await this.prisma.survey.findMany({
      where: {
        createdAt: {
          gte: yesterday,
        },
        active: true,
      },
      include: {
        cycle: true,
      },
    });

    for (const survey of newSurveys) {
      // Buscar usuários que devem responder
      const users = await this.prisma.user.findMany({
        where: { role: { not: 'RH' } },
      });

      for (const user of users) {
        await this.notificationsService.createNotification({
          userId: user.id,
          type: NotificationType.SURVEY_AVAILABLE,
          title: 'Nova Pesquisa Disponível',
          message: `Uma nova pesquisa "${survey.title}" está disponível para o ciclo "${survey.cycle.name}".`,
          priority: NotificationPriority.MEDIUM,
          metadata: {
            surveyId: survey.id,
            cycleId: survey.cycle.id,
          },
        });
      }
    }
  }

  // Lembretes de pesquisas (diariamente às 14h)
  @Cron(CronExpression.EVERY_DAY_AT_2PM)
  async sendSurveyReminders() {
    this.logger.log('Enviando lembretes de pesquisas...');
    
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    
    // Buscar pesquisas que terminam em 3 dias
    const endingSurveys = await this.prisma.survey.findMany({
      where: {
        endDate: {
          gte: now,
          lte: threeDaysFromNow,
        },
        active: true,
      },
      include: {
        cycle: true,
        responses: {
          select: { userId: true },
        },
      },
    });

    for (const survey of endingSurveys) {
      const respondedUserIds = survey.responses
        .map(r => r.userId)
        .filter(id => id !== null);

      // Buscar usuários que ainda não responderam
      const usersToRemind = await this.prisma.user.findMany({
        where: {
          id: { notIn: respondedUserIds },
          role: { not: 'RH' },
        },
      });

      for (const user of usersToRemind) {
        const daysUntilEnd = Math.ceil(
          (survey.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        await this.notificationsService.createNotification({
          userId: user.id,
          type: NotificationType.SURVEY_REMINDER,
          title: 'Lembrete de Pesquisa',
          message: `A pesquisa "${survey.title}" termina em ${daysUntilEnd} dia(s). Responda agora!`,
          priority: daysUntilEnd <= 1 ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
          metadata: {
            surveyId: survey.id,
            daysUntilEnd,
          },
        });
      }
    }
  }

  // Verificar avaliações de mentoria (semanalmente às segundas às 9h)
  @Cron('0 9 * * 1')
  async checkMentorshipEvaluations() {
    this.logger.log('Verificando avaliações de mentoria...');
    
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // Buscar ciclos ativos que terminam em uma semana
    const activeCycles = await this.prisma.evaluationCycle.findMany({
      where: {
        endDate: {
          gte: now,
          lte: oneWeekFromNow,
        },
      },
    });

    for (const cycle of activeCycles) {
      // Buscar relacionamentos de mentoria
      const mentorships = await this.prisma.user.findMany({
        where: {
          mentorId: { not: null },
        },
        include: {
          mentor: true,
        },
      });

      for (const mentee of mentorships) {
        // Verificar se já existe avaliação de mentoria
        if (mentee.mentorId) {
          const existingEvaluation = await this.prisma.mentorshipEvaluation.findFirst({
            where: {
              mentorId: mentee.mentorId,
              menteeId: mentee.id,
              cycleId: cycle.id,
            },
          });

          if (!existingEvaluation) {
            await this.notificationsService.createNotification({
              userId: mentee.mentorId,
              type: NotificationType.MENTORSHIP_EVALUATION_DUE,
              title: 'Avaliação de Mentoria Pendente',
              message: `Você precisa avaliar seu mentorado ${mentee.name} para o ciclo "${cycle.name}".`,
              priority: NotificationPriority.MEDIUM,
              metadata: {
                cycleId: cycle.id,
                menteeId: mentee.id,
              },
            });
          }
        }
      }
    }
  }

  // Método para notificar quando uma avaliação é completada
  async notifyEvaluationCompleted(evaluationId: string) {
    const evaluation = await this.prisma.evaluation.findUnique({
      where: { id: evaluationId },
      include: {
        evaluator: true,
        evaluated: true,
        cycle: true,
      },
    });

    if (!evaluation) return;

    // Notificar o avaliado
    await this.notificationsService.createNotification({
      userId: evaluation.evaluatedId,
      type: NotificationType.EVALUATION_RECEIVED,
      title: 'Avaliação Recebida',
      message: `Você recebeu uma avaliação de ${evaluation.evaluator.name} para o ciclo "${evaluation.cycle.name}".`,
      priority: NotificationPriority.MEDIUM,
      metadata: {
        evaluationId: evaluation.id,
        cycleId: evaluation.cycle.id,
        evaluatorId: evaluation.evaluatorId,
      },
    });

    // Notificar o avaliador
    await this.notificationsService.createNotification({
      userId: evaluation.evaluatorId,
      type: NotificationType.EVALUATION_COMPLETED,
      title: 'Avaliação Concluída',
      message: `Você concluiu a avaliação de ${evaluation.evaluated.name} para o ciclo "${evaluation.cycle.name}".`,
      priority: NotificationPriority.LOW,
      metadata: {
        evaluationId: evaluation.id,
        cycleId: evaluation.cycle.id,
        evaluatedId: evaluation.evaluatedId,
      },
    });
  }

  // Método para notificar quando uma meta é completada
  async notifyGoalCompleted(goalId: string) {
    const goal = await this.prisma.goal.findUnique({
      where: { id: goalId },
      include: {
        user: true,
      },
    });

    if (!goal) return;

    await this.notificationsService.createNotification({
      userId: goal.userId,
      type: NotificationType.GOAL_COMPLETED,
      title: 'Meta Concluída',
      message: `Parabéns! Você concluiu a meta "${goal.title}".`,
      priority: NotificationPriority.MEDIUM,
      metadata: {
        goalId: goal.id,
      },
    });
  }

  // Método para notificar quando scores estão disponíveis
  async notifyScoreAvailable(scorePerCycleId: string) {
    const score = await this.prisma.scorePerCycle.findUnique({
      where: { id: scorePerCycleId },
      include: {
        user: true,
        cycle: true,
      },
    });

    if (!score) return;

    await this.notificationsService.createNotification({
      userId: score.userId,
      type: NotificationType.SCORE_AVAILABLE,
      title: 'Score Disponível',
      message: `Seu score para o ciclo "${score.cycle.name}" está disponível.`,
      priority: NotificationPriority.MEDIUM,
      metadata: {
        scorePerCycleId: score.id,
        cycleId: score.cycle.id,
      },
    });
  }
} 