import { Module } from '@nestjs/common';
import { MentoringService } from './mentoring.service';
import { MentoringController } from './mentoring.controller';
import { EncryptionModule } from '../encryption/encryption.module';

@Module({
  imports: [EncryptionModule],
  controllers: [MentoringController],
  providers: [MentoringService],
})
export class MentoringModule {}
