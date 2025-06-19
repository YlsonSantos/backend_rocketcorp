import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { EvaluationModule } from './evaluation/evaluation.module';
import { ReferencesModule } from './references/references.module';
import { UsersModule } from './users/users.module';
import { ScoreCycleModule } from './score-cycle/score-cycle.module';
import { MentoringModule } from './mentoring/mentoring.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    EvaluationModule,
    ReferencesModule,
    UsersModule,
    ScoreCycleModule,
    MentoringModule,
  ],
})
export class AppModule {}
