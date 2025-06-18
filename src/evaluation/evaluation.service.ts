import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { Evaluation } from '@prisma/client';

@Injectable()
export class EvaluationService {
  constructor(private prisma: PrismaService) {}

  async criar(criarAvaliacaoDto: CreateEvaluationDto): Promise<Evaluation> {
    try {
      // Validar se todas as entidades referenciadas existem
      const [ciclo, avaliador, avaliado, equipe] = await Promise.all([
        this.prisma.evaluationCycle.findUnique({
          where: { id: criarAvaliacaoDto.cycleId },
        }),
        this.prisma.user.findUnique({
          where: { id: criarAvaliacaoDto.evaluatorId },
          include: { subordinates: true },
        }),
        this.prisma.user.findUnique({
          where: { id: criarAvaliacaoDto.evaluatedId },
        }),
        this.prisma.team.findUnique({
          where: { id: criarAvaliacaoDto.teamId },
          include: { members: true },
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
      if (!equipe) {
        throw new BadRequestException('Equipe não encontrada');
      }

      await this.validateCycleActive(ciclo);

      await this.validateHierarchy(
        criarAvaliacaoDto.evaluatorId,
        criarAvaliacaoDto.evaluatedId,
        criarAvaliacaoDto.type,
        avaliador,
      );

     
      await this.validateTeamMembership(
        criarAvaliacaoDto.evaluatedId,
        equipe,
      );

      // Verificar se já existe uma avaliação para esta combinação
      const avaliacaoExistente = await this.prisma.evaluation.findFirst({
        where: {
          cycleId: criarAvaliacaoDto.cycleId,
          evaluatorId: criarAvaliacaoDto.evaluatorId,
          evaluatedId: criarAvaliacaoDto.evaluatedId,
          type: criarAvaliacaoDto.type,
        },
      });

      if (avaliacaoExistente) {
        throw new BadRequestException(
          'Já existe uma avaliação para esta combinação',
        );
      }

      return await this.prisma.evaluation.create({
        data: {
          type: criarAvaliacaoDto.type,
          cycleId: criarAvaliacaoDto.cycleId,
          evaluatorId: criarAvaliacaoDto.evaluatorId,
          evaluatedId: criarAvaliacaoDto.evaluatedId,
          teamId: criarAvaliacaoDto.teamId,
          completed: criarAvaliacaoDto.completed ?? false,
        },
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Falha ao criar avaliação');
    }
  }

  async buscarTodas(): Promise<Evaluation[]> {
    try {
      return await this.prisma.evaluation.findMany({
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
              email: true,
              role: true,
            },
          },
          evaluated: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          team: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch {
      throw new InternalServerErrorException('Falha ao buscar avaliações');
    }
  }

  async buscarPorId(id: string): Promise<Evaluation> {
    try {
      const avaliacao = await this.prisma.evaluation.findUnique({
        where: { id },
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
              email: true,
              role: true,
            },
          },
          evaluated: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
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
        throw new NotFoundException('Avaliação não encontrada');
      }

      return avaliacao;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Falha ao buscar avaliação');
    }
  }

  async atualizar(
    id: string,
    atualizarAvaliacaoDto: UpdateEvaluationDto,
  ): Promise<Evaluation> {
    try {
      // Verificar se a avaliação existe
      const avaliacaoExistente = await this.prisma.evaluation.findUnique({
        where: { id },
      });

      if (!avaliacaoExistente) {
        throw new NotFoundException('Avaliação não encontrada');
      }

      // Validar entidades referenciadas se estão sendo atualizadas
      const validacoes = [];

      if (atualizarAvaliacaoDto.cycleId) {
        validacoes.push(
          this.prisma.evaluationCycle
            .findUnique({
              where: { id: atualizarAvaliacaoDto.cycleId },
            })
            .then((ciclo) => {
              if (!ciclo)
                throw new BadRequestException(
                  'Ciclo de avaliação não encontrado',
                );
            }),
        );
      }

      if (atualizarAvaliacaoDto.evaluatorId) {
        validacoes.push(
          this.prisma.user
            .findUnique({
              where: { id: atualizarAvaliacaoDto.evaluatorId },
            })
            .then((usuario) => {
              if (!usuario)
                throw new BadRequestException(
                  'Usuário avaliador não encontrado',
                );
            }),
        );
      }

      if (atualizarAvaliacaoDto.evaluatedId) {
        validacoes.push(
          this.prisma.user
            .findUnique({
              where: { id: atualizarAvaliacaoDto.evaluatedId },
            })
            .then((usuario) => {
              if (!usuario)
                throw new BadRequestException(
                  'Usuário avaliado não encontrado',
                );
            }),
        );
      }

      if (atualizarAvaliacaoDto.teamId) {
        validacoes.push(
          this.prisma.team
            .findUnique({
              where: { id: atualizarAvaliacaoDto.teamId },
            })
            .then((equipe) => {
              if (!equipe)
                throw new BadRequestException('Equipe não encontrada');
            }),
        );
      }

      await Promise.all(validacoes);

    
      if (atualizarAvaliacaoDto.completed === true) {
        const avaliado = await this.prisma.user.findUnique({
          where: { id: avaliacaoExistente.evaluatedId },
          select: { positionId: true },
        });

        const isComplete = await this.validateCompleteness(
          id,
          avaliacaoExistente.teamId,
          avaliado?.positionId || '',
        );

        if (!isComplete) {
          throw new BadRequestException(
            'Não é possível marcar como completa: critérios obrigatórios não foram respondidos',
          );
        }
      }

      return await this.prisma.evaluation.update({
        where: { id },
        data: {
          type: atualizarAvaliacaoDto.type,
          cycleId: atualizarAvaliacaoDto.cycleId,
          evaluatorId: atualizarAvaliacaoDto.evaluatorId,
          evaluatedId: atualizarAvaliacaoDto.evaluatedId,
          teamId: atualizarAvaliacaoDto.teamId,
          completed: atualizarAvaliacaoDto.completed,
        },
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Falha ao atualizar avaliação');
    }
  }

  async remover(id: string): Promise<void> {
    try {
      const avaliacao = await this.prisma.evaluation.findUnique({
        where: { id },
        include: {
          answers: true,
        },
      });

      if (!avaliacao) {
        throw new NotFoundException('Avaliação não encontrada');
      }

      // Usar transação para garantir consistência dos dados
      await this.prisma.$transaction(async (prisma) => {
        // Deletar respostas de avaliação primeiro
        await prisma.evaluationAnswer.deleteMany({
          where: { evaluationId: id },
        });

        // Depois deletar a avaliação
        await prisma.evaluation.delete({
          where: { id },
        });
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Falha ao deletar avaliação');
    }
  }

  private async validateCycleActive(ciclo: any): Promise<void> {
    const now = new Date();
    if (now < ciclo.startDate || now > ciclo.endDate) {
      throw new BadRequestException(
        `Avaliações só podem ser criadas dentro do período do ciclo (${ciclo.startDate.toLocaleDateString()} - ${ciclo.endDate.toLocaleDateString()})`,
      );
    }
  }

  
  private async validateHierarchy(
    evaluatorId: string,
    evaluatedId: string,
    type: any,
    avaliador: any,
  ): Promise<void> {
    if (type === 'AUTO') {
      if (evaluatorId !== evaluatedId) {
        throw new BadRequestException(
          'Auto-avaliação deve ter o mesmo usuário como avaliador e avaliado',
        );
      }
      return;
    }

    if (type === 'PAR') {
      if (evaluatorId === evaluatedId) {
        throw new BadRequestException(
          'Avaliação por pares não pode ser uma auto-avaliação',
        );
      }
      const isSubordinate = avaliador.subordinates?.some(
        (sub: any) => sub.id === evaluatedId,
      );
      if (isSubordinate || avaliador.managerId === evaluatedId) {
        throw new BadRequestException(
          'Avaliação por pares não deve haver relação hierárquica direta',
        );
      }
      return;
    }

    if (type === 'LIDER') {
      if (evaluatorId === evaluatedId) {
        throw new BadRequestException(
          'Avaliação de líder não pode ser uma auto-avaliação',
        );
      }
      
      const isSubordinate = avaliador.subordinates?.some(
        (sub: any) => sub.id === evaluatedId,
      );
      
      if (!isSubordinate) {
        throw new BadRequestException(
          'Líder só pode avaliar seus subordinados diretos',
        );
      }
      return;
    }
  }

  private async validateTeamMembership(
    evaluatedId: string,
    equipe: any,
  ): Promise<void> {
    const isMember = equipe.members?.some(
      (member: any) => member.userId === evaluatedId,
    );
    
    if (!isMember) {
      throw new BadRequestException(
        'Usuário avaliado deve ser membro da equipe especificada',
      );
    }
  }


  private async validateCompleteness(
    evaluationId: string,
    teamId: string,
    positionId: string,
  ): Promise<boolean> {
    const criteriosObrigatorios = await this.prisma.criteriaAssignment.findMany({
      where: {
        teamId,
        positionId,
      },
      include: {
        criterion: true,
      },
    });

    const respostasExistentes = await this.prisma.evaluationAnswer.findMany({
      where: { evaluationId },
    });

    const criteriosRespondidos = respostasExistentes.map(r => r.criterionId);
    const criteriosObrigatoriosIds = criteriosObrigatorios.map(c => c.criterionId);
    
    const criteriosFaltantes = criteriosObrigatoriosIds.filter(
      id => !criteriosRespondidos.includes(id),
    );

    return criteriosFaltantes.length === 0;
  }
}
