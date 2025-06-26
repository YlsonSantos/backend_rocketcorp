import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
//import { CreateUserDto } from './dto/create-user.dto';
//import { UpdateUserDto } from './dto/update-user.dto';
import { CycleGroup, EvaluationOutput } from './typesPrisma';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}
  /*
  create(createUserDto: CreateUserDto) {
    return this.prisma.user.create({
      data: createUserDto,
    });
  }

  findAll() {
    return this.prisma.user.findMany({
      include: {
        position: true,
        manager: true,
        teamMemberships: true,
      },
    });
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  remove(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }*/

  findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        position: true,
        manager: true,
        evaluationsGiven: true,
        evaluationsReceived: true,
      },
    });
  }

  async findEvaluationsByCycle(userId: string) {
    const allCycles = await this.prisma.evaluationCycle.findMany({
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        reviewDate: true,
      },
    });

    const userScores = await this.prisma.scorePerCycle.findMany({
      where: { userId },
      select: {
        cycleId: true,
        selfScore: true,
        leaderScore: true,
        finalScore: true,
        feedback: true,
        peerScores: {
          select: {
            value: true,
          },
        },
      },
    });

    const scoreMap = new Map(userScores.map((score) => [score.cycleId, score]));

    const merged = allCycles.map((cycle) => {
      const score = scoreMap.get(cycle.id);

      if (score) {
        return {
          cycleId: cycle.id,
          name: cycle.name,
          startDate: cycle.startDate,
          reviewDate: cycle.reviewDate,
          endDate: cycle.endDate,
          selfScore: score.selfScore,
          leaderScore: score.leaderScore,
          finalScore: score.finalScore,
          feedback: score.feedback,
          peerScores: score.peerScores.map((p) => p.value),
        };
      }

      return {
        cycleId: cycle.id,
        name: cycle.name,
        startDate: cycle.startDate,
        reviewDate: cycle.reviewDate,
        endDate: cycle.endDate,
        selfScore: null,
        leaderScore: null,
        finalScore: null,
        feedback: null,
        peerScores: [],
      };
    });

    return merged;
  }

  async findEvolutionsByUserId(userId: string): Promise<CycleGroup[]> {
    const evaluations = await this.prisma.evaluation.findMany({
      where: {
        evaluatedId: userId,
        completed: true,
        type: 'AUTO',
      },
      include: {
        cycle: true,
        evaluated: {
          select: {
            id: true,
            name: true,
            position: {
              select: {
                name: true,
              },
            },
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        answers: {
          include: {
            criterion: {
              select: {
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        cycle: {
          endDate: 'desc',
        },
      },
    });

    const scores = await this.prisma.scorePerCycle.findMany({
      where: {
        userId: userId,
      },
    });

    if (!evaluations.length) {
      return [];
    }

    const groupedByCycle = evaluations.reduce(
      (acc: CycleGroup[], evaluation) => {
        let cycleGroup = acc.find(
          (group) => group.cycleId === evaluation.cycle.id,
        );

        if (!cycleGroup) {
          const score = scores.find((s) => s.cycleId === evaluation.cycle.id);

          cycleGroup = {
            cycleId: evaluation.cycle.id,
            cycleName: evaluation.cycle.name,
            startDate: evaluation.cycle.startDate,
            reviewDate: evaluation.cycle.reviewDate,
            endDate: evaluation.cycle.endDate,
            scorePerCycle: score
              ? {
                  selfScore: score.selfScore,
                  leaderScore: score.leaderScore,
                  finalScore: score.finalScore,
                  feedback: score.feedback,
                }
              : null,
            evaluations: [],
          };
          acc.push(cycleGroup);
        }

        const evaluationOutput: EvaluationOutput = {
          evaluationId: evaluation.id,
          completedAt: evaluation.createdAt,
          evaluationType: evaluation.type,
          evaluatedUser: {
            id: evaluation.evaluated.id,
            name: evaluation.evaluated.name,
            position: evaluation.evaluated.position.name,
          },
          team: evaluation.team,
          answers: evaluation.answers.map((answer) => ({
            criterion: answer.criterion.title,
            score: answer.score,
            justification: answer.justification,
          })),
        };

        cycleGroup.evaluations.push(evaluationOutput);
        return acc;
      },
      [],
    );

    return groupedByCycle;
  }

  async findAutoavaliationByUserId(userId: string) {
    return await this.prisma.evaluation.findMany({
      where: {
        evaluatedId: userId,
        type: 'AUTO',
        completed: true,
      },
      include: {
        answers: {
          include: {
            criterion: true,
          },
        },
        cycle: true,
      },
    });
  }

  async findAllCurrentCycle() {
    const now = new Date();

    // Tenta buscar um ciclo aberto
    let currentCycle = await this.prisma.evaluationCycle.findFirst({
      where: {
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    if (!currentCycle) {
      currentCycle = await this.prisma.evaluationCycle.findFirst({
        where: {
          endDate: { lt: now },
        },
        orderBy: {
          endDate: 'desc',
        },
      });

      if (!currentCycle) {
        throw new Error('Não há ciclos disponíveis (abertos ou encerrados).');
      }
    }

    const users = await this.prisma.user.findMany({
      include: {
        scorePerCycle: {
          where: {
            cycleId: currentCycle.id,
          },
        },
      },
    });

    return {
      ciclo_atual_ou_ultimo: currentCycle,
      usuarios: users,
    };
  }
}
