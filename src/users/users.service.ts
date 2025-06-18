import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
//import { CycleGroup, EvaluationOutput } from './typesPrisma';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

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
  }

  async findCompletedEvaluationsByCycle(userId: string) {
    const scores = await this.prisma.scorePerCycle.findMany({
      where: {
        userId: userId,
      },
      select: {
        cycleId: true,
        selfScore: true,
        peerScores: true,
        leaderScore: true,
        finalScore: true,
        feedback: true,
      },
    });

    return scores;
  }

  /*
  async findCompletedEvaluationsByCycle(userId: string): Promise<CycleGroup[]> {
    const evaluations = await this.prisma.evaluation.findMany({
      where: {
        evaluatedId: userId,
        completed: true,
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
            endDate: evaluation.cycle.endDate,
            scorePerCycle: score
              ? {
                  selfScore: score.selfScore,
                  peerScore: score.peerScore,
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
    */
}
