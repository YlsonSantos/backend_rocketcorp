import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMentoringDto } from './dto/create-mentoring.dto';
import { EncryptedPrismaService } from '../encryption/encrypted-prisma.service';

@Injectable()
export class MentoringService {
  constructor(
    private prisma: PrismaService,
    private encryptedPrisma: EncryptedPrismaService,
  ) {}
  async create(dto: CreateMentoringDto) {
    try {
      return await this.encryptedPrisma.create('mentorshipEvaluation', {
        data: {
          mentorId: dto.mentorId,
          menteeId: dto.menteeId,
          cycleId: dto.cycleId,
          score: dto.score,
          feedback: dto.feedback,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'Avaliação de mentoria já existe para esse mentor, mentorado e ciclo.',
        );
      }
      throw error;
    }
  }

  async findAll() {
    const results = await this.encryptedPrisma.findMany(
      'mentorshipEvaluation',
      {
        include: {
          mentor: true,
          mentee: true,
          cycle: true,
        },
      },
    );
    return results;
  }

  async findOne(id: string) {
    const evaluation = await this.encryptedPrisma.findUnique(
      'mentorshipEvaluation',
      {
        where: { id },
        include: {
          mentor: true,
          mentee: true,
          cycle: true,
        },
      },
    );

    if (!evaluation) {
      throw new Error('Avaliação de mentoria não encontrada');
    }
    return evaluation;
  }

  async remove(id: string) {
    const evaluation = await this.encryptedPrisma.findUnique(
      'mentorshipEvaluation',
      { where: { id } },
    );
    if (!evaluation) {
      throw new Error('Avaliação de mentoria não encontrada');
    }
    return this.prisma.mentorshipEvaluation.delete({ where: { id } });
  }
}
