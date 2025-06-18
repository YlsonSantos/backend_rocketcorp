import { Module } from '@nestjs/common';
import { ReferencesService } from './references.service';
import { ReferencesController } from './references.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  controllers: [ReferencesController],
  providers: [ReferencesService, PrismaService, RolesGuard],
})
export class ReferencesModule {}
