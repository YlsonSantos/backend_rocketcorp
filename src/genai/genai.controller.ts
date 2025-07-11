import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Req,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { GenaiService } from './genai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { GenerateInsightDto } from './dto/generate-insight.dto';

@ApiTags('genai-insights')
@Controller('genai')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class GenaiController {
  constructor(private readonly genaiService: GenaiService) {}

  // ========== TELA: DASHBOARD ==========
  @Get('dashboard/insights/cycle/:cycleId')
  @Roles('RH', 'COMITE', 'LIDER')
  @ApiOperation({
    summary: '[DASHBOARD] Buscar insights gerais para o dashboard',
    description:
      'Retorna resumos dos colaboradores para visualização no dashboard principal',
  })
  @ApiParam({ name: 'cycleId', description: 'ID do ciclo de avaliação' })
  @ApiResponse({
    status: 200,
    description: 'Insights do dashboard recuperados com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          evaluatedId: { type: 'string' },
          evaluatedName: { type: 'string' },
          position: { type: 'string' },
          summary: { type: 'string' },
          finalScore: { type: 'number' },
          status: { type: 'string' },
        },
      },
    },
  })
  async buscarInsightsDashboard(@Param('cycleId') cycleId: string) {
    return await this.genaiService.buscarInsightsDashboard(cycleId);
  }

  // ========== TELA: EQUALIZAÇÃO ==========
  @Post('equalizacao/generate')
  @Roles('RH', 'COMITE', 'LIDER')
  @ApiOperation({
    summary: '[EQUALIZAÇÃO] Gerar resumo para equalização',
    description:
      'Gera análise completa de um colaborador para processo de equalização',
  })
  @ApiResponse({
    status: 201,
    description: 'Resumo de equalização gerado com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        cycleId: { type: 'string' },
        evaluatedId: { type: 'string' },
        summary: { type: 'string' },
        brutalFacts: { type: 'string' },
      },
    },
  })
  async gerarResumoEqualizacao(@Body() generateInsightDto: GenerateInsightDto) {
    return await this.genaiService.gerarResumoColaborador(
      generateInsightDto.cycleId,
      generateInsightDto.evaluatedId,
    );
  }

  @Get('equalizacao/insights/cycle/:cycleId')
  @Roles('RH', 'COMITE', 'LIDER')
  @ApiOperation({
    summary: '[EQUALIZAÇÃO] Buscar insights para equalização',
    description:
      'Retorna análises dos colaboradores para processo de equalização',
  })
  @ApiParam({ name: 'cycleId', description: 'ID do ciclo de avaliação' })
  @ApiResponse({
    status: 200,
    description: 'Insights de equalização recuperados com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          evaluatedId: { type: 'string' },
          evaluatedName: { type: 'string' },
          summary: { type: 'string' },
          brutalFacts: { type: 'string' },
        },
      },
    },
  })
  async buscarInsightsEqualizacao(@Param('cycleId') cycleId: string) {
    return await this.genaiService.buscarResumosPorCiclo(cycleId);
  }

  // ========== TELA: EVOLUÇÃO ==========
  @Get('evolucao/:userId')
  @Roles('RH', 'COMITE', 'LIDER', 'COLABORADOR')
  @ApiOperation({
    summary: '[EVOLUÇÃO] Buscar evolução histórica de um colaborador',
    description:
      'Retorna análise da evolução do colaborador ao longo dos ciclos para a tela de evolução',
  })
  @ApiParam({ name: 'userId', description: 'ID do colaborador' })
  @ApiResponse({
    status: 200,
    description: 'Evolução do colaborador recuperada com sucesso',
    schema: {
      type: 'object',
      properties: {
        colaborador: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string' },
            position: { type: 'string' },
            track: { type: 'string' },
          },
        },
        totalCiclos: { type: 'number' },
        evolucaoScores: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              cycleId: { type: 'string' },
              cycleName: { type: 'string' },
              finalScore: { type: 'number' },
              crescimento: { type: 'number' },
              crescimentoPercentual: { type: 'string' },
            },
          },
        },
        evolucaoInsights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              cycleId: { type: 'string' },
              cycleName: { type: 'string' },
              summary: { type: 'string' },
              brutalFacts: { type: 'string' },
            },
          },
        },
        resumoEvolucao: {
          type: 'object',
          properties: {
            scoreAtual: { type: 'number' },
            scoreInicial: { type: 'number' },
            crescimentoTotal: { type: 'number' },
          },
        },
      },
    },
  })
  async buscarEvolucaoColaborador(@Param('userId') userId: string) {
    return await this.genaiService.buscarEvolucaoColaborador(userId);
  }

  // ========== TELA: BRUTAL FACTS ==========
  @Get('brutal-facts/:userId/cycle/:cycleId')
  @Roles('RH', 'COMITE', 'LIDER')
  @ApiOperation({
    summary: '[BRUTAL FACTS] Buscar brutal facts de um colaborador',
    description:
      'Retorna análise crítica e pontos de melhoria específicos para a tela de brutal facts',
  })
  @ApiParam({ name: 'userId', description: 'ID do colaborador' })
  @ApiParam({ name: 'cycleId', description: 'ID do ciclo de avaliação' })
  @ApiResponse({
    status: 200,
    description: 'Brutal facts recuperados com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        evaluatedId: { type: 'string' },
        evaluatedName: { type: 'string' },
        evaluatedPosition: { type: 'string' },
        cycleId: { type: 'string' },
        cycleName: { type: 'string' },
        brutalFacts: { type: 'string' },
      },
    },
  })
  async buscarBrutalFacts(
    @Param('userId') userId: string,
    @Param('cycleId') cycleId: string,
  ) {
    return await this.genaiService.buscarBrutalFacts(userId, cycleId);
  }

  @Get('brutal-facts/gestor/resumo/cycle/:cycleId')
  @Roles('RH', 'COMITE', 'LIDER')
  @ApiOperation({
    summary: '[BRUTAL FACTS] Resumo executivo para gestores',
    description:
      'Retorna análise geral do desempenho de todos os colaboradores do ciclo para gestores',
  })
  @ApiParam({ name: 'cycleId', description: 'ID do ciclo de avaliação' })
  @ApiResponse({
    status: 200,
    description: 'Resumo executivo recuperado com sucesso',
    schema: {
      type: 'object',
      properties: {
        cycleId: { type: 'string' },
        cycleName: { type: 'string' },
        totalColaboradores: { type: 'number' },
        mediaGeral: { type: 'number' },
        distribuicaoPerformance: {
          type: 'object',
          properties: {
            topPerformers: { type: 'number' },
            altaPerformance: { type: 'number' },
            performanceMedia: { type: 'number' },
            baixaPerformance: { type: 'number' },
            criticos: { type: 'number' },
          },
        },
        resumoExecutivo: { type: 'string' },
        principaisInsights: { type: 'array', items: { type: 'string' } },
        recomendacoesAcoes: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async buscarResumoExecutivoBrutalFacts(
    @Param('cycleId') cycleId: string,
    @Req() req: any,
  ) {
    const managerId = req.user.userId; // ID do gestor logado
    return await this.genaiService.gerarBrutalFactsGestor(cycleId, managerId);
  }

  @Get('evolucao-equipe/gestor/cycle/:cycleId')
  @Roles('RH', 'COMITE', 'LIDER')
  @ApiOperation({
    summary: '[EVOLUÇÃO] Análise da evolução da média da equipe ao longo dos ciclos',
    description:
      'Gera comentário sobre a evolução da nota final média dos colaboradores da equipe do gestor ao longo dos ciclos até o atual',
  })
  @ApiParam({ name: 'cycleId', description: 'ID do ciclo atual de avaliação' })
  @ApiResponse({
    status: 200,
    description: 'Análise de evolução da equipe recuperada com sucesso',
    schema: {
      type: 'object',
      properties: {
        cycleAtual: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
          },
        },
        totalCiclos: { type: 'number' },
        evolucaoMedias: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              cycleId: { type: 'string' },
              cycleName: { type: 'string' },
              mediaEquipe: { type: 'number' },
              totalColaboradores: { type: 'number' },
              crescimento: { type: 'number' },
              crescimentoPercentual: { type: 'string' },
            },
          },
        },
        resumoEvolucao: {
          type: 'object',
          properties: {
            mediaAtual: { type: 'number' },
            mediaInicial: { type: 'number' },
            crescimentoTotal: { type: 'number' },
            crescimentoPercentualTotal: { type: 'string' },
            tendencia: { type: 'string' },
          },
        },
        comentarioIA: { type: 'string' },
      },
    },
  })
  async analisarEvolucaoEquipe(
    @Param('cycleId') cycleId: string,
    @Req() req: any,
  ) {
    const managerId = req.user.userId; // ID do gestor logado
    return await this.genaiService.analisarEvolucaoMediaEquipe(cycleId, managerId);
  }

  // ========== PERFIL INDIVIDUAL (Colaborador específico) ==========
  @Get('colaborador/:userId/cycle/:cycleId')
  @Roles('RH', 'COMITE', 'LIDER', 'COLABORADOR')
  @ApiOperation({
    summary: '[PERFIL] Buscar insights específicos de um colaborador',
    description:
      'Retorna análise detalhada de um colaborador específico para visualização do perfil',
  })
  @ApiParam({ name: 'userId', description: 'ID do colaborador' })
  @ApiParam({ name: 'cycleId', description: 'ID do ciclo de avaliação' })
  @ApiResponse({
    status: 200,
    description: 'Insight do colaborador recuperado com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        cycleId: { type: 'string' },
        evaluatedId: { type: 'string' },
        summary: { type: 'string' },
        brutalFacts: { type: 'string' },
      },
    },
  })
  async buscarResumoColaborador(
    @Param('userId') userId: string,
    @Param('cycleId') cycleId: string,
  ) {
    return await this.genaiService.buscarResumoColaborador(userId, cycleId);
  }

  // ========== PROCESSOS EM LOTE ==========
  @Post('processar-lote/cycle/:cycleId')
  @Roles('RH', 'COMITE')
  @ApiOperation({
    summary: 'Processar insights para todos os colaboradores de um ciclo',
    description: 'Gera análises em lote para equalização de um ciclo completo',
  })
  @ApiParam({ name: 'cycleId', description: 'ID do ciclo de avaliação' })
  @ApiResponse({
    status: 201,
    description: 'Processamento em lote realizado com sucesso',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        processed: { type: 'number' },
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              userId: { type: 'string' },
              success: { type: 'boolean' },
              insightId: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async processarLote(@Param('cycleId') cycleId: string) {
    return await this.genaiService.gerarResumosEmLote(cycleId);
  }

  // ========== UTILITÁRIOS ==========
  @Post('test-connection')
  @Roles('RH', 'COMITE', 'LIDER')
  @ApiOperation({
    summary: 'Testar conexão com IA',
    description:
      'Verifica se a integração com o serviço de IA está funcionando',
  })
  @ApiResponse({
    status: 200,
    description: 'Teste realizado com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        response: { type: 'string' },
      },
    },
  })
  async testarConexao() {
    return await this.genaiService.testarConexaoGemini();
  }

  // ========== GERAR RESUMO ESPECÍFICO PARA PESQUISA DE SATISFAÇÃO ==========
  @Get('generate-insight/:id')
  @Roles('RH', 'LIDER')
  async gerarInsight(@Param('id') surveyId: string) {
    return this.genaiService.gerarResumoSurvey(surveyId);
  }

  // ========== RECOMENDAÇÕES PARA GOALS ==========
  @Get('goal-recommendations/:userId')
  @Roles('RH', 'COMITE', 'LIDER', 'COLABORADOR')
  @ApiOperation({
    summary: '[GOALS] Gerar recomendações para alcançar goals',
    description:
      'Gera recomendações personalizadas, acionáveis e com prazos para ajudar o colaborador a alcançar seus goals. Baseia-se na performance atual e competências do usuário.',
  })
  @ApiParam({ name: 'userId', description: 'ID do usuário para gerar recomendações' })
  @ApiResponse({
    status: 200,
    description: 'Recomendações de goals geradas com sucesso',
    schema: {
      type: 'object',
      properties: {
        usuario: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            position: { type: 'string' },
            track: { type: 'string' },
          },
        },
        scoreAtual: { type: 'number' },
        totalGoals: { type: 'number' },
        recomendacoes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              goalId: { type: 'string' },
              goalTitle: { type: 'string' },
              goalDescription: { type: 'string' },
              goalType: { type: 'string' },
              recomendacoes: { type: 'string' },
              actionsExistentes: { type: 'number' },
              proximoDeadline: { type: 'string', format: 'date-time', nullable: true },
            },
          },
        },
        geradoEm: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário ou goals não encontrados',
  })
  async gerarRecomendacoesGoals(
    @Param('userId') userId: string,
    @Req() req: any,
  ) {
    // Verificar se é o próprio usuário ou se tem permissão para ver
    const userRole = req.user?.role;
    const currentUserId = req.user?.sub;

    if (
      userRole !== 'RH' &&
      userRole !== 'COMITE' &&
      userRole !== 'LIDER' &&
      currentUserId !== userId
    ) {
      throw new BadRequestException(
        'Você só pode gerar recomendações para seus próprios goals',
      );
    }

    return await this.genaiService.gerarRecomendacoesGoals(userId);
  }

  @Get('goal-recommendations/:userId/goal/:goalId')
  @Roles('RH', 'COMITE', 'LIDER', 'COLABORADOR')
  @ApiOperation({
    summary: '[GOALS] Gerar recomendações para um goal específico',
    description:
      'Gera recomendações personalizadas para um goal específico do colaborador',
  })
  @ApiParam({ name: 'userId', description: 'ID do usuário' })
  @ApiParam({ name: 'goalId', description: 'ID do goal específico' })
  @ApiResponse({
    status: 200,
    description: 'Recomendações para o goal específico geradas com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário ou goal não encontrado',
  })
  async gerarRecomendacoesGoalEspecifico(
    @Param('userId') userId: string,
    @Param('goalId') goalId: string,
    @Req() req: any,
  ) {
    // Verificar se é o próprio usuário ou se tem permissão para ver
    const userRole = req.user?.role;
    const currentUserId = req.user?.sub;

    if (
      userRole !== 'RH' &&
      userRole !== 'COMITE' &&
      userRole !== 'LIDER' &&
      currentUserId !== userId
    ) {
      throw new BadRequestException(
        'Você só pode gerar recomendações para seus próprios goals',
      );
    }

    return await this.genaiService.gerarRecomendacoesGoals(userId, goalId);
  }
}
