import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGoalActionDto } from './dto/create-goal-action.dto';
import { UpdateGoalActionDto } from './dto/update-goal-action.dto';

@Injectable()
export class GoalService {
  constructor(private readonly prisma: PrismaService) {}

  async createGoal(createGoalDto: CreateGoalDto, userId: string) {
    const goal = await this.prisma.goal.create({
      data: {
        ...createGoalDto,
        userId,
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
      select: {
        id: true,
        title: true,
        // description: true,
        type: true,
        actions: {
          select: {
            id: true,
            // description: true,
            deadline: true,
            completed: true,
          },
        },
      },
    });
    return goals;
  }

  async updateGoal(id: string, updateGoalDto: UpdateGoalDto) {
    const goalExists = await this.prisma.goal.findUnique({
      where: { id },
    });

    if (!goalExists) {
      throw new NotFoundException('Goal not found');
    }

    const goal = await this.prisma.goal.update({
      where: { id },
      data: updateGoalDto,
    });

    return goal;
  }

  async removeGoal(id: string) {
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

  async createGoalAction(createGoalActionDto: CreateGoalActionDto, id: string) {
    const goalExists = await this.prisma.goal.findUnique({
      where: { id },
    });

    if (!goalExists) {
      throw new NotFoundException('Goal not found');
    }

    const goalAction = await this.prisma.goalAction.create({
      data: {
        description: createGoalActionDto.description,
        deadline: createGoalActionDto.deadline,
        goalId: id,
      },
    });

    return goalAction;
  }

  async updateGoalAction(updateGoalActionDto: UpdateGoalActionDto, id: string) {
    const goalActionExists = await this.prisma.goalAction.findUnique({
      where: { id },
    });

    if (!goalActionExists) {
      throw new NotFoundException('Goal action not found');
    }

    const goalAction = await this.prisma.goalAction.update({
      where: { id },
      data: {
        description: updateGoalActionDto.description,
        deadline: updateGoalActionDto.deadline,
        completed: updateGoalActionDto.completed,
      },
    });

    return goalAction;
  }

  async removeGoalAction(id: string) {
    const goalActionExists = await this.prisma.goalAction.findUnique({
      where: { id },
    });

    if (!goalActionExists) {
      throw new NotFoundException('Goal action not found');
    }

    const goalAction = await this.prisma.goalAction.delete({
      where: { id },
    });

    return goalAction;
  }
}
