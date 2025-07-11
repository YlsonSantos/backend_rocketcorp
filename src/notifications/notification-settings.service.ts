import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from './notifications.service';
import { CreateNotificationSettingDto, UpdateNotificationSettingDto } from './dto/notification-settings.dto';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationSettingsService {
  private readonly logger = new Logger(NotificationSettingsService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async createSetting(cycleId: string, createDto: CreateNotificationSettingDto) {
    // Verificar se o ciclo existe
    const cycle = await this.prisma.evaluationCycle.findUnique({
      where: { id: cycleId },
    });

    if (!cycle) {
      throw new NotFoundException('Ciclo não encontrado');
    }

    // Verificar se já existe configuração para este tipo
    const existing = await this.prisma.cycleNotificationSetting.findUnique({
      where: {
        cycleId_notificationType: {
          cycleId,
          notificationType: createDto.notificationType,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Já existe configuração para ${createDto.notificationType} neste ciclo`,
      );
    }

    const setting = await this.prisma.cycleNotificationSetting.create({
      data: {
        cycleId,
        notificationType: createDto.notificationType,
        enabled: createDto.enabled ?? true,
        reminderDays: createDto.reminderDays ?? 3,
        customMessage: createDto.customMessage,
        scheduledTime: createDto.scheduledTime,
        frequency: createDto.frequency,
        weekDay: createDto.weekDay,
        userFilters: createDto.userFilters,
        priority: createDto.priority ?? 'MEDIUM',
      },
    });

    this.logger.log(`Configuração ${setting.notificationType} criada para ciclo ${cycle.name}`);
    return setting;
  }

  async getSettings(cycleId: string) {
    const settings = await this.prisma.cycleNotificationSetting.findMany({
      where: { cycleId },
      orderBy: { createdAt: 'asc' },
    });

    return settings;
  }

  async updateSetting(
    cycleId: string,
    notificationType: string,
    updateDto: UpdateNotificationSettingDto,
  ) {
    const setting = await this.prisma.cycleNotificationSetting.findUnique({
      where: {
        cycleId_notificationType: {
          cycleId,
          notificationType: notificationType as NotificationType,
        },
      },
    });

    if (!setting) {
      throw new NotFoundException('Configuração não encontrada');
    }

    const updated = await this.prisma.cycleNotificationSetting.update({
      where: { id: setting.id },
      data: {
        enabled: updateDto.enabled,
        reminderDays: updateDto.reminderDays,
        customMessage: updateDto.customMessage,
      },
    });

    this.logger.log(`Configuração ${updated.notificationType} atualizada`);
    return updated;
  }

  async deleteSetting(cycleId: string, notificationType: string) {
    const setting = await this.prisma.cycleNotificationSetting.findUnique({
      where: {
        cycleId_notificationType: {
          cycleId,
          notificationType: notificationType as NotificationType,
        },
      },
    });

    if (!setting) {
      throw new NotFoundException('Configuração não encontrada');
    }

    await this.prisma.cycleNotificationSetting.delete({
      where: { id: setting.id },
    });

    this.logger.log(`Configuração ${setting.notificationType} removida`);
    return { message: 'Configuração removida com sucesso' };
  }

  async testNotifications(cycleId: string) {
    const cycle = await this.prisma.evaluationCycle.findUnique({
      where: { id: cycleId },
    });

    if (!cycle) {
      throw new NotFoundException('Ciclo não encontrado');
    }

    // Buscar configurações ativas
    const settings = await this.prisma.cycleNotificationSetting.findMany({
      where: {
        cycleId,
        enabled: true,
      },
    });

    if (settings.length === 0) {
      return { message: 'Nenhuma configuração ativa encontrada para teste' };
    }

    // Buscar usuários para teste (excluir RH)
    const users = await this.prisma.user.findMany({
      where: { role: { not: 'RH' } },
      take: 3, // Limitar a 3 usuários para teste
    });

    const results = [];

    for (const user of users) {
      for (const setting of settings) {
        const message = setting.customMessage || 
          `Teste: Notificação ${setting.notificationType} para o ciclo ${cycle.name}`;

        const notification = await this.notificationsService.createNotification({
          userId: user.id,
          type: setting.notificationType,
          title: `Teste - ${setting.notificationType}`,
          message,
          priority: 'MEDIUM',
          metadata: {
            cycleId: cycle.id,
            cycleName: cycle.name,
            testNotification: true,
            settingId: setting.id,
          },
        });

        results.push({
          userId: user.id,
          userName: user.name,
          notificationType: setting.notificationType,
          notification,
        });
      }
    }

    return {
      message: `${results.length} notificações de teste enviadas`,
      results,
    };
  }

  // Método para buscar configuração ativa
  async getActiveSetting(cycleId: string, notificationType: NotificationType) {
    return this.prisma.cycleNotificationSetting.findUnique({
      where: {
        cycleId_notificationType: {
          cycleId,
          notificationType,
        },
      },
    });
  }
} 