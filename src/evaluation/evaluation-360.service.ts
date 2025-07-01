import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEvaluation360Dto } from './dto/create-evaluation-360.dto';
import { Evaluation } from '@prisma/client';

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
              position: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

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
              position: {
                select: {
                  id: true,
                  name: true,
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
      throw new BadRequestException(
        'Erro ao buscar membros da equipe para o ciclo',
      );
    }
  }

  async criarAvaliacao360(
    evaluatorId: string,
    criarAvaliacao360Dto: CreateEvaluation360Dto,
  ): Promise<Evaluation> {
    try {
      // Validar se todas as entidades referenciadas existem
      const [ciclo, avaliador, avaliado] = await Promise.all([
        this.prisma.evaluationCycle.findUnique({
          where: { id: criarAvaliacao360Dto.cycleId },
        }),
        this.prisma.user.findUnique({
          where: { id: evaluatorId },
        }),
        this.prisma.user.findUnique({
          where: { id: criarAvaliacao360Dto.evaluatedUserId },
        }),
      ]);

      if (!ciclo) {
        throw new BadRequestException('Ciclo de avaliação não encontrado');
      }
      if (!avaliador) {
        throw new BadRequestException('Usuário avaliador não encontrado');
      }
      if (!avaliado) {
        throw new BadRequestException('Usuário avaliado não encontrado');
      }

      // Validar se estão na mesma equipe
      const [teamMemberAvaliador, teamMemberAvaliado] = await Promise.all([
        this.prisma.teamMember.findFirst({
          where: { userId: evaluatorId },
          include: { team: true },
        }),
        this.prisma.teamMember.findFirst({
          where: { userId: criarAvaliacao360Dto.evaluatedUserId },
          include: { team: true },
        }),
      ]);

      if (!teamMemberAvaliador || !teamMemberAvaliado) {
        throw new BadRequestException('Usuários devem pertencer a equipes');
      }

      if (teamMemberAvaliador.teamId !== teamMemberAvaliado.teamId) {
        throw new BadRequestException(
          'Avaliação 360 só pode ser feita entre membros da mesma equipe',
        );
      }

      // Validar se não é autoavaliação
      if (evaluatorId === criarAvaliacao360Dto.evaluatedUserId) {
        throw new BadRequestException(
          'Não é possível fazer avaliação 360 de si mesmo',
        );
      }

      // Verificar se já existe uma avaliação PAR para esta combinação no ciclo
      const avaliacaoExistente = await this.prisma.evaluation.findFirst({
        where: {
          cycleId: criarAvaliacao360Dto.cycleId,
          evaluatorId: evaluatorId,
          evaluatedId: criarAvaliacao360Dto.evaluatedUserId,
          type: 'PAR',
        },
      });

      if (avaliacaoExistente) {
        throw new BadRequestException(
          'Já existe uma avaliação 360 para este usuário neste ciclo',
        );
      }

      // Validar se todas as respostas são para o critério 360_evaluation
      let criterio360 = await this.prisma.evaluationCriterion.findUnique({
        where: { id: '360_evaluation' },
      });

      // Se não existir, criar automaticamente
      if (!criterio360) {
        try {
          criterio360 = await this.prisma.evaluationCriterion.create({
            data: {
              id: '360_evaluation',
              title: 'Avaliação 360',
              description: 'Critério específico para avaliações 360 graus.',
              type: 'HABILIDADES',
            },
          });
          console.log('✅ Critério 360_evaluation criado automaticamente durante criação de avaliação');
        } catch (createError) {
          console.error('Erro ao criar critério 360:', createError);
          throw new BadRequestException('Erro ao criar critério 360_evaluation');
        }
      }

      for (const answer of criarAvaliacao360Dto.answers) {
        if (answer.criterionId !== '360_evaluation') {
          throw new BadRequestException(
            'Avaliação 360 deve usar apenas o critério 360_evaluation',
          );
        }
      }

      // Criar a avaliação 360 em uma transação
      const novaAvaliacao = await this.prisma.$transaction(async (prisma) => {
        // Criar a avaliação
        const avaliacao = await prisma.evaluation.create({
          data: {
            type: 'PAR',
            cycleId: criarAvaliacao360Dto.cycleId,
            evaluatorId: evaluatorId,
            evaluatedId: criarAvaliacao360Dto.evaluatedUserId,
            teamId: teamMemberAvaliador.teamId,
            completed: criarAvaliacao360Dto.completed ?? true,
          },
          include: {
            cycle: {
              select: {
                id: true,
                name: true,
                startDate: true,
                endDate: true,
              },
            },
            evaluator: {
              select: {
                id: true,
                name: true,
              },
            },
            evaluated: {
              select: {
                id: true,
                name: true,
              },
            },
            team: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        // Criar respostas
        await prisma.evaluationAnswer.createMany({
          data: criarAvaliacao360Dto.answers.map((answer) => {
            // Concatenar pontos fortes e fracos na justificativa
            let justification = answer.justification || '';

            if (
              criarAvaliacao360Dto.strongPoints ||
              criarAvaliacao360Dto.weakPoints
            ) {
              const strongPointsText = criarAvaliacao360Dto.strongPoints
                ? `Pontos Fortes: ${criarAvaliacao360Dto.strongPoints}`
                : '';
              const weakPointsText = criarAvaliacao360Dto.weakPoints
                ? `Pontos Fracos: ${criarAvaliacao360Dto.weakPoints}`
                : '';

              const additionalFeedback = [strongPointsText, weakPointsText]
                .filter((text) => text.length > 0)
                .join(' | ');

              if (additionalFeedback) {
                justification = justification
                  ? `${justification} | ${additionalFeedback}`
                  : additionalFeedback;
              }
            }

            return {
              evaluationId: avaliacao.id,
              criterionId: answer.criterionId,
              score: answer.score,
              justification,
            };
          }),
        });

        return avaliacao;
      });

      return novaAvaliacao;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Falha ao criar avaliação 360');
    }
  }

  async buscarAvaliacao360PorId(id: string): Promise<any> {
    try {
      const avaliacao = await this.prisma.evaluation.findUnique({
        where: {
          id,
          type: 'PAR', // Garantir que é uma avaliação 360
        },
        include: {
          cycle: {
            select: {
              id: true,
              name: true,
              startDate: true,
              endDate: true,
            },
          },
          evaluator: {
            select: {
              id: true,
              name: true,
            },
          },
          evaluated: {
            select: {
              id: true,
              name: true,
            },
          },
          team: {
            select: {
              id: true,
              name: true,
            },
          },
          answers: {
            where: {
              criterionId: '360_evaluation', // Filtrar apenas respostas do critério 360
            },
            include: {
              criterion: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                  type: true,
                },
              },
            },
          },
        },
      });

      if (!avaliacao) {
        throw new NotFoundException('Avaliação 360 não encontrada');
      }

      return avaliacao;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Falha ao buscar avaliação 360');
    }
  }

  async buscarCriterio360() {
    try {
      // Buscar critério existente pelo ID '360_evaluation'
      const criterio360 = await this.prisma.evaluationCriterion.findUnique({
        where: { id: '360_evaluation' },
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
        },
      });

      if (criterio360) {
        return criterio360;
      }

      // Se não encontrou, buscar por título contendo "360"
      const criterioAlternativo = await this.prisma.evaluationCriterion.findFirst({
        where: {
          title: {
            contains: '360'
          }
        },
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
        },
      });

      if (criterioAlternativo) {
        return criterioAlternativo;
      }

      throw new NotFoundException('Critério 360 não encontrado');
      
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Erro ao buscar critério 360');
    }
  }
}
