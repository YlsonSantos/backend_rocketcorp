import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { EvaluationModule } from './evaluation/evaluation.module';
import { ReferencesModule } from './references/references.module';
import { UsersModule } from './users/users.module';
import { ScoreCycleModule } from './score-cycle/score-cycle.module';
import { MentoringModule } from './mentoring/mentoring.module';
import { EvaluationCriteriaModule } from './evaluation-criteria/evaluation-criteria.module';
import { GenaiModule } from './genai/genai.module';
import { Evaluation360Module } from './evaluation/evaluation-360.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    EvaluationModule,
    Evaluation360Module,
    ReferencesModule,
    UsersModule,
    ScoreCycleModule,
    MentoringModule,
    EvaluationCriteriaModule,
    GenaiModule,
  ],
})
export class AppModule {}
