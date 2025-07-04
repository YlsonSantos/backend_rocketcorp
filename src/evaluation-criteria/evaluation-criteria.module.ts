import { Module } from '@nestjs/common';
import { EvaluationCriteriaController } from './evaluation-criteria.controller';
import { EvaluationCriteriaService } from './evaluation-criteria.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [EvaluationCriteriaController],
  providers: [EvaluationCriteriaService, PrismaService],
  exports: [EvaluationCriteriaService],
})
export class EvaluationCriteriaModule {}
