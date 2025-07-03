import { Module } from '@nestjs/common';
import { ScoreService } from './score-cycle.service';
import { ScoreCycleController } from './score-cycle.controller';

@Module({
  controllers: [ScoreCycleController],
  providers: [ScoreService],
})
export class ScoreCycleModule {}
