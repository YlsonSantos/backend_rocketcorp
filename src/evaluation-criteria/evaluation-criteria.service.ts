import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateNextCycleCriterionDto } from './dto/create-evaluation-criterion.dto';
import { QueryEvaluationCriteriaDto } from './dto/query-evaluation-criteria.dto';
import { CriterionType, NextCycleCriterion } from '@prisma/client';

@Injectable()
export class EvaluationCriteriaService {
  constructor(private readonly prisma: PrismaService) {}

  //helpers
  private async linkPositions(criterionId: string, positionIds: string[]) {
    for (const positionId of positionIds) {
      await this.prisma.nextCycleCriterionPosition.create({
        data: {
          nextCycleCriterionId: criterionId,
          positionId,
        },
      });
    }
  }

  private async overwritePositions(
    criterionId: string,
    newPositionIds: string[],
  ) {
    if (!newPositionIds.length) return;

    const firstPosition = await this.prisma.position.findUnique({
      where: { id: newPositionIds[0] },
      select: { track: true },
    });

    if (!firstPosition || !firstPosition.track) {
      throw new Error('Track da posição não encontrada');
    }

    const track = firstPosition.track;

    const allPositionsInTrack = await this.prisma.position.findMany({
      where: { track },
      select: { id: true },
    });

    const positionIdsInTrack = allPositionsInTrack.map(p => p.id);

    await this.prisma.nextCycleCriterionPosition.deleteMany({
      where: {
        nextCycleCriterionId: criterionId,
        positionId: { in: positionIdsInTrack },
      },
    });

    await this.linkPositions(criterionId, newPositionIds);
  }
  async create(
    createDto: CreateNextCycleCriterionDto, // ← substitui positionId e assignments
  ): Promise<NextCycleCriterion> {
    const { positions, ...criterionData } = createDto;

    // Cria o critério rascunho
    const criterion = await this.prisma.nextCycleCriterion.create({
      data: criterionData,
    });

    await this.linkPositions(criterion.id, positions);

    return criterion;
  }

  async findAll(query: QueryEvaluationCriteriaDto = {}): Promise<any[]> {
    const { track, positionId, type } = query;

    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (positionId || track) {
      where.positions = {
        some: {},
      };

      if (positionId) {
        where.positions.some.positionId = positionId;
      }

      if (track) {
        where.positions.some.position = {
          track,
        };
      }
    }

    const criterios = await this.prisma.nextCycleCriterion.findMany({
      where,
      include: {
        positions: {
          include: {
            position: true,
          },
        },
      },
    });

    const criteriosExpandido: any[] = [];

    for (const criterio of criterios) {
      // Agrupa as posições por track
      const posicoesPorTrack: Record<string, typeof criterio.positions> = {};

      for (const pos of criterio.positions) {
        const track = pos.position.track.trim().toUpperCase();
        if (!posicoesPorTrack[track]) posicoesPorTrack[track] = [];
        posicoesPorTrack[track].push(pos);
      }

      // Para cada trilha, cria uma entrada separada com assignments filtrados
      for (const track in posicoesPorTrack) {
        criteriosExpandido.push({
          id: criterio.id,
          title: criterio.title,
          description: criterio.description,
          type: criterio.type,
          assignments: posicoesPorTrack[track],
        });
      }
    }

    return criteriosExpandido;
  }

  async upsertCriteria(upsertDto: {
    create?: CreateNextCycleCriterionDto[];
    update?: (CreateNextCycleCriterionDto & { id: string })[];
  }) {
    const { create, update } = upsertDto;

    const summary = { created: 0, updated: 0, unchanged: 0, errors: 0 };
    const details = {
      created: [] as any[],
      updated: [] as Array<{
        id: string;
        title: string;
        description: string;
        type: CriterionType;
        positions: string[];
      }>,
      unchanged: [] as any[],
      errors: [] as any[],
    };

    if (update?.length) {
      for (const dto of update) {
        try {
          const { id, positions, ...data } = dto;

          const existing = await this.prisma.nextCycleCriterion.findUnique({
            where: { id },
          });
          if (!existing) {
            details.errors.push({ id, error: 'Critério não encontrado' });
            summary.errors++;
            continue;
          }

          const hasChanges =
            existing.title !== data.title ||
            existing.description !== data.description ||
            existing.type !== data.type;

          if (hasChanges) {
            await this.prisma.nextCycleCriterion.update({
              where: { id },
              data,
            });
          }

          // Sempre sincroniza posições
          await this.overwritePositions(id, positions);

          details.updated.push({ id, ...data, positions });
          summary.updated++;
        } catch (e) {
          details.errors.push({ id: dto.id, error: e.message });
          summary.errors++;
        }
      }
    }

    if (create?.length) {
      for (const dto of create) {
        try {
          const criterion = await this.create(dto);
          details.created.push(criterion);
          summary.created++;
        } catch (e) {
          details.errors.push({ data: dto, error: e.message });
          summary.errors++;
        }
      }
    }

    return { message: 'Upsert concluído', summary, details };
  }

  async removeAssignmentsByTrack(
    criterionId: string,
    positionId: string,
  ): Promise<void> {
    // 1️⃣ Busca o `track` da posição atual
    const position = await this.prisma.position.findUnique({
      where: { id: positionId },
      select: { track: true },
    });

    if (!position || !position.track) {
      throw new Error('Posição ou track não encontrada');
    }

    const track = position.track;

    await this.prisma.nextCycleCriterionPosition.deleteMany({
      where: {
        nextCycleCriterionId: criterionId,
        position: {
          track: track,
        },
      },
    });
  }
}
