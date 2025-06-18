import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateScoreDto } from './dto/create-score-cycle.dto';
import { UpdateScoreDto } from './dto/update-score-cycle.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ScoreService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createScoreDto: CreateScoreDto) {
    const { peerScores, ...scoreData } = createScoreDto;

    try {
      const score = await this.prisma.scorePerCycle.create({
        data: {
          ...scoreData,
          peerScores: peerScores
            ? {
                create: peerScores.map((value) => ({ value })),
              }
            : undefined,
        },
        include: { peerScores: true },
      });

      return score;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Já existe um ScorePerCycle para esse userId e cycleId.',
        );
      }

      throw error;
    }
  }

  async findAll() {
    return this.prisma.scorePerCycle.findMany({
      include: { peerScores: true, user: true, cycle: true },
    });
  }

  async findOne(id: string) {
    const score = await this.prisma.scorePerCycle.findUnique({
      where: { id },
      include: { peerScores: true, user: true, cycle: true },
    });

    if (!score) throw new NotFoundException(`Score ${id} not found`);
    return score;
  }

  async update(id: string, updateScoreDto: UpdateScoreDto) {
    const { peerScores, ...scoreData } = updateScoreDto;

    const existing = await this.prisma.scorePerCycle.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException(`Score ${id} not found`);

    const updatedScore = await this.prisma.scorePerCycle.update({
      where: { id },
      data: {
        ...scoreData,
        peerScores: peerScores
          ? {
              deleteMany: {},
              create: peerScores.map((value) => ({ value })),
            }
          : undefined,
      },
      include: { peerScores: true },
    });

    return updatedScore;
  }

  async remove(id: string) {
    await this.prisma.peerScore.deleteMany({
      where: { scorePerCycleId: id },
    });

    return this.prisma.scorePerCycle.delete({
      where: { id },
    });
  }
}
