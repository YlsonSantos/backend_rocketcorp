import * as xlsx from 'xlsx';
import { PrismaClient, EvaluationType } from '@prisma/client';
import { parseNota } from './importAutoAvaliation';

const prisma = new PrismaClient();

export async function runAv360eRef(filePath: string) {
  const workbook = xlsx.readFile(filePath);

  // === 1. Pegando o avaliador da aba Perfil ===
  const perfilSheet = workbook.Sheets['Perfil'];
  const perfil = xlsx.utils.sheet_to_json<string[][]>(perfilSheet, {
    header: 1,
  });

  const emailAvaliador = perfil?.[1]?.[1];
  const cicloNome = perfil?.[1]?.[2];

  const avaliador = await prisma.user.findUnique({
    where: { email: String(emailAvaliador) },
  });
  if (!avaliador)
    throw new Error(`❌ Avaliador com email ${emailAvaliador} não encontrado.`);

  const ciclo = await prisma.evaluationCycle.findFirst({
    where: { name: String(cicloNome) },
  });
  if (!ciclo) throw new Error(`❌ Ciclo "${cicloNome}" não encontrado.`);

  // === 2. Pegando ou criando o critério padrão ===
  let criterio = await prisma.evaluationCriterion.findFirst({
    where: { title: { contains: 'Feedback 360' } },
  });

  if (!criterio) {
    criterio = await prisma.evaluationCriterion.create({
      data: {
        title: 'Feedback 360',
        description: 'Critério padrão de avaliação 360',
        type: 'HABILIDADES',
      },
    });
    console.log('✅ Critério "Feedback 360" criado.');
  }

  // === 3. Lendo a aba "Avaliação 360" ===
  const sheet = workbook.Sheets['Avaliação 360'];
  const linhas = xlsx.utils.sheet_to_json<any>(sheet);

  for (const linha of linhas) {
    const emailAvaliado = linha['EMAIL DO AVALIADO ( nome.sobrenome )']?.trim();
    const nomeProjeto =
      linha[
        'PROJETO EM QUE ATUARAM JUNTOS - OBRIGATÓRIO TEREM ATUADOS JUNTOS'
      ]?.trim();
    const notaTexto = linha['DÊ UMA NOTA GERAL PARA O COLABORADOR'];
    const pontosRuins = linha['PONTOS QUE DEVE MELHORAR'];
    const pontosFortes = linha['PONTOS QUE FAZ BEM E DEVE EXPLORAR'];
    const justificativa = `Pontos fortes: ${pontosFortes || ''}\nPontos a melhorar: ${pontosRuins || ''}`;

    if (!emailAvaliado || !nomeProjeto) {
      console.warn('⚠️ Linha ignorada por falta de dados:', linha);
      continue;
    }

    let position = await prisma.position.findFirst({
      where: {
        name: 'Padrão',
        track: 'DESENVOLVIMENTO',
      },
    });

    if (!position) {
      position = await prisma.position.create({
        data: {
          name: 'Padrão',
          track: 'DESENVOLVIMENTO',
        },
      });
    }

    let avaliado = await prisma.user.findUnique({
      where: { email: emailAvaliado },
    });
    if (!avaliado) {
      // Nome genérico baseado no e-mail
      const [primeiroNome, sobrenome] = emailAvaliado.split('@')[0].split('.');
      const nome = `${primeiroNome ?? 'Usuário'} ${sobrenome ?? ''}`.trim();

      avaliado = await prisma.user.create({
        data: {
          name: nome.charAt(0).toUpperCase() + nome.slice(1),
          email: emailAvaliado,
          password: '123',
          role: 'COLABORADOR',
          positionId: position.id,
        },
      });
      console.log(`👤 Usuário criado para o avaliado: ${avaliado.email}`);
    }

    const team = await prisma.team.findFirst({ where: { name: nomeProjeto } });
    if (!team) {
      console.warn(`⚠️ Time não encontrado: ${nomeProjeto}`);
      continue;
    }

    let score = await prisma.scorePerCycle.findUnique({
      where: {
        userId_cycleId: {
          userId: avaliado.id,
          cycleId: ciclo.id,
        },
      },
    });

    if (!score) {
      score = await prisma.scorePerCycle.create({
        data: {
          userId: avaliado.id,
          cycleId: ciclo.id,
          selfScore: 0,
          leaderScore: null,
          finalScore: null,
          feedback: null,
        },
      });

      console.log(
        `🆕 ScorePerCycle criado para ${avaliado.email} no ciclo ${ciclo.name}`,
      );
    } else {
      console.log(
        `ℹ️ ScorePerCycle já existente para ${avaliado.email} no ciclo ${ciclo.name}`,
      );
    }

    const nota = parseNota(notaTexto.toString());
    if (nota === null || notaTexto.toString().toUpperCase().includes('NA')) {
      console.warn(`⚠️ Nota inválida para ${emailAvaliado}: ${notaTexto}`);
      continue;
    }

    const evaluation = await prisma.evaluation.create({
      data: {
        type: EvaluationType.PAR,
        cycleId: ciclo.id,
        evaluatorId: avaliador.id,
        evaluatedId: avaliado.id,
        teamId: team.id,
        completed: true,
      },
    });

    await prisma.evaluationAnswer.create({
      data: {
        evaluationId: evaluation.id,
        criterionId: criterio.id,
        score: nota,
        justification: justificativa || '',
      },
    });

    if (nota !== null) {
      await prisma.peerScore.create({
        data: {
          scorePerCycleId: score.id,
          value: nota,
        },
      });

      console.log(`➕ PeerScore criado para ${avaliado.email}: ${nota}`);
    } else {
      console.log(`ℹ️ PeerScore já existente para ${avaliado.email}: ${nota}`);
    }

    console.log(
      `✅ Avaliação 360 registrada: ${avaliador.email} → ${avaliado.email}`,
    );
  }

  console.log('🏁 ETL da Avaliação 360 finalizado.');

  // === 9. Lê e insere as referências da aba "Pesquisa de Referências" ===
  const referenciasSheet = workbook.Sheets['Pesquisa de Referências'];

  if (referenciasSheet) {
    const referencias = xlsx.utils.sheet_to_json<any>(referenciasSheet);

    for (const linha of referencias) {
      const emailReferencia = linha['EMAIL DA REFERÊNCIA\n( nome.sobrenome )']
        ?.toString()
        .trim();
      const justificativa = linha['JUSTIFICATIVA']?.toString().trim();

      if (!emailReferencia || !justificativa) {
        console.warn(
          '⚠️ Linha de referência ignorada (faltando dados):',
          linha,
        );
        continue;
      }

      // Busca o usuário referenciado (precisa já existir)
      let referenciado = await prisma.user.findUnique({
        where: { email: emailReferencia },
      });

      let position = await prisma.position.findFirst({
        where: {
          name: 'Padrão',
          track: 'DESENVOLVIMENTO',
        },
      });

      if (!position) {
        position = await prisma.position.create({
          data: {
            name: 'Padrão',
            track: 'DESENVOLVIMENTO',
          },
        });
      }

      if (!referenciado) {
        const [primeiroNome, sobrenome] = emailReferencia
          .split('@')[0]
          .split('.');
        const nome = `${primeiroNome ?? 'Usuário'} ${sobrenome ?? ''}`.trim();

        referenciado = await prisma.user.create({
          data: {
            name: nome.charAt(0).toUpperCase() + nome.slice(1),
            email: emailReferencia,
            password: '123',
            role: 'COLABORADOR',
            positionId: position.id,
          },
        });
        console.log(`👤 Usuário criado para o avaliado: ${referenciado.email}`);
      }

      // Cria referência
      await prisma.reference.create({
        data: {
          evaluatorId: avaliador.id,
          referencedId: referenciado.id,
          theme: 'Referência técnica/comportamental',
          justification: justificativa,
        },
      });

      console.log(
        `📎 Referência registrada de ${avaliador.email} para ${emailReferencia}`,
      );
    }
  } else {
    console.warn('⚠️ Aba "Pesquisa de Referências" não encontrada no arquivo.');
  }
}
