import { Module } from '@nestjs/common';
import { Evaluation360Controller } from './evaluation-360.controller';
import { Evaluation360Service } from './evaluation-360.service';
import { EvaluationService } from './evaluation.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { CryptoModule } from '../crypto/crypto.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, CryptoModule, NotificationsModule],
  controllers: [Evaluation360Controller],
  providers: [Evaluation360Service, EvaluationService],
  exports: [Evaluation360Service],
})
export class Evaluation360Module {}
