import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateEvaluationCriterionDto,
  UpdateEvaluationCriterionBulkDto,
} from './dto/create-evaluation-criterion.dto';
import { UpdateEvaluationCriterionDto } from './dto/update-evaluation-criterion.dto';
import { QueryEvaluationCriteriaDto } from './dto/query-evaluation-criteria.dto';
import { EvaluationCriterion, CriteriaAssignment } from '@prisma/client';
import { UpsertEvaluationCriteriaDto } from './dto/upsert-evaluation-criteria.dto';

@Injectable()
export class EvaluationCriteriaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createDto: CreateEvaluationCriterionDto,
  ): Promise<EvaluationCriterion> {
    const { assignments, positionId, isRequired, ...criterionData } = createDto;

    const criterion = await this.prisma.evaluationCriterion.create({
      data: criterionData,
    });

    // Create assignment if positionId is provided
    if (positionId) {
      await this.createAssignment(criterion.id, {
        positionId,
        isRequired: isRequired || false,
      });
    }

    // Create assignments if provided
    if (assignments && assignments.length > 0) {
      await this.createAssignments(criterion.id, assignments);
    }

    return criterion;
  }

  async findAll(
    query: QueryEvaluationCriteriaDto = {},
  ): Promise<EvaluationCriterion[]> {
    const { track, positionId, type } = query;

    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (track || positionId) {
      where.assignments = {
        some: {},
      };

      if (positionId) {
        where.assignments.some.positionId = positionId;
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
    try {
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

      // Use transaction to ensure data consistency
      await this.prisma.$transaction(async (prisma) => {
        // Delete assignments first
        await prisma.criteriaAssignment.deleteMany({
          where: { criterionId: id },
        });

        // Delete criterion
        await prisma.evaluationCriterion.delete({
          where: { id },
        });
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Erro ao deletar critério: ${error.message}`,
      );
    }
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
      // If assignment exists, update it if isRequired changed
      if (existingAssignment.isRequired !== assignmentData.isRequired) {
        return this.prisma.criteriaAssignment.update({
          where: { id: existingAssignment.id },
          data: {
            isRequired: assignmentData.isRequired || false,
          },
          include: {
            position: true,
          },
        });
      }
      // Return existing assignment if no changes needed
      return existingAssignment;
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

  async createBulk(
    createDtos: CreateEvaluationCriterionDto[],
  ): Promise<EvaluationCriterion[]> {
    const results: EvaluationCriterion[] = [];

    for (const createDto of createDtos) {
      const criterion = await this.create(createDto);
      results.push(criterion);
    }

    return results;
  }

  async updateBulk(
    updateDtos: UpdateEvaluationCriterionBulkDto[],
  ): Promise<EvaluationCriterion[]> {
    const results: EvaluationCriterion[] = [];

    for (const updateDto of updateDtos) {
      const { id, ...criterionData } = updateDto;
      const criterion = await this.update(id, criterionData as any);
      results.push(criterion);
    }

    return results;
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

  async upsertCriteria(upsertDto: UpsertEvaluationCriteriaDto) {
    const { create, update } = upsertDto;

    const results: {
      created: any[];
      updated: any[];
      unchanged: any[];
      errors: Array<{
        type: string;
        id?: string;
        data?: any;
        error: string;
      }>;
    } = {
      created: [],
      updated: [],
      unchanged: [],
      errors: [],
    };

    try {
      // Process updates first
      if (update && update.length > 0) {
        for (const updateDto of update) {
          try {
            const { id, ...updateData } = updateDto;

            // Check if criterion exists and get current data
            const existingCriterion =
              await this.prisma.evaluationCriterion.findUnique({
                where: { id },
              });

            if (!existingCriterion) {
              results.errors.push({
                type: 'update',
                id: updateDto.id,
                error: 'Critério não encontrado',
              });
              continue;
            }

            // Check if there are actual changes
            const hasChanges =
              existingCriterion.title !== updateData.title ||
              existingCriterion.description !== updateData.description ||
              existingCriterion.type !== updateData.type;

            if (hasChanges) {
              const updated = await this.update(id, updateData);
              results.updated.push(updated);
            } else {
              results.unchanged.push(existingCriterion);
            }
          } catch (error) {
            results.errors.push({
              type: 'update',
              id: updateDto.id,
              error: error.message,
            });
          }
        }
      }

      // Process creates
      if (create && create.length > 0) {
        for (const createDto of create) {
          try {
            const created = await this.create(createDto);
            results.created.push(created);
          } catch (error) {
            results.errors.push({
              type: 'create',
              data: createDto,
              error: error.message,
            });
          }
        }
      }

      return {
        message: 'Upsert operation completed',
        summary: {
          created: results.created.length,
          updated: results.updated.length,
          unchanged: results.unchanged.length,
          errors: results.errors.length,
        },
        details: results,
      };
    } catch (error) {
      throw new BadRequestException(
        `Upsert operation failed: ${error.message}`,
      );
    }
  }
}
