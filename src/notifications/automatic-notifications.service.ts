import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from './notifications.service';
import { NotificationSettingsService } from './notification-settings.service';
import { NotificationType, NotificationPriority } from '@prisma/client';

@Injectable()
export class AutomaticNotificationsService {
  private readonly logger = new Logger(AutomaticNotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private settingsService: NotificationSettingsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async checkEvaluationDeadlines() {
    this.logger.log('Verificando prazos de avaliação...');
    
    const activeCycles = await this.prisma.evaluationCycle.findMany({
      where: {
        endDate: { gte: new Date() },
      },
    });

    for (const cycle of activeCycles) {
      await this.sendEvaluationDeadlineNotifications(cycle);
    }
  }

  private async sendEvaluationDeadlineNotifications(cycle: any) {
    // Buscar configuração ativa para este ciclo
    const setting = await this.settingsService.getActiveSetting(
      cycle.id,
      NotificationType.EVALUATION_DUE,
    );

    if (!setting || !setting.enabled) {
      this.logger.log(`Notificações de prazo desabilitadas para ciclo ${cycle.name}`);
      return;
    }

    const reminderDate = new Date();
    reminderDate.setDate(reminderDate.getDate() + setting.reminderDays);

    const users = await this.prisma.user.findMany({
      where: {
        role: { not: 'RH' },
      },
    });

    for (const user of users) {
      const pendingEvaluations = await this.prisma.evaluation.findMany({
        where: {
          evaluatorId: user.id,
          cycleId: cycle.id,
          completed: false,
        },
      });

      if (pendingEvaluations.length > 0) {
        const message = setting.customMessage || 
          `Você tem ${pendingEvaluations.length} avaliação(ões) pendente(s) que vence(m) em ${setting.reminderDays} dias`;

        await this.notificationsService.createNotification({
          userId: user.id,
          type: NotificationType.EVALUATION_DUE,
          title: 'Avaliações Pendentes',
          message,
          priority: 'HIGH',
          metadata: {
            cycleId: cycle.id,
            pendingCount: pendingEvaluations.length,
            dueDate: reminderDate,
            settingId: setting.id,
          },
        });
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkGoalDeadlines() {
    this.logger.log('Verificando prazos de metas...');
    
    const activeCycles = await this.prisma.evaluationCycle.findMany({
      where: {
        endDate: { gte: new Date() },
      },
    });

    for (const cycle of activeCycles) {
      await this.sendGoalDeadlineNotifications(cycle);
    }
  }

  private async sendGoalDeadlineNotifications(cycle: any) {
    // Buscar configuração ativa para este ciclo
    const setting = await this.settingsService.getActiveSetting(
      cycle.id,
      NotificationType.GOAL_DEADLINE_APPROACHING,
    );

    if (!setting || !setting.enabled) {
      return;
    }

    const reminderDate = new Date();
    reminderDate.setDate(reminderDate.getDate() + setting.reminderDays);

    const goals = await this.prisma.goal.findMany({
      where: {
        actions: {
          some: {
            deadline: {
              lte: reminderDate,
              gte: new Date(),
            },
            completed: false,
          },
        },
      },
      include: {
        user: true,
        actions: {
          where: {
            deadline: { lte: reminderDate, gte: new Date() },
            completed: false,
          },
        },
      },
    });

    for (const goal of goals) {
      const message = setting.customMessage || 
        `A meta "${goal.title}" tem ações que vencem em ${setting.reminderDays} dias`;

      await this.notificationsService.createNotification({
        userId: goal.userId,
        type: NotificationType.GOAL_DEADLINE_APPROACHING,
        title: 'Prazo de Meta Aproximando',
        message,
        priority: 'HIGH',
        metadata: {
          goalId: goal.id,
          goalTitle: goal.title,
          deadline: reminderDate,
          daysRemaining: setting.reminderDays,
          settingId: setting.id,
        },
      });
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async checkSurveyReminders() {
    this.logger.log('Verificando lembretes de pesquisa...');
    
    const activeSurveys = await this.prisma.survey.findMany({
      where: {
        active: true,
        endDate: { gte: new Date() },
      },
      include: {
        cycle: true,
      },
    });

    for (const survey of activeSurveys) {
      await this.sendSurveyReminderNotifications(survey);
    }
  }

  private async sendSurveyReminderNotifications(survey: any) {
    // Buscar configuração ativa para este ciclo
    const setting = await this.settingsService.getActiveSetting(
      survey.cycleId,
      NotificationType.SURVEY_REMINDER,
    );

    if (!setting || !setting.enabled) {
      return;
    }

    const reminderDate = new Date();
    reminderDate.setDate(reminderDate.getDate() + setting.reminderDays);

    if (survey.endDate <= reminderDate) {
      const users = await this.prisma.user.findMany({
        where: {
          role: { not: 'RH' },
        },
      });

      for (const user of users) {
        // Verificar se o usuário já respondeu
        const existingResponse = await this.prisma.surveyResponse.findFirst({
          where: {
            surveyId: survey.id,
            userId: user.id,
          },
        });

        if (!existingResponse) {
          const message = setting.customMessage || 
            `A pesquisa "${survey.title}" termina em ${setting.reminderDays} dias. Participe!`;

          await this.notificationsService.createNotification({
            userId: user.id,
            type: NotificationType.SURVEY_REMINDER,
            title: 'Lembrete de Pesquisa',
            message,
            priority: 'MEDIUM',
            metadata: {
              surveyId: survey.id,
              surveyTitle: survey.title,
              endDate: survey.endDate,
              daysRemaining: setting.reminderDays,
              settingId: setting.id,
            },
          });
        }
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_11AM)
  async checkCycleEndings() {
    this.logger.log('Verificando fim de ciclos...');
    
    const endingCycles = await this.prisma.evaluationCycle.findMany({
      where: {
        endDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
        },
      },
    });

    for (const cycle of endingCycles) {
      await this.sendCycleEndingNotifications(cycle);
    }
  }

  private async sendCycleEndingNotifications(cycle: any) {
    // Buscar configuração ativa para este ciclo
    const setting = await this.settingsService.getActiveSetting(
      cycle.id,
      NotificationType.CYCLE_ENDING,
    );

    if (!setting || !setting.enabled) {
      return;
    }

    const daysUntilEnd = Math.ceil((cycle.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilEnd <= setting.reminderDays) {
      const users = await this.prisma.user.findMany({
        where: {
          role: { not: 'RH' },
        },
      });

      for (const user of users) {
        const message = setting.customMessage || 
          `O ciclo "${cycle.name}" termina em ${daysUntilEnd} dia(s). Finalize suas pendências!`;

        await this.notificationsService.createNotification({
          userId: user.id,
          type: NotificationType.CYCLE_ENDING,
          title: 'Ciclo Terminando',
          message,
          priority: 'HIGH',
          metadata: {
            cycleId: cycle.id,
            cycleName: cycle.name,
            daysUntilEnd,
            settingId: setting.id,
          },
        });
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_1PM)
  async checkMentorshipEvaluations() {
    this.logger.log('Verificando avaliações de mentoria...');
    
    const activeCycles = await this.prisma.evaluationCycle.findMany({
      where: {
        endDate: { gte: new Date() },
      },
    });

    for (const cycle of activeCycles) {
      await this.sendMentorshipEvaluationNotifications(cycle);
    }
  }

  private async sendMentorshipEvaluationNotifications(cycle: any) {
    // Buscar configuração ativa para este ciclo
    const setting = await this.settingsService.getActiveSetting(
      cycle.id,
      NotificationType.MENTORSHIP_EVALUATION_DUE,
    );

    if (!setting || !setting.enabled) {
      return;
    }

    const reminderDate = new Date();
    reminderDate.setDate(reminderDate.getDate() + setting.reminderDays);

    const mentors = await this.prisma.user.findMany({
      where: {
        mentorado: { isNot: null },
      },
    });

    for (const mentor of mentors) {
      // Verificar se já existe avaliação de mentoria
      const existingEvaluation = await this.prisma.mentorshipEvaluation.findFirst({
        where: {
          mentorId: mentor.id,
          cycleId: cycle.id,
        },
      });

      if (!existingEvaluation) {
        const message = setting.customMessage || 
          `Sua avaliação de mentoria para o ciclo "${cycle.name}" vence em ${setting.reminderDays} dias`;

        await this.notificationsService.createNotification({
          userId: mentor.id,
          type: NotificationType.MENTORSHIP_EVALUATION_DUE,
          title: 'Avaliação de Mentoria Pendente',
          message,
          priority: 'MEDIUM',
          metadata: {
            cycleId: cycle.id,
            cycleName: cycle.name,
            dueDate: reminderDate,
            settingId: setting.id,
          },
        });
      }
    }
  }
} 