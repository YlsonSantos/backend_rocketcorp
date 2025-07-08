import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class GoalService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createGoalDto: CreateGoalDto, userId: string) {
    const goal = await this.prisma.goal.create({
      data: {
        title: createGoalDto.title,
        type: createGoalDto.type,
        userId: userId,
      },
    });
    return goal;
  }

  async findFromUser(userId: string) {
    const userExists = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userExists) {
      throw new NotFoundException('User not found');
    }

    const goals = await this.prisma.goal.findMany({
      where: {
        userId,
      },
      include: {
        actions: true,
      },
    });
    return goals;
  }

  async update(id: string, updateGoalDto: UpdateGoalDto) {
    const goalExists = await this.prisma.goal.findUnique({
      where: { id },
    });

    if (!goalExists) {
      throw new NotFoundException('Goal not found');
    }

    const goal = await this.prisma.goal.update({
      where: { id },
      data: {
        title: updateGoalDto.title,
        type: updateGoalDto.type,
      },
    });

    return goal;
  }

  async remove(id: string) {
    const goalExists = await this.prisma.goal.findUnique({
      where: { id },
    });

    if (!goalExists) {
      throw new NotFoundException('Goal not found');
    }

    const goal = await this.prisma.goal.delete({
      where: { id },
    });

    return goal;
  }
}
