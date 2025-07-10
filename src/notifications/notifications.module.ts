import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsGateway } from './notifications.gateway';
import { AutomaticNotificationsService } from './automatic-notifications.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [PrismaModule, JwtModule, ScheduleModule.forRoot()],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway, AutomaticNotificationsService],
  exports: [NotificationsService, AutomaticNotificationsService],
})
export class NotificationsModule {} 