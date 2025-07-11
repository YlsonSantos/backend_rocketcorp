import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CryptoService } from '../crypto/crypto.service';

@Injectable()
export class GenaiService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {
    const apiKey = process.env.GEMINI_API_KEY || 'sua-api-key-aqui';
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async gerarResumoColaborador(cycleId: string, evaluatedId: string) {
    try {
      const ciclo = await this.prisma.evaluationCycle.findUnique({
        where: { id: cycleId },
      });
      if (!ciclo) {
        throw new NotFoundException('Ciclo de avaliação não encontrado');
      }
      const usuario = await this.prisma.user.findUnique({
        where: { id: evaluatedId },
        include: {
          position: true,
          teamMemberships: {
            include: {
              team: true,
            },
          },
        },
      });
      if (!usuario) {
        throw new NotFoundException('Colaborador não encontrado');
      }

      // Buscar scorePerCycle primeiro
      const scorePerCycle = await this.prisma.scorePerCycle.findUnique({
        where: {
          userId_cycleId: {
            userId: evaluatedId,
            cycleId: cycleId,
          },
        },
        include: {
          peerScores: true,
        },
      });

      const avaliacoes = await this.prisma.evaluation.findMany({
        where: {
          evaluatedId: evaluatedId,
          cycleId: cycleId,
          completed: true,
        },
        include: {
          evaluator: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
          answers: {
            include: {
              criterion: {
                select: {
                  title: true,
                  description: true,
                  type: true,
                },
              },
            },
          },
        },
      });

      // Se não há avaliações mas há scorePerCycle, gerar insights baseado apenas no score
      if (!avaliacoes || avaliacoes.length === 0) {
        if (scorePerCycle && scorePerCycle.finalScore) {
          console.log(`📊 Nenhuma avaliação encontrada para ${usuario.name}, mas scorePerCycle existe. Gerando insights baseados apenas no score.`);
          
          const insights = await this.gerarInsightsApenasPorScore(
            usuario,
            scorePerCycle,
            ciclo,
          );

          const novoResumo = await this.prisma.genaiInsight.create({
            data: {
              cycleId: cycleId,
              evaluatedId: evaluatedId,
              summary: insights.summary,
              discrepancies: '',
              brutalFacts: insights.brutalFacts,
            },
          });
          
          // Descriptografar campos antes de retornar para o frontend
          novoResumo.summary = await this.crypto.decrypt(novoResumo.summary);
          novoResumo.brutalFacts = await this.crypto.decrypt(novoResumo.brutalFacts);

          return novoResumo;
        } else {
          throw new NotFoundException(
            'Não há avaliações concluídas nem scorePerCycle para este colaborador no ciclo especificado',
          );
        }
      }

      for (const avaliacao of avaliacoes) {
        for (const answer of avaliacao.answers) {
          if (answer.justification) {
            answer.justification = await this.crypto.decrypt(
              answer.justification,
            );
          }
        }
      }
      // Validar se há dados suficientes para gerar insights
      if (avaliacoes.length === 0) {
        throw new NotFoundException(
          'Não há avaliações concluídas para este colaborador no ciclo especificado',
        );
      }
      const autoavaliacoes = avaliacoes.filter((av) => av.type === 'AUTO');
      const avaliacoesPares = avaliacoes.filter((av) => av.type === 'PAR');
      const avaliacoesLider = avaliacoes.filter((av) => av.type === 'LIDER');

      // Log para debug dos dados encontrados
      console.log(`📊 Dados para ${usuario.name} no ciclo ${ciclo.name}:`);
      console.log(`  - Autoavaliações: ${autoavaliacoes.length}`);
      console.log(`  - Avaliações de pares: ${avaliacoesPares.length}`);
      console.log(`  - Avaliações de líder: ${avaliacoesLider.length}`);
      console.log(`  - Total: ${avaliacoes.length}`);

      const insights = await this.gerarInsightsComIA(
        usuario,
        avaliacoes,
        scorePerCycle,
        ciclo,
        autoavaliacoes,
        avaliacoesPares,
        avaliacoesLider,
      );

      const novoResumo = await this.prisma.genaiInsight.create({
        data: {
          cycleId: cycleId,
          evaluatedId: evaluatedId,
          summary: insights.summary,
          discrepancies: '',
          brutalFacts: insights.brutalFacts,
        },
      });
      // Descriptografar campos antes de retornar para o frontend
      novoResumo.summary = await this.crypto.decrypt(novoResumo.summary);
      novoResumo.brutalFacts = await this.crypto.decrypt(
        novoResumo.brutalFacts,
      );

      return novoResumo;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Erro ao gerar resumo do colaborador ${error}`,
      );
    }
  }

  async buscarResumosPorCiclo(cycleId: string) {
    try {
      const resumos = await this.prisma.genaiInsight.findMany({
        where: { cycleId: cycleId },
        include: {
          evaluated: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              position: {
                select: {
                  name: true,
                  track: true,
                },
              },
            },
          },
          cycle: {
            select: {
              name: true,
              startDate: true,
              endDate: true,
            },
          },
        },
        orderBy: {
          evaluated: {
            name: 'asc',
          },
        },
      });

      return resumos.map((resumo) => ({
        id: resumo.id,
        evaluatedId: resumo.evaluatedId,
        evaluatedName: resumo.evaluated.name,
        evaluatedEmail: resumo.evaluated.email,
        evaluatedRole: resumo.evaluated.role,
        evaluatedPosition: resumo.evaluated.position.name,
        evaluatedTrack: resumo.evaluated.position.track,
        summary: resumo.summary,
        brutalFacts: resumo.brutalFacts,
        cycle: resumo.cycle,
      }));
    } catch (error) {
      throw new BadRequestException('Erro ao buscar resumos do ciclo');
    }
  }

  async buscarResumoColaborador(userId: string, cycleId: string) {
    try {
      // Buscar scorePerCycle atual para verificar mudanças
      const scoreAtual = await this.prisma.scorePerCycle.findUnique({
        where: {
          userId_cycleId: {
            userId: userId,
            cycleId: cycleId,
          },
        },
      });

      // Primeiro, tentar buscar um resumo já existente
      let resumo = await this.prisma.genaiInsight.findFirst({
        where: {
          evaluatedId: userId,
          cycleId: cycleId,
        },
        include: {
          evaluated: {
            select: {
              name: true,
              email: true,
              role: true,
              position: {
                select: {
                  name: true,
                  track: true,
                },
              },
            },
          },
          cycle: {
            select: {
              name: true,
            },
          },
        },
      });

      // Verificar se precisa regenerar devido a mudança no score
      let precisaRegenerar = false;
      if (resumo && scoreAtual) {
        // Por segurança, vamos forçar regeneração periodicamente
        console.log(`🔄 Forçando regeneração para garantir dados atualizados...`);
        precisaRegenerar = true; // Temporariamente sempre regenerar para garantir dados atuais
      }

      // Se não encontrou ou precisa regenerar, gerar automaticamente
      if (!resumo || precisaRegenerar) {
        if (precisaRegenerar) {
          console.log(`🔄 Regenerando resumo para userId:${userId}, cycleId:${cycleId} devido a mudança no score...`);
          // Deletar o insight antigo
          await this.prisma.genaiInsight.deleteMany({
            where: {
              evaluatedId: userId,
              cycleId: cycleId,
            },
          });
        } else {
          console.log(`🔄 Resumo não encontrado para userId:${userId}, cycleId:${cycleId}. Gerando automaticamente...`);
        }

        // Gerar o resumo usando o método existente
        await this.gerarResumoColaborador(cycleId, userId);
        // Buscar novamente após a geração
        resumo = await this.prisma.genaiInsight.findFirst({
          where: {
            evaluatedId: userId,
            cycleId: cycleId,
          },
          include: {
            evaluated: {
              select: {
                name: true,
                email: true,
                role: true,
                position: {
                  select: {
                    name: true,
                    track: true,
                  },
                },
              },
            },
            cycle: {
              select: {
                name: true,
              },
            },
          },
        });

        if (!resumo) {
          throw new NotFoundException(
            'Não foi possível gerar resumo para este colaborador e ciclo - dados insuficientes',
          );
        }
      }

      // Descriptografar campos do usuário (avaliado)
      if (resumo.evaluated?.name) {
        resumo.evaluated.name = this.crypto.decrypt(resumo.evaluated.name);
      }
      if (resumo.evaluated?.email) {
        resumo.evaluated.email = this.crypto.decrypt(resumo.evaluated.email);
      }

      return resumo;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Erro ao buscar resumo do colaborador');
    }
  }

  async gerarResumosEmLote(cycleId: string) {
    try {
      const ciclo = await this.prisma.evaluationCycle.findUnique({
        where: { id: cycleId },
      });

      if (!ciclo) {
        throw new NotFoundException('Ciclo de avaliação não encontrado');
      }

      const usuariosAvaliados = await this.prisma.evaluation.findMany({
        where: {
          cycleId: cycleId,
          completed: true,
        },
        select: {
          evaluatedId: true,
        },
        distinct: ['evaluatedId'],
      });

      const resultados = [];
      let gerados = 0;

      for (const { evaluatedId } of usuariosAvaliados) {
        try {
          const resumo = await this.gerarResumoColaborador(
            cycleId,
            evaluatedId,
          );
          resultados.push({
            userId: evaluatedId,
            success: true,
            insightId: resumo.id,
          });
          gerados++;
        } catch (error) {
          resultados.push({
            userId: evaluatedId,
            success: false,
            error: error.message,
          });
        }
      }

      return {
        total: usuariosAvaliados.length,
        generated: gerados,
        results: resultados,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao gerar resumos em lote');
    }
  }

  private async gerarInsightsComIA(
    usuario: any,
    avaliacoes: any[],
    scorePerCycle: any,
    ciclo: any,
    autoavaliacoes: any[],
    avaliacoesPares: any[],
    avaliacoesLider: any[],
  ) {
    try {
      // Log para debug
      console.log('=== DEBUG: Iniciando geração de insights ===');
      console.log('Total de avaliações:', avaliacoes.length);
      console.log(
        'Auto:',
        autoavaliacoes.length,
        'Pares:',
        avaliacoesPares.length,
        'Líder:',
        avaliacoesLider.length,
      );
      const dadosEstruturados = this.prepararDadosParaAnalise(
        usuario,
        avaliacoes,
        scorePerCycle,
        ciclo,
        autoavaliacoes,
        avaliacoesPares,
        avaliacoesLider,
      );

      const prompt = this.criarPromptDetalhado(dadosEstruturados);

      console.log(
        'Prompt enviado para Gemini (primeiros 200 chars):',
        prompt.substring(0, 200),
      );

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log(
        'Resposta do Gemini (primeiros 200 chars):',
        text.substring(0, 200),
      );

      const insights = this.parsearRespostaGemini(text);

      return insights;
    } catch (error) {
      console.error('Erro ao gerar insights com Gemini:', error);
      return this.gerarInsightsLocal(
        usuario,
        avaliacoes,
        scorePerCycle,
        ciclo,
        autoavaliacoes,
        avaliacoesPares,
        avaliacoesLider,
      );
    }
  }
  private criarPromptParaGemini(
    usuario: any,
    avaliacoes: any[],
    scorePerCycle: any,
    ciclo: any,
    mediaScores: any,
    discrepanciasEncontradas: any[],
    autoavaliacoes: any[],
    avaliacoesPares: any[],
    avaliacoesLider: any[],
  ): string {
    const posicao = usuario.position?.name || 'N/A';
    const track = usuario.position?.track || 'N/A';
    const equipe = usuario.teamMemberships[0]?.team?.name || 'N/A';

    const analiseAutoavaliacao =
      autoavaliacoes.length > 0
        ? `Autoavaliação disponível (${autoavaliacoes.length} avaliação)`
        : 'Não há autoavaliação disponível';

    const analisePares =
      avaliacoesPares.length > 0
        ? `Avaliações de pares disponíveis (${avaliacoesPares.length} avaliações)`
        : 'Não há avaliação de pares disponível';

    const analiseLider =
      avaliacoesLider.length > 0
        ? `Avaliação do líder disponível (${avaliacoesLider.length} avaliação)`
        : 'Não há avaliação do líder disponível';

    // Preparar dados das avaliações com mais detalhes
    const avaliacoesTexto = avaliacoes
      .map((av: any) => {
        const criterios = av.answers.map((answer: any) => ({
          criterio: answer.criterion.title,
          score: answer.score,
          justificativa: answer.justification || 'Sem justificativa',
          tipo: answer.criterion.type,
        }));

        const mediaAvaliacao =
          criterios.reduce((sum: number, c: any) => sum + c.score, 0) /
          criterios.length;

        return `${av.type === 'AUTO' ? '🔍 AUTOAVALIAÇÃO' : av.type === 'LIDER' ? '👨‍💼 AVALIAÇÃO DO LÍDER' : '👥 AVALIAÇÃO DE PAR'} - ${av.evaluator.name} (${av.evaluator.role})
Média desta avaliação: ${mediaAvaliacao.toFixed(1)}/5
Detalhes por critério:
${criterios
  .map(
    (c: any) => `  • ${c.criterio} (${c.tipo}): ${c.score}/5
    Justificativa: "${c.justificativa}"`,
  )
  .join('\n')}
`;
      })
      .join('\n');

    // Preparar dados de scores
    const scoresTexto = scorePerCycle
      ? `
Scores Consolidados:
- Autoavaliação: ${scorePerCycle.selfScore || 'N/A'}/5
- Avaliação do Líder: ${scorePerCycle.leaderScore || 'N/A'}/5
- Avaliação dos Pares: ${scorePerCycle.peerScores?.map((p: any) => p.value).join(', ') || 'N/A'}/5
- Score Final: ${scorePerCycle.finalScore || 'N/A'}/5
`
      : 'Scores não disponíveis';
    return `
Você é um especialista em análise de performance e desenvolvimento de talentos. Analise os dados de avaliação do colaborador abaixo e gere insights estruturados e acionáveis.

DADOS DO COLABORADOR:
Nome: ${usuario.name}
Posição: ${posicao}
Track: ${track}
Equipe: ${equipe}
Ciclo: ${ciclo.name}

COBERTURA DE AVALIAÇÕES:
• ${analiseAutoavaliacao}
• ${analisePares}  
• ${analiseLider}

AVALIAÇÕES DETALHADAS:
${avaliacoesTexto}

${scoresTexto}

ESTATÍSTICAS CONSOLIDADAS:
- Total de avaliações: ${avaliacoes.length}
- Média geral: ${mediaScores.media}/5
- Score mínimo: ${mediaScores.min}/5
- Score máximo: ${mediaScores.max}/5
- Variação (max-min): ${mediaScores.max - mediaScores.min} pontos
- Discrepâncias identificadas: ${discrepanciasEncontradas.length}

ANÁLISE POR TIPO:
• Autoavaliações: ${autoavaliacoes.length} | Média: ${autoavaliacoes.length > 0 ? this.calcularMediaScores(autoavaliacoes).media.toFixed(1) : 'N/A'}/5
• Avaliações de Pares: ${avaliacoesPares.length} | Média: ${avaliacoesPares.length > 0 ? this.calcularMediaScores(avaliacoesPares).media.toFixed(1) : 'N/A'}/5  
• Avaliações de Líder: ${avaliacoesLider.length} | Média: ${avaliacoesLider.length > 0 ? this.calcularMediaScores(avaliacoesLider).media.toFixed(1) : 'N/A'}/5

INSTRUÇÕES PARA ANÁLISE:
Gere uma análise completa no seguinte formato JSON:

{
  "summary": "Resumo executivo da performance (3-4 parágrafos). Inclua: contexto do colaborador, performance geral, principais forças identificadas, áreas de melhoria específicas com base nos dados reais, e análise de consistência/variações entre autoavaliação, pares e líder.",
  "brutalFacts": "Pontos críticos e acionáveis baseados nos dados: 1) Principais gaps de performance, 2) Riscos para o colaborador/equipe, 3) Ações específicas recomendadas, 4) Prioridades de desenvolvimento, 5) Recomendações para alinhamento de percepções se necessário."
}

DIRETRIZES CRÍTICAS:
- Base-se EXCLUSIVAMENTE nos dados fornecidos
- Seja específico com números e exemplos reais das avaliações
- Identifique padrões nas justificativas fornecidas
- Compare scores entre tipos de avaliação no resumo quando relevante
- Para brutal facts: seja direto mas construtivo
- Sugira ações específicas e mensuráveis
- Mantenha tom profissional e respeitoso
- Se dados são insuficientes, seja transparente sobre limitações
`;
  }
  private parsearRespostaGemini(text: string) {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          summary: parsed.summary || 'Resumo não gerado',
          brutalFacts:
            parsed.brutalFacts || 'Pontos críticos não identificados',
        };
      }

      return this.extrairInsightsDoTexto(text);
    } catch (error) {
      console.error('Erro ao parsear resposta do Gemini:', error);
      return {
        summary: text.substring(0, 500) + '...',
        brutalFacts: 'Erro ao processar pontos críticos',
      };
    }
  }

  private extrairInsightsDoTexto(text: string) {
    const sections = text.split('\n\n');
    return {
      summary: sections[0] || 'Resumo não disponível',
      brutalFacts: sections[1] || 'Pontos críticos não identificados',
    };
  }

  async testarConexaoGemini() {
    try {
      const prompt =
        "Olá! Este é um teste de conexão. Responda apenas com 'Conexão com Gemini funcionando corretamente!'";

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        message: 'Conexão com Gemini estabelecida com sucesso',
        response: text,
      };
    } catch (error) {
      console.error('Erro ao testar Gemini:', error);
      return {
        success: false,
        message: 'Erro ao conectar com Gemini',
        error: error.message,
      };
    }
  }

  private prepararDadosParaAnalise(
    usuario: any,
    avaliacoes: any[],
    scorePerCycle: any,
    ciclo: any,
    autoavaliacoes: any[],
    avaliacoesPares: any[],
    avaliacoesLider: any[],
  ) {
    // Calcular médias por tipo de avaliação
    const mediaAuto =
      autoavaliacoes.length > 0
        ? this.calcularMediaScores(autoavaliacoes)
        : null;
    const mediaPares =
      avaliacoesPares.length > 0
        ? this.calcularMediaScores(avaliacoesPares)
        : null;
    const mediaLider =
      avaliacoesLider.length > 0
        ? this.calcularMediaScores(avaliacoesLider)
        : null;

    const mediaGeral = this.calcularMediaScores(avaliacoes);
    const analiseDiscrepancias = this.analisarDiscrepanciasDetalhadas(
      mediaAuto,
      mediaPares,
      mediaLider,
      scorePerCycle,
    );

    const analisePortiporios = this.analisarCriteriosPorTipo(avaliacoes);

    const pontosFortesEFracos = this.identificarPontosFortesEFracos(avaliacoes);

    const analiseVariacao = this.analisarVariacaoEConsistencia(avaliacoes);

    return {
      usuario: {
        nome: usuario.name,
        posicao: usuario.position?.name || 'N/A',
        track: usuario.position?.track || 'N/A',
        equipe: usuario.teamMemberships[0]?.team?.name || 'N/A',
      },
      ciclo: {
        nome: ciclo.name,
        periodo: `${ciclo.startDate} - ${ciclo.endDate}`,
      },
      cobertura: {
        totalAvaliacoes: avaliacoes.length,
        autoavaliacoes: autoavaliacoes.length,
        avaliacoesPares: avaliacoesPares.length,
        avaliacoesLider: avaliacoesLider.length,
      },
      medias: {
        geral: mediaGeral,
        auto: mediaAuto,
        pares: mediaPares,
        lider: mediaLider,
      },
      discrepancias: analiseDiscrepancias,
      analisePortiporios: analisePortiporios,
      pontosFortesEFracos: pontosFortesEFracos,
      analiseVariacao: analiseVariacao,
      scorePerCycle: scorePerCycle,
      avaliacoesDetalhadas: this.formatarAvaliacoesDetalhadas(avaliacoes),
    };
  }
  private analisarDiscrepanciasDetalhadas(
    mediaAuto: any,
    mediaPares: any,
    mediaLider: any,
    scorePerCycle: any,
  ) {
    const discrepancias = [];
    const tiposDisponveis = [];

    // Identificar quais tipos de avaliação estão disponíveis
    if (mediaAuto) tiposDisponveis.push('auto');
    if (mediaPares) tiposDisponveis.push('pares');
    if (mediaLider) tiposDisponveis.push('lider');

    // Comparar autoavaliação vs pares
    if (mediaAuto && mediaPares) {
      const diferenca = Math.abs(mediaAuto.media - mediaPares.media);
      if (diferenca > 0.3) {
        // Threshold mais baixo para detectar discrepâncias sutis
        discrepancias.push({
          tipo: 'auto_vs_pares',
          diferenca: diferenca,
          autoMedia: mediaAuto.media,
          paresMedia: mediaPares.media,
          gravidade:
            diferenca > 1.5 ? 'alta' : diferenca > 0.8 ? 'media' : 'baixa',
          interpretacao:
            mediaAuto.media > mediaPares.media
              ? 'Autoavaliação superior aos pares'
              : 'Pares avaliam melhor que autoavaliação',
          contexto: this.gerarContextoDiscrepancia(
            'auto_vs_pares',
            diferenca,
            mediaAuto,
            mediaPares,
          ),
        });
      }
    }

    // Comparar autoavaliação vs líder
    if (mediaAuto && mediaLider) {
      const diferenca = Math.abs(mediaAuto.media - mediaLider.media);
      if (diferenca > 0.3) {
        discrepancias.push({
          tipo: 'auto_vs_lider',
          diferenca: diferenca,
          autoMedia: mediaAuto.media,
          liderMedia: mediaLider.media,
          gravidade:
            diferenca > 1.5 ? 'alta' : diferenca > 0.8 ? 'media' : 'baixa',
          interpretacao:
            mediaAuto.media > mediaLider.media
              ? 'Autoavaliação superior ao líder'
              : 'Líder avalia melhor que autoavaliação',
          contexto: this.gerarContextoDiscrepancia(
            'auto_vs_lider',
            diferenca,
            mediaAuto,
            mediaLider,
          ),
        });
      }
    }

    // Comparar pares vs líder
    if (mediaPares && mediaLider) {
      const diferenca = Math.abs(mediaPares.media - mediaLider.media);
      if (diferenca > 0.3) {
        discrepancias.push({
          tipo: 'pares_vs_lider',
          diferenca: diferenca,
          paresMedia: mediaPares.media,
          liderMedia: mediaLider.media,
          gravidade:
            diferenca > 1.5 ? 'alta' : diferenca > 0.8 ? 'media' : 'baixa',
          interpretacao:
            mediaPares.media > mediaLider.media
              ? 'Pares avaliam melhor que líder'
              : 'Líder avalia melhor que pares',
          contexto: this.gerarContextoDiscrepancia(
            'pares_vs_lider',
            diferenca,
            mediaPares,
            mediaLider,
          ),
        });
      }
    }

    // Analisar limitações de dados e adicionar contexto
    const limitacoesDados = this.analisarLimitacoesDados(
      tiposDisponveis,
      mediaAuto,
      mediaPares,
      mediaLider,
    );

    return {
      discrepancias,
      tiposDisponveis,
      limitacoesDados,
      cobertura: {
        total: tiposDisponveis.length,
        tem360: tiposDisponveis.length === 3,
        parcial: tiposDisponveis.length < 3,
      },
    };
  }
  private analisarCriteriosPorTipo(avaliacoes: any[]) {
    const criteriosPorTipo: any = {};

    avaliacoes.forEach((avaliacao: any) => {
      avaliacao.answers.forEach((answer: any) => {
        const criterio = answer.criterion.title;
        const tipo = answer.criterion.type;
        const tipoAvaliacao = avaliacao.type;

        if (!criteriosPorTipo[criterio]) {
          criteriosPorTipo[criterio] = {
            tipo: tipo,
            scores: [],
            porTipoAvaliacao: {},
          };
        }

        criteriosPorTipo[criterio].scores.push(answer.score);

        if (!criteriosPorTipo[criterio].porTipoAvaliacao[tipoAvaliacao]) {
          criteriosPorTipo[criterio].porTipoAvaliacao[tipoAvaliacao] = [];
        }
        criteriosPorTipo[criterio].porTipoAvaliacao[tipoAvaliacao].push(
          answer.score,
        );
      });
    });

    // Calcular médias por critério
    Object.keys(criteriosPorTipo).forEach((criterio: string) => {
      const scores = criteriosPorTipo[criterio].scores;
      criteriosPorTipo[criterio].media =
        scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
      criteriosPorTipo[criterio].min = Math.min(...scores);
      criteriosPorTipo[criterio].max = Math.max(...scores);
      criteriosPorTipo[criterio].variacao =
        criteriosPorTipo[criterio].max - criteriosPorTipo[criterio].min;

      // Médias por tipo de avaliação
      Object.keys(criteriosPorTipo[criterio].porTipoAvaliacao).forEach(
        (tipoAv: string) => {
          const scoresArr = criteriosPorTipo[criterio].porTipoAvaliacao[tipoAv];
          criteriosPorTipo[criterio].porTipoAvaliacao[tipoAv] = {
            scores: scoresArr,
            media:
              scoresArr.reduce((a: number, b: number) => a + b, 0) /
              scoresArr.length,
          };
        },
      );
    });

    return criteriosPorTipo;
  }
  private identificarPontosFortesEFracos(avaliacoes: any[]) {
    const criteriosPorMedia: any = {};

    avaliacoes.forEach((avaliacao: any) => {
      avaliacao.answers.forEach((answer: any) => {
        const criterio = answer.criterion.title;
        if (!criteriosPorMedia[criterio]) {
          criteriosPorMedia[criterio] = {
            scores: [],
            justificativas: [],
            tipo: answer.criterion.type,
          };
        }
        criteriosPorMedia[criterio].scores.push(answer.score);
        if (answer.justification && answer.justification.trim()) {
          criteriosPorMedia[criterio].justificativas.push(answer.justification);
        }
      });
    });

    const criteriosComMedia = Object.keys(criteriosPorMedia).map(
      (criterio: string) => ({
        criterio,
        media:
          criteriosPorMedia[criterio].scores.reduce(
            (a: number, b: number) => a + b,
            0,
          ) / criteriosPorMedia[criterio].scores.length,
        tipo: criteriosPorMedia[criterio].tipo,
        justificativas: criteriosPorMedia[criterio].justificativas,
      }),
    );

    const criteriosOrdenados = criteriosComMedia.sort(
      (a, b) => b.media - a.media,
    );

    return {
      pontosForts: criteriosOrdenados.slice(0, 3), // Top 3
      pontoesFracos: criteriosOrdenados.slice(-3).reverse(), // Bottom 3
      todoseCriterios: criteriosOrdenados,
    };
  }

  private analisarVariacaoEConsistencia(avaliacoes: any[]) {
    const todasRespostass = avaliacoes.flatMap((av: any) =>
      av.answers.map((ans: any) => ans.score),
    );
    const media =
      todasRespostass.reduce((a: number, b: number) => a + b, 0) /
      todasRespostass.length;
    const variacao =
      Math.max(...todasRespostass) - Math.min(...todasRespostass);

    // Calcular desvio padrão
    const diferencasQuadradas = todasRespostass.map((score: number) =>
      Math.pow(score - media, 2),
    );
    const variancia =
      diferencasQuadradas.reduce((a: number, b: number) => a + b, 0) /
      todasRespostass.length;
    const desvioPadrao = Math.sqrt(variancia);

    return {
      media: media,
      variacao: variacao,
      desvioPadrao: desvioPadrao,
      consistencia:
        desvioPadrao < 0.5 ? 'alta' : desvioPadrao < 1 ? 'media' : 'baixa',
      totalRespostas: todasRespostass.length,
    };
  }

  private formatarAvaliacoesDetalhadas(avaliacoes: any[]) {
    return avaliacoes.map((avaliacao: any) => ({
      tipo: avaliacao.type,
      avaliador: {
        nome: avaliacao.evaluator.name,
        role: avaliacao.evaluator.role,
      },
      criterios: avaliacao.answers.map((answer: any) => ({
        titulo: answer.criterion.title,
        tipo: answer.criterion.type,
        descricao: answer.criterion.description,
        score: answer.score,
        justificativa: answer.justification || 'Sem justificativa fornecida',
      })),
      mediaAvaliacao:
        avaliacao.answers.reduce(
          (sum: number, ans: any) => sum + ans.score,
          0,
        ) / avaliacao.answers.length,
    }));
  }

  private criarPromptDetalhado(dadosEstruturados: any): string {
    const {
      usuario,
      ciclo,
      cobertura,
      medias,
      discrepancias,
      analisePortiporios,
      pontosFortesEFracos,
      analiseVariacao,
      avaliacoesDetalhadas,
    } = dadosEstruturados;

    let discrepanciasTexto = '';
    if (discrepancias.length > 0) {
      discrepanciasTexto = `\n📊 DISCREPÂNCIAS IDENTIFICADAS:
${discrepancias
  .map(
    (
      d: any,
    ) => `• ${d.tipo.replace(/_/g, ' ').toUpperCase()}: ${d.diferenca.toFixed(1)} pontos de diferença (${d.gravidade.toUpperCase()})
  Interpretação: ${d.interpretacao}`,
  )
  .join('\n')}`;
    } else {
      discrepanciasTexto =
        '\n✅ CONSISTÊNCIA: Não há discrepâncias significativas entre as avaliações.';
    }

    const pontosFortesTexto = pontosFortesEFracos.pontosForts
      .map(
        (p: any) =>
          `• ${p.criterio} (${p.tipo}): ${p.media.toFixed(1)}/5
    ${p.justificativas.length > 0 ? 'Justificativas: ' + p.justificativas.slice(0, 2).join('; ') : 'Sem justificativas detalhadas'}`,
      )
      .join('\n');

    const pontosFracosTexto = pontosFortesEFracos.pontoesFracos
      .map(
        (p: any) =>
          `• ${p.criterio} (${p.tipo}): ${p.media.toFixed(1)}/5
    ${p.justificativas.length > 0 ? 'Justificativas: ' + p.justificativas.slice(0, 2).join('; ') : 'Sem justificativas detalhadas'}`,
      )
      .join('\n');

    const criteriosDetalhados = Object.keys(analisePortiporios)
      .map((criterio: string) => {
        const dados = analisePortiporios[criterio];
        let comparacao = '';

        if (dados.porTipoAvaliacao.AUTO && dados.porTipoAvaliacao.LIDER) {
          const diff = Math.abs(
            dados.porTipoAvaliacao.AUTO.media -
              dados.porTipoAvaliacao.LIDER.media,
          );
          if (diff > 0.5) {
            comparacao = ` (⚠️ Discrepância AUTO vs LÍDER: ${diff.toFixed(1)} pontos)`;
          }
        }

        if (dados.porTipoAvaliacao.AUTO && dados.porTipoAvaliacao.PAR) {
          const diff = Math.abs(
            dados.porTipoAvaliacao.AUTO.media -
              dados.porTipoAvaliacao.PAR.media,
          );
          if (diff > 0.5) {
            comparacao += ` (⚠️ Discrepância AUTO vs PARES: ${diff.toFixed(1)} pontos)`;
          }
        }

        return `• ${criterio} (${dados.tipo}): Média ${dados.media.toFixed(1)}/5 (variação: ${dados.variacao})${comparacao}`;
      })
      .join('\n');

    const avaliacoesDetalhadasTexto = avaliacoesDetalhadas
      .map((av: any) => {
        const tipoIcon =
          av.tipo === 'AUTO' ? '🔍' : av.tipo === 'LIDER' ? '👨‍💼' : '👥';
        return `${tipoIcon} ${av.tipo} - ${av.avaliador.nome} (${av.avaliador.role}) - Média: ${av.mediaAvaliacao.toFixed(1)}/5
${av.criterios.map((c: any) => `  ${c.titulo}: ${c.score}/5 - "${c.justificativa}"`).join('\n')}`;
      })
      .join('\n\n');

    return `
IMPORTANTE: Responda SEMPRE e EXCLUSIVAMENTE em português brasileiro. Nunca use inglês.

Você é um especialista sênior em análise de performance organizacional com 15+ anos de experiência em desenvolvimento de talentos. Analise os dados de avaliação 360° abaixo e gere insights profundos, acionáveis e baseados em evidências.

═══════════════════════════════════════════════════════════════════════════
DADOS DO COLABORADOR
═══════════════════════════════════════════════════════════════════════════
👤 Nome: ${usuario.nome}
💼 Posição: ${usuario.posicao}
🎯 Track: ${usuario.track}
👥 Equipe: ${usuario.equipe}
📅 Ciclo: ${ciclo.nome} (${ciclo.periodo})

═══════════════════════════════════════════════════════════════════════════
COBERTURA DE AVALIAÇÕES
═══════════════════════════════════════════════════════════════════════════
📊 Total de avaliações: ${cobertura.totalAvaliacoes}
🔍 Autoavaliações: ${cobertura.autoavaliacoes}
👥 Avaliações de pares: ${cobertura.avaliacoesPares}
👨‍💼 Avaliações do líder: ${cobertura.avaliacoesLider}

═══════════════════════════════════════════════════════════════════════════
ANÁLISE ESTATÍSTICA
═══════════════════════════════════════════════════════════════════════════
📈 MÉDIAS POR TIPO:
${medias.geral ? `• Média geral: ${medias.geral.media.toFixed(1)}/5 (${medias.geral.total} respostas)` : ''}
${medias.auto ? `• Autoavaliação: ${medias.auto.media.toFixed(1)}/5` : '• Autoavaliação: Não disponível'}
${medias.pares ? `• Pares: ${medias.pares.media.toFixed(1)}/5` : '• Pares: Não disponível'}
${medias.lider ? `• Líder: ${medias.lider.media.toFixed(1)}/5` : '• Líder: Não disponível'}

📊 VARIAÇÃO E CONSISTÊNCIA:
• Variação total: ${analiseVariacao.variacao} pontos
• Desvio padrão: ${analiseVariacao.desvioPadrao.toFixed(2)}
• Consistência: ${analiseVariacao.consistencia.toUpperCase()}

${discrepanciasTexto}

═══════════════════════════════════════════════════════════════════════════
ANÁLISE POR CRITÉRIOS
═══════════════════════════════════════════════════════════════════════════
🏆 PRINCIPAIS FORÇAS:
${pontosFortesTexto}

⚠️ ÁREAS DE DESENVOLVIMENTO:
${pontosFracosTexto}

📋 TODOS OS CRITÉRIOS:
${criteriosDetalhados}

═══════════════════════════════════════════════════════════════════════════
AVALIAÇÕES DETALHADAS
═══════════════════════════════════════════════════════════════════════════
${avaliacoesDetalhadasTexto}

═══════════════════════════════════════════════════════════════════════════
INSTRUÇÕES PARA ANÁLISE
═══════════════════════════════════════════════════════════════════════════
Como especialista, você deve:

1. 🔍 ANALISAR PADRÕES: Identifique tendências nas justificativas e scores
2. 📊 COMPARAR PERSPECTIVAS: Analise diferenças entre auto, pares e líder
3. 🎯 IDENTIFICAR ROOT CAUSES: Vá além dos sintomas, encontre causas raiz
4. 💡 GERAR INSIGHTS ACIONÁVEIS: Foque em recomendações específicas e mensuráveis
5. 🚀 PLANEJAR DESENVOLVIMENTO: Sugira próximos passos concretos

GERE UMA RESPOSTA NO FORMATO JSON EXATO:

{
  "summary": "Análise executiva da performance (300-400 palavras). DEVE incluir: 1) Contexto e performance geral do colaborador, 2) Principais forças baseadas nos dados reais (cite números e justificativas específicas), 3) Áreas de melhoria com evidências dos dados, 4) Padrões identificados nas avaliações e 5) Avaliação da maturidade profissional com base na consistência das avaliações.",
  
  "discrepancies": "Análise profunda das discrepâncias (250-300 palavras). DEVE incluir: 1) Identificação específica de gaps entre autoavaliação vs pares vs líder com números, 2) Possíveis causas dessas discrepâncias baseadas nas justificativas, 3) Impactos dessas discrepâncias na performance e relacionamentos, 4) Recomendações específicas para alinhamento de percepções, 5) Se não houver discrepâncias significativas, análise da consistência e o que isso indica sobre o colaborador.",
  
  "brutalFacts": "Pontos críticos e acionáveis (200-250 palavras). DEVE incluir: 1) Os 3 principais desafios/gaps identificados com base nos dados, 2) Riscos específicos para o colaborador, equipe ou organização, 3) Ações imediatas recomendadas (próximos 30-60 dias), 4) Plano de desenvolvimento específico com cronograma, 5) Métricas para acompanhar progresso. Seja direto mas construtivo."
}

REGRAS CRÍTICAS:
❌ NÃO use dados fictícios ou suposições
❌ NÃO gere insights genéricos
❌ NÃO ignore as justificativas fornecidas
✅ SEMPRE cite números específicos dos dados
✅ SEMPRE base insights nas justificativas reais
✅ SEMPRE seja específico e acionável
✅ SEMPRE mantenha tom profissional e construtivo
`;
  }

  async gerarBrutalFactsGestor(cycleId: string, managerId: string) {
    try {
      console.log(`🔍 Gerando brutal facts para gestor ${managerId} no ciclo: ${cycleId}`);

      // Buscar informações do ciclo
      const ciclo = await this.prisma.evaluationCycle.findUnique({
        where: { id: cycleId },
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
        },
      });

      if (!ciclo) {
        throw new NotFoundException(`Ciclo ${cycleId} não encontrado`);
      }

      // Buscar todos os scores do ciclo apenas dos colaboradores liderados pelo gestor
      const scoresPerCycle = await this.prisma.scorePerCycle.findMany({
        where: { 
          cycleId: cycleId,
          user: {
            managerId: managerId, // Filtrar apenas colaboradores do gestor logado
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
              position: {
                select: {
                  name: true,
                  track: true,
                },
              },
            },
          },
        },
        orderBy: {
          finalScore: 'desc',
        },
      });

      // Buscar insights gerados para o ciclo apenas dos colaboradores do gestor
      const insights = await this.prisma.genaiInsight.findMany({
        where: { 
          cycleId: cycleId,
          evaluated: {
            managerId: managerId, // Filtrar apenas colaboradores do gestor logado
          },
        },
        include: {
          evaluated: {
            select: {
              name: true,
              position: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      // Buscar avaliações do ciclo para análise de cobertura apenas dos colaboradores do gestor
      const evaluations = await this.prisma.evaluation.findMany({
        where: { 
          cycleId: cycleId,
          evaluated: {
            managerId: managerId, // Filtrar apenas colaboradores do gestor logado
          },
        },
        select: {
          evaluatedId: true,
          type: true,
          completed: true,
        },
      });

      // Calcular estatísticas
      const totalColaboradores = scoresPerCycle.length;
      console.log(`📊 Encontrados ${totalColaboradores} colaboradores liderados pelo gestor ${managerId} no ciclo ${cycleId}`);
      
      const scoresValidos = scoresPerCycle.filter(
        (s) => s.finalScore && s.finalScore > 0,
      );
      const mediaGeral =
        scoresValidos.length > 0
          ? scoresValidos.reduce((sum, s) => sum + (s.finalScore || 0), 0) /
            scoresValidos.length
          : 0;

      // Classificar performance
      const distribuicaoPerformance = {
        topPerformers: scoresValidos.filter((s) => (s.finalScore || 0) >= 4.5)
          .length, // 4.5+
        altaPerformance: scoresValidos.filter(
          (s) => (s.finalScore || 0) >= 4.0 && (s.finalScore || 0) < 4.5,
        ).length, // 4.0-4.49
        performanceMedia: scoresValidos.filter(
          (s) => (s.finalScore || 0) >= 3.0 && (s.finalScore || 0) < 4.0,
        ).length, // 3.0-3.99
        baixaPerformance: scoresValidos.filter(
          (s) => (s.finalScore || 0) >= 2.0 && (s.finalScore || 0) < 3.0,
        ).length, // 2.0-2.99
        criticos: scoresValidos.filter((s) => (s.finalScore || 0) < 2.0).length, // <2.0
      };

      // Análise de cobertura de avaliações
      const coberturaAnalise = this.analisarCoberturaAvaliacoes(
        evaluations,
        totalColaboradores,
      );

      // Gerar insights principais para uso interno na geração do resumo
      const principaisInsights = this.gerarInsightsExecutivos(
        distribuicaoPerformance,
        mediaGeral,
        totalColaboradores,
        coberturaAnalise,
        scoresValidos,
      );

      // Gerar resumo executivo
      const resumoExecutivo = this.gerarTextoResumoExecutivo(
        distribuicaoPerformance,
        mediaGeral,
        totalColaboradores,
        ciclo.name,
        principaisInsights,
        true, // Indicar que é para gestor específico
      );

      return {
        cycleId: ciclo.id,
        cycleName: ciclo.name,
        totalColaboradores,
        mediaGeral: Math.round(mediaGeral * 100) / 100,
        distribuicaoPerformance,
        resumoExecutivo,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('❌ Erro ao gerar resumo executivo:', error);
      throw new BadRequestException('Erro ao gerar resumo executivo do ciclo');
    }
  }

  private analisarCoberturaAvaliacoes(
    evaluations: any[],
    totalColaboradores: number,
  ) {
    const avaliacoesPorColaborador = new Map();

    evaluations.forEach((evaluation) => {
      if (!avaliacoesPorColaborador.has(evaluation.evaluatedId)) {
        avaliacoesPorColaborador.set(evaluation.evaluatedId, {
          auto: false,
          lider: false,
          pares: false,
          total: 0,
        });
      }

      const userEvals = avaliacoesPorColaborador.get(evaluation.evaluatedId);
      if (evaluation.completed) {
        userEvals.total++;
        if (evaluation.type === 'AUTO') userEvals.auto = true;
        if (evaluation.type === 'LIDER') userEvals.lider = true;
        if (evaluation.type === 'PARES') userEvals.pares = true;
      }
    });

    const colaboradoresComAvaliacao = avaliacoesPorColaborador.size;
    const colaboradoresSemAvaliacao =
      totalColaboradores - colaboradoresComAvaliacao;

    // Analisar qualidade da cobertura
    let cobertura360Completa = 0;
    let coberturaBasica = 0;

    for (const [userId, evals] of avaliacoesPorColaborador) {
      if (evals.auto && evals.lider && evals.pares) {
        cobertura360Completa++;
      } else if (evals.total >= 2) {
        coberturaBasica++;
      }
    }

    return {
      colaboradoresComAvaliacao,
      colaboradoresSemAvaliacao,
      cobertura360Completa,
      coberturaBasica,
      percentualCobertura:
        (colaboradoresComAvaliacao / totalColaboradores) * 100,
    };
  }

  private gerarInsightsExecutivos(
    distribuicao: any,
    mediaGeral: number,
    total: number,
    cobertura: any,
    scores: any[],
  ): string[] {
    const insights = [];

    // Insight sobre top performers
    if (distribuicao.topPerformers === 0) {
      insights.push(
        'Nenhum colaborador atingiu status de top performer (4.5+). Isso indica possível inflação de notas ou problema fundamental de aquisição/desenvolvimento de talentos.',
      );
    } else if (distribuicao.topPerformers > total * 0.3) {
      insights.push(
        `${distribuicao.topPerformers} colaboradores (${Math.round((distribuicao.topPerformers / total) * 100)}%) são top performers - percentual acima do esperado, revisar critérios de avaliação.`,
      );
    } else {
      insights.push(
        `${distribuicao.topPerformers} colaboradores (${Math.round((distribuicao.topPerformers / total) * 100)}%) são top performers - distribuição saudável de talentos.`,
      );
    }

    // Insight sobre performance geral
    if (mediaGeral < 2.5) {
      insights.push(
        `Média geral crítica (${mediaGeral.toFixed(1)}/5.0) - intervenção imediata necessária em toda a equipe.`,
      );
    } else if (mediaGeral < 3.2) {
      insights.push(
        `Média geral abaixo do esperado (${mediaGeral.toFixed(1)}/5.0) - plano de desenvolvimento urgente requerido.`,
      );
    } else if (mediaGeral >= 4.2) {
      insights.push(
        `Média geral excelente (${mediaGeral.toFixed(1)}/5.0) - equipe de alta performance com oportunidades de stretch goals.`,
      );
    } else {
      insights.push(
        `Média geral adequada (${mediaGeral.toFixed(1)}/5.0) - equipe estável com potencial de crescimento.`,
      );
    }

    // Insight sobre distribuição
    if (distribuicao.criticos > 0) {
      insights.push(
        `${distribuicao.criticos} colaboradores em situação crítica (<2.0) - plano de melhoria de performance ou desligamento necessário.`,
      );
    }

    if (distribuicao.baixaPerformance > total * 0.4) {
      insights.push(
        `${Math.round((distribuicao.baixaPerformance / total) * 100)}% da equipe com baixa performance - problema sistêmico que requer análise de processos, treinamentos e liderança.`,
      );
    }

    // Insight sobre cobertura de avaliações
    if (cobertura.percentualCobertura < 80) {
      insights.push(
        `Apenas ${Math.round(cobertura.percentualCobertura)}% dos colaboradores possuem avaliações - dados insuficientes para análise confiável.`,
      );
    }

    if (cobertura.cobertura360Completa < total * 0.5) {
      insights.push(
        `Apenas ${cobertura.cobertura360Completa} colaboradores têm avaliação 360° completa - implementar processo estruturado de feedback multi-source.`,
      );
    }

    return insights;
  }

  private gerarTextoResumoExecutivo(
    distribuicao: any,
    mediaGeral: number,
    total: number,
    cycleName: string,
    insights: string[],
    isGestorEspecifico: boolean = false,
  ): string {
    const prefixo = isGestorEspecifico 
      ? `Análise executiva do ciclo ${cycleName} com ${total} colaboradores da sua equipe avaliados. `
      : `Análise executiva do ciclo ${cycleName} com ${total} colaboradores avaliados. `;
    
    let resumo = prefixo;

    resumo += `A performance geral da equipe apresenta média de ${mediaGeral.toFixed(1)}/5.0, `;

    if (mediaGeral >= 4.0) {
      resumo +=
        'indicando uma equipe de alta performance com oportunidades de maximizar potencial. ';
    } else if (mediaGeral >= 3.5) {
      resumo +=
        'demonstrando performance sólida com espaço para crescimento estruturado. ';
    } else if (mediaGeral >= 3.0) {
      resumo +=
        'sinalizando necessidade de intervenções focadas para elevação de performance. ';
    } else {
      resumo +=
        'evidenciando situação crítica que demanda ação imediata e reestruturação. ';
    }

    // Adicionar contexto da distribuição
    if (distribuicao.topPerformers > 0) {
      resumo += `${distribuicao.topPerformers} colaboradores destacam-se como top performers, `;
    } else {
      resumo += 'Ausência de top performers identificados, ';
    }

    if (distribuicao.criticos > 0) {
      resumo += `enquanto ${distribuicao.criticos} requerem plano de melhoria crítica. `;
    } else {
      resumo += 'sem casos críticos identificados. ';
    }

    resumo += 'Os dados indicam ';

    if (insights.some((i) => i.includes('problema sistêmico'))) {
      resumo +=
        'necessidade de revisão de processos organizacionais e estratégia de desenvolvimento de pessoas.';
    } else if (insights.some((i) => i.includes('distribuição saudável'))) {
      resumo +=
        'distribuição saudável de talentos com oportunidades de otimização e stretch assignments.';
    } else {
      resumo +=
        'oportunidades específicas de desenvolvimento e calibração de critérios avaliativos.';
    }

    return resumo;
  }

  private gerarRecomendacoesAcoes(
    distribuicao: any,
    mediaGeral: number,
    cobertura: any,
  ): string[] {
    const recomendacoes = [];

    // Recomendações baseadas em performance
    if (distribuicao.criticos > 0) {
      recomendacoes.push(
        'Implementar PIP (Performance Improvement Plan) imediato para colaboradores críticos',
      );
      recomendacoes.push(
        'Definir timeline de 60-90 dias para melhoria ou considerar desligamento',
      );
    }

    if (distribuicao.baixaPerformance > distribuicao.performanceMedia) {
      recomendacoes.push(
        'Criar programa estruturado de mentoring e coaching para baixa performance',
      );
      recomendacoes.push(
        'Revisar processo de onboarding e treinamentos iniciais',
      );
    }

    if (distribuicao.topPerformers > 0) {
      recomendacoes.push(
        'Desenvolver plano de retenção e crescimento para top performers',
      );
      recomendacoes.push(
        'Implementar stretch assignments e projetos estratégicos',
      );
    } else {
      recomendacoes.push(
        'Identificar potenciais high performers e criar plano de aceleração',
      );
    }

    // Recomendações baseadas em cobertura
    if (cobertura.percentualCobertura < 90) {
      recomendacoes.push(
        'Garantir 100% de cobertura avaliativa no próximo ciclo',
      );
    }

    if (
      cobertura.cobertura360Completa <
      cobertura.colaboradoresComAvaliacao * 0.7
    ) {
      recomendacoes.push(
        'Implementar processo obrigatório de feedback 360° para todos os colaboradores',
      );
    }

    // Recomendações baseadas na média geral
    if (mediaGeral < 3.5) {
      recomendacoes.push(
        'Realizar diagnóstico organizacional para identificar gaps sistêmicos',
      );
      recomendacoes.push('Revisar estrutura de compensação e benefícios');
    }

    if (mediaGeral > 4.2) {
      recomendacoes.push(
        'Revisar critérios avaliativos para evitar inflação de notas',
      );
      recomendacoes.push(
        'Implementar metas mais desafiadoras para manter engajamento',
      );
    }

    return recomendacoes;
  }

  // ========== MÉTODOS AUXILIARES ==========

  private gerarInsightsLocal(
    usuario: any,
    avaliacoes: any[],
    scorePerCycle: any,
    ciclo: any,
    autoavaliacoes: any[],
    avaliacoesPares: any[],
    avaliacoesLider: any[],
  ) {
    console.log('=== FALLBACK: Usando geração local ===');

    // Preparar dados estruturados mesmo para fallback
    const dadosEstruturados = this.prepararDadosParaAnalise(
      usuario,
      avaliacoes,
      scorePerCycle,
      ciclo,
      autoavaliacoes,
      avaliacoesPares,
      avaliacoesLider,
    );

    const summary = this.gerarSummary(dadosEstruturados);
    const brutalFacts = this.gerarBrutalFacts(dadosEstruturados);

    return {
      summary,
      brutalFacts,
    };
  }

  private gerarSummary(dados: any) {
    const { usuario, medias, discrepancias, pontosFortesEFracos } = dados;
    console.log('Gerando resumo contextualizado...' + dados);
    // Resumo contextualizado
    let resumo = `${usuario.nome} é um profissional na posição de ${usuario.posicao}, atuando na equipe ${usuario.equipe}. `;
    resumo += `No último ciclo avaliativo, participou de avaliações que destacam suas competências e áreas de desenvolvimento.`;

    // Destaques de performance
    if (pontosFortesEFracos.pontosForts.length > 0) {
      resumo += ` Entre seus pontos fortes, destacam-se: ${pontosFortesEFracos.pontosForts
        .slice(0, 2)
        .map((p: any) => p.criterio)
        .join(' e ')}.`;
    }

    // Áreas de melhoria
    if (pontosFortesEFracos.pontoesFracos.length > 0) {
      resumo += ` Como oportunidades de desenvolvimento, foram identificadas: ${pontosFortesEFracos.pontoesFracos
        .slice(0, 2)
        .map((p: any) => p.criterio)
        .join(' e ')}.`;
    }

    // Discrepâncias
    if (discrepancias.discrepancias.length > 0) {
      resumo += ` Há discrepâncias entre as percepções dos avaliadores que requerem atenção.`;
    } else {
      resumo += ` As avaliações mostram consistência entre as diferentes perspectivas.`;
    }

    return resumo;
  }

  private gerarDiscrepancies(dados: any) {
    const { discrepancias } = dados;

    if (discrepancias.discrepancias.length === 0) {
      return 'Não há discrepâncias significativas entre as avaliações realizadas.';
    }

    return `Discrepâncias identificadas: ${discrepancias.discrepancias
      .map((d: any) => {
        return `${d.tipo.replace(/_/g, ' ')} (diferença de ${d.diferenca.toFixed(1)} pontos)`;
      })
      .join(
        ', ',
      )}. Recomenda-se uma reunião de feedback 360° para alinhamento.`;
  }

  private gerarBrutalFacts(dadosEstruturados: any): string {
    const {
      medias,
      pontosFortesEFracos,
      analiseVariacao,
      discrepancias,
      cobertura,
    } = dadosEstruturados;

    const facts = [];

    // Analisar a estrutura de discrepâncias (nova vs antiga)
    const analiseDiscrepancias = discrepancias.discrepancias || discrepancias;
    const coberturaInfo = discrepancias.cobertura || cobertura;
    const limitacoes = discrepancias.limitacoesDados;

    // 1. Análise de performance baseada em dados disponíveis
    if (medias.geral.media < 2.5) {
      facts.push('Performance crítica - intervenção imediata necessária');
    } else if (medias.geral.media < 3.0) {
      facts.push(
        'Performance abaixo do esperado - plano de desenvolvimento urgente',
      );
    } else if (medias.geral.media >= 4.5) {
      facts.push(
        'Performance excepcional - candidato a projetos de alto impacto',
      );
    } else if (medias.geral.media >= 4.0) {
      facts.push('Performance sólida - pronto para novos desafios');
    }

    // 2. Análise de consistência e variação
    if (analiseVariacao.consistencia === 'baixa') {
      facts.push(
        'Inconsistência nas avaliações indica necessidade de calibração de expectativas',
      );
    } else if (
      analiseVariacao.consistencia === 'alta' &&
      medias.geral.media >= 4.0
    ) {
      facts.push(
        'Consistência alta com performance elevada - talento confiável',
      );
    }

    // 3. Análise específica por cobertura de dados
    if (coberturaInfo) {
      if (!coberturaInfo.tem360) {
        facts.push(
          'Avaliação incompleta - implementar feedback 360° para visão abrangente',
        );
      }
    }

    // 4. Análise de discrepâncias como brutal fact
    if (analiseDiscrepancias.length > 1) {
      facts.push(
        'Múltiplas discrepâncias de percepção - sessão de alinhamento crítica',
      );
    } else if (
      analiseDiscrepancias.length === 1 &&
      analiseDiscrepancias[0].gravidade === 'alta'
    ) {
      const disc = analiseDiscrepancias[0];
      facts.push(
        `⚡ GAP ESPECÍFICO: ${disc.tipo.replace(/_/g, ' ').toUpperCase()} com ${disc.diferenca.toFixed(1)} pontos de diferença - foco imediato necessário.`,
      );
    }

    // 5. Análise de pontos fracos críticos
    const weakest = pontosFortesEFracos.pontoesFracos[0];
    if (weakest && weakest.media < 2.8) {
      facts.push(
        `🎯 GAP CRÍTICO: ${weakest.criterio} (${weakest.media.toFixed(1)}/5) é limitador de performance - criar plano de ação com mentoring específico.`,
      );
    } else if (weakest && weakest.media < 3.5) {
      facts.push(
        `📈 ÁREA DE DESENVOLVIMENTO: ${weakest.criterio} (${weakest.media.toFixed(1)}/5) precisa de atenção para unlock de performance.`,
      );
    }

    // 6. Insights baseados em limitações de dados
    if (limitacoes && limitacoes.limitacoes.length > 0) {
      const limitacaoMajor =
        limitacoes.limitacoes.find((l: any) => l.tipo === 'ausencia_lider') ||
        limitacoes.limitacoes.find((l: any) => l.tipo === 'ausencia_pares');
      if (limitacaoMajor) {
        facts.push(`⚠️ DADOS LIMITADOS: ${limitacaoMajor.impacto}`);
      }
    }

    // 7. Análise comparativa por tipo de avaliação
    if (medias.auto && medias.lider) {
      const gapAutoLider = Math.abs(medias.auto.media - medias.lider.media);
      if (gapAutoLider > 1.0) {
        facts.push(
          `🔄 DESALINHAMENTO: Gap de ${gapAutoLider.toFixed(1)} pontos entre autoavaliação e líder - calibração urgente necessária.`,
        );
      }
    }

    // 8. Análise de pontos fortes como brutal fact
    const strongest = pontosFortesEFracos.pontosForts[0];
    if (strongest && strongest.media >= 4.5) {
      facts.push(
        `💪 LEVERAGE STRENGTH: ${strongest.criterio} (${strongest.media.toFixed(1)}/5) é diferencial competitivo - explorar para maximizar impact.`,
      );
    }

    // 9. Fallback se nenhum insight crítico foi identificado
    if (facts.length === 0) {
      if (medias.geral.media >= 3.5) {
        facts.push(
          'Performance equilibrada - focar em desenvolvimento específico para próximo nível',
        );
      } else {
        facts.push(
          'Necessária análise mais detalhada - dados insuficientes para insights definitivos',
        );
      }
    }

    return facts.join(' ');
  }

  private gerarContextoDiscrepancia(
    tipo: string,
    diferenca: number,
    media1: any,
    media2: any,
  ): string {
    const contextos: any = {
      auto_vs_pares: {
        baixa: 'Visões levemente diferentes - normal em avaliações',
        media: 'Diferença significativa indica necessidade de calibração',
        alta: 'Grande gap de percepção requer intervenção imediata',
      },
      auto_vs_lider: {
        baixa:
          'Leve diferença entre self-awareness e expectativas da liderança',
        media: 'Desalinhamento com objetivos ou expectativas da liderança',
        alta: 'Crítico disconnect entre colaborador e líder',
      },
      pares_vs_lider: {
        baixa: 'Perspectivas ligeiramente diferentes entre pares e liderança',
        media: 'Diferença de contexto ou exposure entre pares e líder',
        alta: 'Visões conflitantes requerem alinhamento organizacional',
      },
    };

    const gravidade =
      diferenca > 1.5 ? 'alta' : diferenca > 0.8 ? 'media' : 'baixa';
    return contextos[tipo][gravidade];
  }

  private analisarLimitacoesDados(
    tiposDisponveis: string[],
    mediaAuto: any,
    mediaPares: any,
    mediaLider: any,
  ) {
    const limitacoes = [];

    if (!mediaAuto) {
      limitacoes.push({
        tipo: 'ausencia_auto',
        impacto:
          'Falta de self-awareness data limita análise de calibração pessoal',
        recomendacao: 'Implementar autoavaliação estruturada no próximo ciclo',
      });
    }

    if (!mediaPares) {
      limitacoes.push({
        tipo: 'ausencia_pares',
        impacto:
          'Sem feedback de pares, análise focada apenas em hierarquia vertical',
        recomendacao: 'Incluir ao menos 2-3 peer evaluations para visão 360°',
      });
    }

    if (!mediaLider) {
      limitacoes.push({
        tipo: 'ausencia_lider',
        impacto:
          'Falta perspectiva de liderança para validar alinhamento estratégico',
        recomendacao: 'Essencial incluir avaliação de manager direto',
      });
    }

    // Análise de qualidade dos dados disponíveis
    const qualidadeDados = {
      robustez: tiposDisponveis.length / 3,
      confiabilidade: this.calcularConfiabilidadeDados(
        mediaAuto,
        mediaPares,
        mediaLider,
      ),
      completude:
        tiposDisponveis.length === 3
          ? 'completa'
          : tiposDisponveis.length === 2
            ? 'adequada'
            : 'limitada',
    };

    return {
      limitacoes,
      qualidadeDados,
      tiposDisponveis: tiposDisponveis.length,
      avaliacaoValida: tiposDisponveis.length >= 2, // Pelo menos 2 tipos para comparação
    };
  }

  private calcularConfiabilidadeDados(
    mediaAuto: any,
    mediaPares: any,
    mediaLider: any,
  ): number {
    let pontos = 0;
    let total = 0;

    if (mediaAuto) {
      pontos += mediaAuto.total >= 3 ? 2 : 1; // Mais respostas = mais confiável
      total += 2;
    }

    if (mediaPares) {
      pontos += mediaPares.total >= 5 ? 2 : mediaPares.total >= 2 ? 1.5 : 1;
      total += 2;
    }

    if (mediaLider) {
      pontos += 2; // Leader evaluation sempre tem peso alto
      total += 2;
    }

    return total > 0 ? pontos / total : 0;
  }

  private calcularMediaScores(avaliacoes: any[]) {
    if (!avaliacoes.length) return { media: 0, total: 0 };

    const allScores = avaliacoes.flatMap((av: any) =>
      av.answers.map((answer: any) => answer.score),
    );

    const media =
      allScores.reduce((sum, score) => sum + score, 0) / allScores.length;

    return {
      media: Math.round(media * 100) / 100,
      total: allScores.length,
      min: Math.min(...allScores),
      max: Math.max(...allScores),
    };
  }

  async buscarInsightsDashboard(cycleId: string) {
    try {
      const resumos = await this.prisma.genaiInsight.findMany({
        where: { cycleId: cycleId },
        include: {
          evaluated: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              position: {
                select: {
                  name: true,
                  track: true,
                },
              },
            },
          },
        },
        orderBy: {
          evaluated: {
            name: 'asc',
          },
        },
      });

      // Buscar scores para complementar os dados do dashboard
      const scoresPerCycle = await this.prisma.scorePerCycle.findMany({
        where: { cycleId: cycleId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Buscar status das avaliações
      const evaluations = await this.prisma.evaluation.findMany({
        where: { cycleId: cycleId },
        select: {
          evaluatedId: true,
          completed: true,
          type: true,
        },
      });

      // Mapear dados para o dashboard
      return resumos.map((resumo) => {
        const userScores = scoresPerCycle.find(
          (s) => s.userId === resumo.evaluatedId,
        );
        const userEvaluations = evaluations.filter(
          (e) => e.evaluatedId === resumo.evaluatedId,
        );
        const completedEvaluations = userEvaluations.filter((e) => e.completed);

        // Determinar status baseado nas avaliações
        let status = 'pendente';
        if (completedEvaluations.length > 0) {
          status =
            completedEvaluations.length === userEvaluations.length
              ? 'completo'
              : 'parcial';
        }

        return {
          id: resumo.id,
          evaluatedId: resumo.evaluatedId,
          evaluatedName: resumo.evaluated.name,
          position: resumo.evaluated.position.name,
          summary: resumo.summary,
          finalScore: userScores?.finalScore || null,
          status: status,
        };
      });
    } catch (error) {
      throw new BadRequestException('Erro ao buscar insights do dashboard');
    }
  }

  async buscarBrutalFacts(userId: string, cycleId: string) {
    try {
      // Buscar scorePerCycle atual para verificar mudanças
      const scoreAtual = await this.prisma.scorePerCycle.findUnique({
        where: {
          userId_cycleId: {
            userId: userId,
            cycleId: cycleId,
          },
        },
      });

      // Primeiro, tentar buscar um resumo já existente
      let resumo = await this.prisma.genaiInsight.findFirst({
        where: {
          evaluatedId: userId,
          cycleId: cycleId,
        },
        include: {
          evaluated: {
            select: {
              name: true,
              email: true,
              role: true,
              position: {
                select: {
                  name: true,
                  track: true,
                },
              },
            },
          },
          cycle: {
            select: {
              name: true,
            },
          },
        },
      });

      // Verificar se precisa regenerar devido a mudança no score
      let precisaRegenerar = false;
      if (resumo && scoreAtual) {
        // Comparar baseado na data de criação (simplificado)
        const scoreCreateDate = new Date(scoreAtual.createdAt);
        
        // Por segurança, vamos forçar regeneração periodicamente
        console.log(`🔄 Forçando regeneração de brutal facts para garantir dados atualizados...`);
        precisaRegenerar = true; // Temporariamente sempre regenerar para garantir dados atuais
      }

      // Se não encontrou ou precisa regenerar, gerar automaticamente
      if (!resumo || precisaRegenerar) {
        if (precisaRegenerar) {
          console.log(`🔄 Regenerando brutal facts para userId:${userId}, cycleId:${cycleId} devido a mudança no score...`);
          // Deletar o insight antigo
          await this.prisma.genaiInsight.deleteMany({
            where: {
              evaluatedId: userId,
              cycleId: cycleId,
            },
          });
        } else {
          console.log(`🔄 Brutal facts não encontrados para userId:${userId}, cycleId:${cycleId}. Gerando automaticamente...`);
        }

        // Gerar o resumo usando o método existente
        await this.gerarResumoColaborador(cycleId, userId);

        // Buscar novamente após a geração
        resumo = await this.prisma.genaiInsight.findFirst({
          where: {
            evaluatedId: userId,
            cycleId: cycleId,
          },
          include: {
            evaluated: {
              select: {
                name: true,
                email: true,
                role: true,
                position: {
                  select: {
                    name: true,
                    track: true,
                  },
                },
              },
            },
            cycle: {
              select: {
                name: true,
              },
            },
          },
        });

        if (!resumo) {
          throw new NotFoundException(
            'Não foi possível gerar insights para este colaborador e ciclo - dados insuficientes',
          );
        }
      }

      // Retornar apenas os brutal facts com contexto
      return {
        id: resumo.id,
        evaluatedId: resumo.evaluatedId,
        evaluatedName: resumo.evaluated.name,
        evaluatedPosition: resumo.evaluated.position.name,
        cycleId: resumo.cycleId,
        cycleName: resumo.cycle.name,
        brutalFacts: resumo.brutalFacts,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        'Erro ao buscar brutal facts do colaborador',
      );
    }
  }

  async buscarEvolucaoColaborador(userId: string) {
    try {
      const insights = await this.prisma.genaiInsight.findMany({
        where: {
          evaluatedId: userId,
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
          evaluated: {
            select: {
              name: true,
              email: true,
              role: true,
              position: {
                select: {
                  name: true,
                  track: true,
                },
              },
            },
          },
        },
        orderBy: {
          cycle: {
            startDate: 'asc',
          },
        },
      });

      if (insights.length === 0) {
        throw new NotFoundException(
          'Nenhum insight encontrado para este colaborador',
        );
      }

      // Descriptografar campos dos insights e do usuário
      for (const insight of insights) {
        if (insight.evaluated?.name) {
          insight.evaluated.name = await this.crypto.decrypt(
            insight.evaluated.name,
          );
        }
        if (insight.evaluated?.email) {
          insight.evaluated.email = await this.crypto.decrypt(
            insight.evaluated.email,
          );
        }
      }

      // Buscar scores históricos
      const scoresHistoricos = await this.prisma.scorePerCycle.findMany({
        where: {
          userId: userId,
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
        },
        orderBy: {
          cycle: {
            startDate: 'asc',
          },
        },
      });

      // Preparar dados de evolução
      const evolucaoScores = scoresHistoricos.map((score, index) => {
        const scoreAnterior = index > 0 ? scoresHistoricos[index - 1] : null;
        const crescimento = scoreAnterior
          ? (score.finalScore || 0) - (scoreAnterior.finalScore || 0)
          : 0;
        const crescimentoPercentual =
          scoreAnterior && scoreAnterior.finalScore
            ? ((crescimento / scoreAnterior.finalScore) * 100).toFixed(1)
            : '0.0';

        return {
          cycleId: score.cycleId,
          cycleName: score.cycle.name,
          startDate: score.cycle.startDate,
          endDate: score.cycle.endDate,
          finalScore: score.finalScore || 0,
          selfScore: score.selfScore || 0,
          leaderScore: score.leaderScore || 0,
          crescimento,
          crescimentoPercentual,
        };
      });

      // Preparar insights de evolução
      const evolucaoInsights = insights.map((insight) => ({
        cycleId: insight.cycleId,
        cycleName: insight.cycle.name,
        startDate: insight.cycle.startDate,
        endDate: insight.cycle.endDate,
        summary: insight.summary,
        brutalFacts: insight.brutalFacts,
      }));

      // Calcular resumo de evolução
      const scoreAtual =
        scoresHistoricos.length > 0
          ? scoresHistoricos[scoresHistoricos.length - 1].finalScore || 0
          : 0;
      const scoreInicial =
        scoresHistoricos.length > 0 ? scoresHistoricos[0].finalScore || 0 : 0;
      const crescimentoTotal = scoreAtual - scoreInicial;

      const colaborador = insights[0].evaluated;

      return {
        colaborador: {
          id: userId,
          name: colaborador.name,
          email: colaborador.email,
          role: colaborador.role,
          position: colaborador.position.name,
          track: colaborador.position.track,
        },
        totalCiclos: insights.length,
        evolucaoScores,
        evolucaoInsights,
        resumoEvolucao: {
          scoreAtual,
          scoreInicial,
          crescimentoTotal,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Erro ao buscar evolução do colaborador');
    }
  }

  async gerarResumoSurvey(surveyId: string) {
    const survey = await this.prisma.survey.findUnique({
      where: { id: surveyId },
      include: {
        questions: true,
        responses: {
          include: {
            answers: true,
          },
        },
      },
    });

    if (!survey) {
      throw new NotFoundException('Survey não encontrada.');
    }

    // 🔓 Descriptografar apenas SurveyQuestion e SurveyAnswer
    const decryptedQuestions = survey.questions.map((q) =>
      this.crypto.deepDecrypt(q, 'SurveyQuestion'),
    );

    const decryptedResponses = survey.responses.map((response) => ({
      ...response,
      answers: response.answers.map((a) =>
        this.crypto.deepDecrypt(a, 'SurveyAnswer'),
      ),
    }));

    // 🔧 Construção do prompt com dados descriptografados
    const prompt = `
  Você é um analista de dados. Gere um resumo claro e direto com insights da seguinte pesquisa:

  Título: ${survey.title}
  Descrição: ${survey.description || 'Sem descrição'}
  Número de respostas: ${decryptedResponses.length}

  Perguntas e Respostas:
  ${decryptedQuestions
    .map((q, i) => {
      const respostas = decryptedResponses
        .flatMap((r) => r.answers)
        .filter((a) => a.questionId === q.id);

      const respostasFormatadas = respostas
        .map((a, idx) => {
          if (q.type === 'NUMBER')
            return `  - Resposta ${idx + 1}: ${a.answerScore}`;
          return `  - Resposta ${idx + 1}: ${a.answerText}`;
        })
        .join('\n');

      return `Pergunta ${i + 1}: ${q.text}\n${respostasFormatadas}\n`;
    })
    .join('\n')}
  `;

    console.log('Prompt gerado para o Gemini:', prompt);

    const result = await this.model.generateContent([prompt]);
    const response = await result.response;
    const resumo = await response.text();

    return {
      surveyTitle: survey.title,
      resumo,
    };
  }

  async analisarEvolucaoMediaEquipe(cycleId: string, managerId: string) {
    try {
      console.log(`🔍 Analisando evolução da média da equipe para gestor ${managerId} até o ciclo: ${cycleId}`);

      // Buscar informações do ciclo atual
      const cicloAtual = await this.prisma.evaluationCycle.findUnique({
        where: { id: cycleId },
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
        },
      });

      if (!cicloAtual) {
        throw new NotFoundException(`Ciclo ${cycleId} não encontrado`);
      }

      // Buscar todos os ciclos até o atual (ordenados por data)
      const todosCiclos = await this.prisma.evaluationCycle.findMany({
        where: {
          endDate: {
            lte: cicloAtual.endDate,
          },
        },
        orderBy: {
          startDate: 'asc',
        },
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
        },
      });

      console.log(`📊 Encontrados ${todosCiclos.length} ciclos para análise`);

      // Calcular média da equipe para cada ciclo
      const evolucaoMedias = [];

      for (const ciclo of todosCiclos) {
        // Buscar scores da equipe do gestor neste ciclo
        const scoresEquipe = await this.prisma.scorePerCycle.findMany({
          where: {
            cycleId: ciclo.id,
            user: {
              managerId: managerId,
            },
          },
          select: {
            finalScore: true,
            userId: true,
          },
        });

        // Calcular média apenas com scores válidos
        const scoresValidos = scoresEquipe.filter(s => s.finalScore && s.finalScore > 0);
        const mediaEquipe = scoresValidos.length > 0 
          ? scoresValidos.reduce((sum, s) => sum + (s.finalScore || 0), 0) / scoresValidos.length
          : null;

        evolucaoMedias.push({
          cycleId: ciclo.id,
          cycleName: ciclo.name,
          startDate: ciclo.startDate,
          endDate: ciclo.endDate,
          totalColaboradores: scoresEquipe.length,
          colaboradoresAvaliados: scoresValidos.length,
          mediaEquipe: mediaEquipe ? Math.round(mediaEquipe * 100) / 100 : null,
        });
      }

      // Filtrar apenas ciclos com dados válidos
      const ciclosComDados = evolucaoMedias.filter(c => c.mediaEquipe !== null);
      
      console.log(`📈 ${ciclosComDados.length} ciclos com dados válidos encontrados`);

      // Gerar análise da evolução
      const analiseEvolucao = this.gerarAnaliseEvolucaoEquipe(ciclosComDados, cicloAtual.name);

      return {
        gestorId: managerId,
        cicloAtualId: cycleId,
        cicloAtualName: cicloAtual.name,
        totalCiclosAnalisados: ciclosComDados.length,
        evolucaoMedias: ciclosComDados,
        analiseEvolucao,
      };

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('❌ Erro ao analisar evolução da média da equipe:', error);
      throw new BadRequestException('Erro ao analisar evolução da média da equipe');
    }
  }

  private gerarAnaliseEvolucaoEquipe(ciclosComDados: any[], cicloAtualName: string): string {
    if (ciclosComDados.length === 0) {
      return `Não foram encontrados dados suficientes para analisar a evolução da média da sua equipe até o ciclo ${cicloAtualName}. Isso pode indicar que este é o primeiro ciclo com avaliações da equipe ou que ainda não há dados consolidados.`;
    }

    if (ciclosComDados.length === 1) {
      const cicloUnico = ciclosComDados[0];
      return `Este é o primeiro ciclo com dados consolidados da sua equipe (${cicloUnico.cycleName}). A média atual da equipe é ${cicloUnico.mediaEquipe}/5.0 com ${cicloUnico.colaboradoresAvaliados} colaboradores avaliados de ${cicloUnico.totalColaboradores} totais. Este será o baseline para acompanhar a evolução nos próximos ciclos.`;
    }

    // Análise de múltiplos ciclos
    const primeirosCiclo = ciclosComDados[0];
    const ultimoCiclo = ciclosComDados[ciclosComDados.length - 1];
    const mediaInicial = primeirosCiclo.mediaEquipe;
    const mediaAtual = ultimoCiclo.mediaEquipe;
    const crescimentoTotal = mediaAtual - mediaInicial;
    const crescimentoPercentual = Math.round((crescimentoTotal / mediaInicial) * 100 * 100) / 100;

    // Analisar tendência
    let tendencia = '';
    let analiseDetalhada = '';

    if (Math.abs(crescimentoTotal) < 0.1) {
      tendencia = 'estável';
      analiseDetalhada = `A média da equipe manteve-se estável ao longo dos ${ciclosComDados.length} ciclos analisados, variando apenas ${Math.abs(crescimentoTotal).toFixed(2)} pontos.`;
    } else if (crescimentoTotal > 0) {
      tendencia = 'crescente';
      analiseDetalhada = `A média da equipe apresentou uma evolução positiva de ${crescimentoTotal.toFixed(2)} pontos (${crescimentoPercentual}%) ao longo dos ${ciclosComDados.length} ciclos.`;
    } else {
      tendencia = 'decrescente';
      analiseDetalhada = `A média da equipe apresentou uma redução de ${Math.abs(crescimentoTotal).toFixed(2)} pontos (${Math.abs(crescimentoPercentual)}%) ao longo dos ${ciclosComDados.length} ciclos.`;
    }

    // Analisar padrão de evolução ciclo a ciclo
    const variacoesCiclos = [];
    for (let i = 1; i < ciclosComDados.length; i++) {
      const anterior = ciclosComDados[i - 1];
      const atual = ciclosComDados[i];
      const variacao = atual.mediaEquipe - anterior.mediaEquipe;
      variacoesCiclos.push({
        deCiclo: anterior.cycleName,
        paraCiclo: atual.cycleName,
        variacao: Math.round(variacao * 100) / 100,
      });
    }

    // Identificar maior crescimento e maior queda
    const maiorCrescimento = variacoesCiclos.reduce((max, atual) => 
      atual.variacao > max.variacao ? atual : max, variacoesCiclos[0]);
    const maiorQueda = variacoesCiclos.reduce((min, atual) => 
      atual.variacao < min.variacao ? atual : min, variacoesCiclos[0]);

    let pontosMarcantes = '';
    if (maiorCrescimento.variacao > 0.2) {
      pontosMarcantes += ` O maior avanço ocorreu entre ${maiorCrescimento.deCiclo} e ${maiorCrescimento.paraCiclo} (+${maiorCrescimento.variacao} pontos).`;
    }
    if (maiorQueda.variacao < -0.2) {
      pontosMarcantes += ` A maior queda foi observada entre ${maiorQueda.deCiclo} e ${maiorQueda.paraCiclo} (${maiorQueda.variacao} pontos).`;
    }

    // Classificar performance atual
    let classificacaoAtual = '';
    if (mediaAtual >= 4.5) {
      classificacaoAtual = 'excelente (4.5+)';
    } else if (mediaAtual >= 4.0) {
      classificacaoAtual = 'muito boa (4.0-4.5)';
    } else if (mediaAtual >= 3.5) {
      classificacaoAtual = 'boa (3.5-4.0)';
    } else if (mediaAtual >= 3.0) {
      classificacaoAtual = 'satisfatória (3.0-3.5)';
    } else {
      classificacaoAtual = 'abaixo do esperado (<3.0)';
    }

    // Gerar recomendações baseadas na tendência
    let recomendacoes = '';
    if (tendencia === 'crescente') {
      recomendacoes = ' Continue investindo nas práticas que têm gerado essa evolução positiva e considere compartilhar as melhores práticas com outras equipes.';
    } else if (tendencia === 'decrescente') {
      recomendacoes = ' É importante investigar os fatores que contribuíram para essa queda e implementar ações corretivas focadas no desenvolvimento da equipe.';
    } else {
      recomendacoes = ' A estabilidade indica consistência, mas avalie se há potencial para novos avanços através de iniciativas de desenvolvimento mais direcionadas.';
    }

    return `Análise da evolução da média da sua equipe ao longo de ${ciclosComDados.length} ciclos (${primeirosCiclo.cycleName} até ${ultimoCiclo.cycleName}): ${analiseDetalhada} A performance atual é classificada como ${classificacaoAtual}, evoluindo de ${mediaInicial}/5.0 para ${mediaAtual}/5.0.${pontosMarcantes}${recomendacoes} No ciclo atual (${cicloAtualName}), ${ultimoCiclo.colaboradoresAvaliados} de ${ultimoCiclo.totalColaboradores} colaboradores foram avaliados.`;
  }

  private async gerarInsightsApenasPorScore(
    usuario: any,
    scorePerCycle: any,
    ciclo: any,
  ) {
    console.log('🔄 Gerando insights baseados apenas no scorePerCycle...');

    // Verificar se há peerScores para análise adicional
    const temPeerScores = scorePerCycle.peerScores && scorePerCycle.peerScores.length > 0;
    
    // Preparar dados básicos para análise
    const dadosScore = {
      finalScore: scorePerCycle.finalScore || 0,
      selfScore: scorePerCycle.selfScore || 0,
      leaderScore: scorePerCycle.leaderScore || 0,
      peerScores: temPeerScores ? scorePerCycle.peerScores : [],
      mediaPeers: temPeerScores 
        ? scorePerCycle.peerScores.reduce((sum: number, ps: any) => sum + (ps.score || 0), 0) / scorePerCycle.peerScores.length 
        : 0,
    };

    // Tentar gerar com IA primeiro, com fallback para local
    try {
      return await this.gerarInsightsComIAApenasPorScore(usuario, dadosScore, ciclo);
    } catch (error) {
      console.log('❌ Erro na IA, usando geração local de insights por score:', error);
      return this.gerarInsightsLocalApenasPorScore(usuario, dadosScore, ciclo);
    }
  }

  private async gerarInsightsComIAApenasPorScore(
    usuario: any,
    dadosScore: any,
    ciclo: any,
  ) {
    const posicao = usuario.position?.name || 'Não informado';
    const equipe = usuario.teamMemberships?.[0]?.team?.name || 'Não informado';

    const prompt = `
IMPORTANTE: Responda SEMPRE e EXCLUSIVAMENTE em português brasileiro. Nunca use inglês.

Você é um especialista em análise de performance corporativa. Analise os dados de score do colaborador ${usuario.name} do ciclo ${ciclo.name} e gere insights baseados APENAS nos scores disponíveis (sem avaliações detalhadas).

DADOS DO COLABORADOR:
- Nome: ${usuario.name}
- Posição: ${posicao}
- Equipe: ${equipe}
- Ciclo: ${ciclo.name}

SCORES DISPONÍVEIS:
- Score Final: ${dadosScore.finalScore}/5.0
- Self Score: ${dadosScore.selfScore}/5.0
- Leader Score: ${dadosScore.leaderScore}/5.0
- Peer Scores: ${dadosScore.peerScores.length} avaliações (média: ${dadosScore.mediaPeers.toFixed(2)}/5.0)

INSTRUÇÕES:
1. Gere um RESUMO (summary) em português brasileiro focado na performance geral
2. Gere BRUTAL FACTS em português brasileiro com insights diretos sobre os scores
3. Base sua análise apenas nos scores numéricos disponíveis
4. Seja objetivo e construtivo
5. NUNCA use inglês, apenas português brasileiro

Formato de resposta JSON:
{
  "summary": "Resumo em português sobre a performance do colaborador baseado nos scores",
  "brutalFacts": "Análise direta em português dos pontos críticos baseados nos scores"
}`;

    const result = await this.model.generateContent([prompt]);
    const response = await result.response;
    let texto = await response.text();

    // Limpar e extrair JSON
    texto = texto.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    try {
      const insights = JSON.parse(texto);
      
      // Validar se tem as chaves necessárias
      if (!insights.summary || !insights.brutalFacts) {
        throw new Error('Resposta da IA incompleta');
      }

      // Criptografar antes de retornar
      const summaryCriptografado = await this.crypto.encrypt(insights.summary);
      const brutalFactsCriptografado = await this.crypto.encrypt(insights.brutalFacts);

      return {
        summary: summaryCriptografado,
        brutalFacts: brutalFactsCriptografado,
      };
    } catch (parseError) {
      console.log('❌ Erro no parsing da resposta da IA:', parseError);
      throw new Error('Erro no formato da resposta da IA');
    }
  }

  private gerarInsightsLocalApenasPorScore(
    usuario: any,
    dadosScore: any,
    ciclo: any,
  ) {
    console.log('=== FALLBACK: Usando geração local apenas por score ===');
    
    const posicao = usuario.position?.name || 'Não informado';
    const finalScore = dadosScore.finalScore;
    
    // Classificar performance baseada no score final
    let classificacao = '';
    let recomendacao = '';
    
    if (finalScore >= 4.5) {
      classificacao = 'excepcional';
      recomendacao = 'Continue mantendo este nível de excelência e considere compartilhar suas práticas com a equipe.';
    } else if (finalScore >= 4.0) {
      classificacao = 'muito boa';
      recomendacao = 'Performance sólida com potencial para alcançar excelência. Identifique áreas específicas para refinamento.';
    } else if (finalScore >= 3.5) {
      classificacao = 'boa';
      recomendacao = 'Performance adequada com oportunidades claras de crescimento. Foque em desenvolver competências específicas.';
    } else if (finalScore >= 3.0) {
      classificacao = 'satisfatória';
      recomendacao = 'Performance atende aos requisitos básicos, mas requer plano de desenvolvimento estruturado.';
    } else {
      classificacao = 'abaixo do esperado';
      recomendacao = 'Performance requer atenção imediata e plano de ação detalhado para melhoria.';
    }

    // Análise de alinhamento entre diferentes scores
    let analiseAlinhamento = '';
    if (dadosScore.selfScore && dadosScore.leaderScore) {
      const diferenca = Math.abs(dadosScore.selfScore - dadosScore.leaderScore);
      if (diferenca > 1.0) {
        analiseAlinhamento = ' Há uma diferença significativa entre a autoavaliação e a avaliação da liderança, indicando necessidade de alinhamento de expectativas.';
      } else if (diferenca > 0.5) {
        analiseAlinhamento = ' Existe uma pequena diferença entre a autoavaliação e a avaliação da liderança, que pode ser explorada em conversas de feedback.';
      } else {
        analiseAlinhamento = ' Há um bom alinhamento entre a autoavaliação e a avaliação da liderança.';
      }
    }

    const summary = `${usuario.name}, na posição de ${posicao}, apresentou performance ${classificacao} no ciclo ${ciclo.name} com score final de ${finalScore}/5.0. ${recomendacao}${analiseAlinhamento}`;
    
    const brutalFacts = this.gerarBrutalFactsPorScore(dadosScore, classificacao);

    return {
      summary: this.crypto.encrypt(summary),
      brutalFacts: this.crypto.encrypt(brutalFacts),
    };
  }

  private gerarBrutalFactsPorScore(dadosScore: any, classificacao: string): string {
    const facts = [];
    const finalScore = dadosScore.finalScore;

    // Análise do score final
    if (finalScore < 2.5) {
      facts.push(`🚨 CRÍTICO: Score ${finalScore}/5.0 indica performance substancialmente abaixo das expectativas - intervenção imediata necessária.`);
    } else if (finalScore < 3.0) {
      facts.push(`⚠️ ALERTA: Score ${finalScore}/5.0 está abaixo do padrão organizacional - plano de desenvolvimento urgente.`);
    } else if (finalScore < 3.5) {
      facts.push(`📊 DESENVOLVIMENTO: Score ${finalScore}/5.0 atende ao básico mas há gap significativo para performance esperada.`);
    } else if (finalScore >= 4.5) {
      facts.push(`⭐ DESTAQUE: Score ${finalScore}/5.0 representa performance de alto nível - potencial para liderança e mentoria.`);
    }

    // Análise de consistência entre avaliadores
    if (dadosScore.selfScore && dadosScore.leaderScore) {
      const gapSelfLeader = dadosScore.selfScore - dadosScore.leaderScore;
      if (Math.abs(gapSelfLeader) > 1.0) {
        if (gapSelfLeader > 0) {
          facts.push(`🔍 GAP DE PERCEPÇÃO: Autoavaliação ${dadosScore.selfScore}/5.0 vs Liderança ${dadosScore.leaderScore}/5.0 - possível superestimação das próprias competências.`);
        } else {
          facts.push(`💡 AUTOCONFIANÇA: Liderança avalia ${dadosScore.leaderScore}/5.0 vs Autoavaliação ${dadosScore.selfScore}/5.0 - oportunidade para reconhecer próprias competências.`);
        }
      }
    }

    // Análise de peer scores se disponíveis
    if (dadosScore.peerScores.length > 0) {
      const mediaPeers = dadosScore.mediaPeers;
      const gapFinalPeers = Math.abs(finalScore - mediaPeers);
      
      if (gapFinalPeers > 0.5) {
        facts.push(`👥 PEERS: Diferença de ${gapFinalPeers.toFixed(1)} pontos entre score final e avaliação dos pares indica necessidade de calibração.`);
      } else {
        facts.push(`✅ CONSISTÊNCIA: Boa consistência entre score final (${finalScore}) e avaliação dos pares (${mediaPeers.toFixed(1)}).`);
      }
    }

    // Fallback se nenhum insight específico foi gerado
    if (facts.length === 0) {
      facts.push(`📋 BASELINE: Score atual de ${finalScore}/5.0 estabelece ponto de partida para acompanhamento de evolução nos próximos ciclos.`);
    }

    return facts.join(' ');
  }
}
