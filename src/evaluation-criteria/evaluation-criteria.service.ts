import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEvaluationCriterionDto } from './dto/create-evaluation-criterion.dto';
import { UpdateEvaluationCriterionDto } from './dto/update-evaluation-criterion.dto';
import { QueryEvaluationCriteriaDto } from './dto/query-evaluation-criteria.dto';
import { EvaluationCriterion, CriteriaAssignment } from '@prisma/client';

@Injectable()
export class EvaluationCriteriaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createDto: CreateEvaluationCriterionDto,
  ): Promise<EvaluationCriterion> {
    const { assignments, ...criterionData } = createDto;

    const criterion = await this.prisma.evaluationCriterion.create({
      data: criterionData,
    });

    if (assignments && assignments.length > 0) {
      await this.createAssignments(criterion.id, assignments);
    }

    return criterion;
  }

  async findAll(
    query: QueryEvaluationCriteriaDto = {},
  ): Promise<EvaluationCriterion[]> {
    const { track, positionId, teamId, type } = query;

    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (track || positionId || teamId) {
      where.assignments = {
        some: {},
      };

      if (positionId) {
        where.assignments.some.positionId = positionId;
      }

      if (teamId) {
        where.assignments.some.teamId = teamId;
      }

      if (track) {
        where.assignments.some.position = {
          track,
        };
      }
    }

    return this.prisma.evaluationCriterion.findMany({
      where,
      include: {
        assignments: {
          include: {
            position: true,
          },
        },
      },
    });
  }

  async findOne(id: string): Promise<EvaluationCriterion> {
    const criterion = await this.prisma.evaluationCriterion.findUnique({
      where: { id },
      include: {
        assignments: {
          include: {
            position: true,
          },
        },
      },
    });

    if (!criterion) {
      throw new NotFoundException('Critério de avaliação não encontrado');
    }

    return criterion;
  }

  async findByPosition(positionId: string): Promise<EvaluationCriterion[]> {
    return this.prisma.evaluationCriterion.findMany({
      where: {
        assignments: {
          some: {
            positionId,
          },
        },
      },
      include: {
        assignments: {
          where: {
            positionId,
          },
          include: {
            position: true,
          },
        },
      },
    });
  }

  async findByTrack(track: string): Promise<EvaluationCriterion[]> {
    return this.prisma.evaluationCriterion.findMany({
      where: {
        assignments: {
          some: {
            position: {
              track: track as any,
            },
          },
        },
      },
      include: {
        assignments: {
          include: {
            position: true,
          },
        },
      },
    });
  }

  async update(
    id: string,
    updateDto: UpdateEvaluationCriterionDto,
  ): Promise<EvaluationCriterion> {
    const { assignments, ...criterionData } = updateDto;

    // Check if criterion exists
    const existingCriterion = await this.prisma.evaluationCriterion.findUnique({
      where: { id },
    });

    if (!existingCriterion) {
      throw new NotFoundException('Critério de avaliação não encontrado');
    }

    // Update criterion
    await this.prisma.evaluationCriterion.update({
      where: { id },
      data: criterionData,
    });

    // Update assignments if provided
    if (assignments !== undefined) {
      // Delete existing assignments
      await this.prisma.criteriaAssignment.deleteMany({
        where: { criterionId: id },
      });

      // Create new assignments
      if (assignments.length > 0) {
        await this.createAssignments(id, assignments);
      }
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    // Check if criterion exists
    const criterion = await this.prisma.evaluationCriterion.findUnique({
      where: { id },
      include: {
        answers: true,
      },
    });

    if (!criterion) {
      throw new NotFoundException('Critério de avaliação não encontrado');
    }

    // Check if criterion has associated answers
    if (criterion.answers.length > 0) {
      throw new ConflictException(
        'Não é possível deletar um critério que possui respostas de avaliação associadas',
      );
    }

    // Delete assignments first
    await this.prisma.criteriaAssignment.deleteMany({
      where: { criterionId: id },
    });

    // Delete criterion
    await this.prisma.evaluationCriterion.delete({
      where: { id },
    });
  }

  async createAssignment(
    criterionId: string,
    assignmentData: {
      positionId: string;
      isRequired?: boolean;
    },
  ): Promise<CriteriaAssignment> {
    // Check if criterion exists
    const criterion = await this.prisma.evaluationCriterion.findUnique({
      where: { id: criterionId },
    });

    if (!criterion) {
      throw new NotFoundException('Critério de avaliação não encontrado');
    }

    // Check if assignment already exists
    const existingAssignment = await this.prisma.criteriaAssignment.findFirst({
      where: {
        criterionId,
        positionId: assignmentData.positionId,
      },
    });

    if (existingAssignment) {
      throw new ConflictException(
        'Esta atribuição já existe para o critério, posição e equipe especificados',
      );
    }

    return this.prisma.criteriaAssignment.create({
      data: {
        criterionId,
        positionId: assignmentData.positionId,
        isRequired: assignmentData.isRequired || false,
      },
      include: {
        position: true,
      },
    });
  }

  async updateAssignment(
    assignmentId: string,
    updateData: {
      isRequired?: boolean;
    },
  ): Promise<CriteriaAssignment> {
    const assignment = await this.prisma.criteriaAssignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      throw new NotFoundException('Atribuição não encontrada');
    }

    return this.prisma.criteriaAssignment.update({
      where: { id: assignmentId },
      data: updateData,
      include: {
        position: true,
      },
    });
  }

  async removeAssignment(assignmentId: string): Promise<void> {
    const assignment = await this.prisma.criteriaAssignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      throw new NotFoundException('Atribuição não encontrada');
    }

    await this.prisma.criteriaAssignment.delete({
      where: { id: assignmentId },
    });
  }

  private async createAssignments(
    criterionId: string,
    assignments: Array<{
      positionId: string;
      isRequired?: boolean;
    }>,
  ): Promise<void> {
    for (const assignment of assignments) {
      await this.createAssignment(criterionId, assignment);
    }
  }
}
