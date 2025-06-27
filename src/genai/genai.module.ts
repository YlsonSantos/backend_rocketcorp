import { Module } from '@nestjs/common';
import { GenaiController } from './genai.controller';
import { GenaiService } from './genai.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GenaiController],
  providers: [GenaiService],
  exports: [GenaiService],
})
export class GenaiModule {}
