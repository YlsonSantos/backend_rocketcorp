import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { AutomaticNotificationsService } from './automatic-notifications.service';
import { NotificationSettingsController } from './notification-settings.controller';
import { NotificationSettingsService } from './notification-settings.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [NotificationsController, NotificationSettingsController],
  providers: [
    NotificationsService,
    NotificationsGateway,
    AutomaticNotificationsService,
    NotificationSettingsService,
  ],
  exports: [NotificationsService, NotificationSettingsService, AutomaticNotificationsService],
})
export class NotificationsModule {} 