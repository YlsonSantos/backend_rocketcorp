import { Module } from '@nestjs/common';
import { ScoreService } from './score-cycle.service';
import { ScoreCycleController } from './score-cycle.controller';
import { EncryptionModule } from '../encryption/encryption.module';

@Module({
  imports: [EncryptionModule],
  controllers: [ScoreCycleController],
  providers: [ScoreService],
})
export class ScoreCycleModule {}
