import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class Evaluation360Service {
  constructor(private readonly prisma: PrismaService) {}

  async buscarMembrosEquipe(userId: string) {
    try {
      // Buscar o usuário logado
      const usuario = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
        },
      });

      if (!usuario) {
        throw new NotFoundException('Usuário não encontrado');
      }

      // Buscar a equipe do usuário
      const teamMember = await this.prisma.teamMember.findFirst({
        where: { userId: userId },
        include: {
          team: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!teamMember) {
        throw new NotFoundException('Usuário não pertence a nenhuma equipe');
      }

      // Buscar todos os membros da equipe (exceto o próprio usuário)
      const membros = await this.prisma.teamMember.findMany({
        where: {
          teamId: teamMember.team.id,
          userId: {
            not: userId, // Excluir o próprio usuário
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              position: {
                select: {
                  id: true,
                  name: true,
                  track: true,
                },
              },
            },
          },
        },
      });

      // Para cada membro, verificar se já existe uma avaliação do usuário logado para ele
      const membrosComStatus = await Promise.all(
        membros.map(async (membro) => {
          // Buscar avaliação existente do usuário logado para este membro
          const avaliacaoExistente = await this.prisma.evaluation.findFirst({
            where: {
              evaluatorId: userId,
              evaluatedId: membro.user.id,
              type: 'PAR', // Avaliação 360 é do tipo PAR
            },
            orderBy: {
              createdAt: 'desc',
            },
          });

          return {
            id: membro.user.id,
            name: membro.user.name,
            email: membro.user.email,
            role: membro.user.role,
            position: membro.user.position,
            hasEvaluation: !!avaliacaoExistente,
            evaluationStatus: avaliacaoExistente
              ? avaliacaoExistente.completed
                ? 'COMPLETA'
                : 'EM_ANDAMENTO'
              : 'NAO_INICIADA',
          };
        }),
      );

      return {
        user: {
          id: usuario.id,
          name: usuario.name,
        },
        team: {
          id: teamMember.team.id,
          name: teamMember.team.name,
        },
        members: membrosComStatus,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Erro ao buscar membros da equipe');
    }
  }

  async buscarMembrosEquipePorCiclo(userId: string, cycleId: string) {
    try {
      // Verificar se o ciclo existe
      const ciclo = await this.prisma.evaluationCycle.findUnique({
        where: { id: cycleId },
      });

      if (!ciclo) {
        throw new NotFoundException('Ciclo de avaliação não encontrado');
      }

      // Buscar o usuário logado
      const usuario = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
        },
      });

      if (!usuario) {
        throw new NotFoundException('Usuário não encontrado');
      }

      // Buscar a equipe do usuário
      const teamMember = await this.prisma.teamMember.findFirst({
        where: { userId: userId },
        include: {
          team: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!teamMember) {
        throw new NotFoundException('Usuário não pertence a nenhuma equipe');
      }

      // Buscar todos os membros da equipe (exceto o próprio usuário)
      const membros = await this.prisma.teamMember.findMany({
        where: {
          teamId: teamMember.team.id,
          userId: {
            not: userId,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              position: {
                select: {
                  id: true,
                  name: true,
                  track: true,
                },
              },
            },
          },
        },
      });

      // Para cada membro, verificar se já existe uma avaliação do usuário logado para ele neste ciclo
      const membrosComStatus = await Promise.all(
        membros.map(async (membro) => {
          const avaliacaoExistente = await this.prisma.evaluation.findFirst({
            where: {
              evaluatorId: userId,
              evaluatedId: membro.user.id,
              cycleId: cycleId,
              type: 'PAR',
            },
          });

          return {
            id: membro.user.id,
            name: membro.user.name,
            email: membro.user.email,
            role: membro.user.role,
            position: membro.user.position,
            hasEvaluation: !!avaliacaoExistente,
            evaluationStatus: avaliacaoExistente
              ? avaliacaoExistente.completed
                ? 'COMPLETA'
                : 'EM_ANDAMENTO'
              : 'NAO_INICIADA',
            evaluationId: avaliacaoExistente?.id || null,
          };
        }),
      );

      return {
        user: {
          id: usuario.id,
          name: usuario.name,
        },
        team: {
          id: teamMember.team.id,
          name: teamMember.team.name,
        },
        cycle: {
          id: ciclo.id,
          name: ciclo.name,
          startDate: ciclo.startDate,
          endDate: ciclo.endDate,
        },
        members: membrosComStatus,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Erro ao buscar membros da equipe para o ciclo');
    }
  }
}
