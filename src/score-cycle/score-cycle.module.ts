import { Module } from '@nestjs/common';
import { ScoreService } from './score-cycle.service';
import { ScoreCycleController } from './score-cycle.controller';
import { CryptoModule } from '../crypto/crypto.module';

@Module({
  imports: [CryptoModule],
  controllers: [ScoreCycleController],
  providers: [ScoreService],
})
export class ScoreCycleModule {}
