import * as xlsx from 'xlsx';
import { PrismaClient, EvaluationType, CriterionType } from '@prisma/client';
import { EncryptedPrismaService } from '../encryption/encrypted-prisma.service';
import { CryptoService } from '../crypto/crypto.service';
import { PrismaService } from '../../prisma/prisma.service';

const prismaService = new PrismaService();
const prisma = new PrismaClient();
const crypto = new CryptoService();
const encryptedPrisma = new EncryptedPrismaService(prismaService, crypto);

// Função auxiliar para transformar o texto da nota em número
export function parseNota(notaTexto: string): number | null {
  if (!notaTexto) return null;

  const notaLimpa = notaTexto.match(/[\d,\.]+/);
  if (!notaLimpa) return null;

  return parseFloat(notaLimpa[0].replace(',', '.'));
}

interface LinhaAuto {
  CRITÉRIO: string;
  'AUTO-AVALIAÇÃO': string;
  'DADOS E FATOS DA AUTO-AVALIAÇÃO': string;
  'DESCRIÇÃO GERAL': string;
  'DADOS E FATOS DA AUTO-AVALIAÇÃO\nCITE, DE FORMA OBJETIVA, CASOS E SITUAÇÕES REAIS': string;
}

export async function runAutoAvaliation(filePath: string) {
  // Carrega o arquivo Excel
  const workbook = xlsx.readFile(filePath);

  // === 1. Lê a aba "Perfil" para pegar nome, email e ciclo ===
  const perfilSheet = workbook.Sheets['Perfil'];
  const perfil = xlsx.utils.sheet_to_json<string[][]>(perfilSheet, {
    header: 1,
  });

  const nome = perfil[1][0];
  const email = perfil[1][1] as unknown as string;
  const cicloNome = perfil[1][2];

  // === 2. Lê a aba "Avaliação 360" para pegar o nome do projeto ===
  const avaliacao360Sheet = workbook.Sheets['Avaliação 360'];
  const avaliacao360 = xlsx.utils.sheet_to_json<any>(avaliacao360Sheet);

  const nomeProjeto =
    avaliacao360?.[0]?.[
      'PROJETO EM QUE ATUARAM JUNTOS - OBRIGATÓRIO TEREM ATUADOS JUNTOS'
    ];

  if (!nomeProjeto)
    throw new Error('Projeto não encontrado na aba Avaliação 360.');

  // === 3. Cria ou encontra o ciclo de avaliação ===
  let ciclo = await prisma.evaluationCycle.findFirst({
    where: { name: String(cicloNome) },
  });

  if (!ciclo) {
    ciclo = await prisma.evaluationCycle.create({
      data: {
        name: String(cicloNome),
        startDate: new Date(),
        reviewDate: new Date(),
        endDate: new Date(),
      },
    });
  }

  // === 4. Cria ou encontra o usuário ===
  let user = await prisma.user.findUnique({
    where: { email },
  });

  const autoSheet = workbook.Sheets['Autoavaliação'];
  const respostas = xlsx.utils.sheet_to_json<LinhaAuto>(autoSheet);

  const linhaGestao = respostas.find(
    (linha) => linha['CRITÉRIO'].trim().toUpperCase() === 'GESTÃO DE PESSOAS',
  );

  let role = 'COLABORADOR';
  if (
    linhaGestao &&
    typeof linhaGestao['AUTO-AVALIAÇÃO'] === 'string' &&
    !linhaGestao['AUTO-AVALIAÇÃO'].toUpperCase().includes('NA')
  ) {
    role = 'LIDER';
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

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: String(nome),
        email: String(email),
        password: '123',
        role: role as any as import('@prisma/client').Role,
        positionId: position.id,
      },
    });
  }

  // === 5. Cria ou encontra o time ===
  let team = await prisma.team.findFirst({
    where: { name: nomeProjeto },
  });

  if (!team) {
    team = await prisma.team.create({
      data: { name: nomeProjeto },
    });
  }

  // === 6. Adiciona o usuário ao time se ainda não for membro ===
  const teamMember = await prisma.teamMember.findFirst({
    where: {
      userId: user.id,
      teamId: team.id,
    },
  });

  if (!teamMember) {
    await prisma.teamMember.create({
      data: {
        userId: user.id,
        teamId: team.id,
      },
    });
  }

  // === 7. Cria a avaliação AUTO ===
  let evaluation = await prisma.evaluation.findFirst({
    where: {
      type: EvaluationType.AUTO,
      cycleId: ciclo.id,
      evaluatorId: user.id,
      evaluatedId: user.id,
    },
  });

  if (evaluation) {
    console.log(
      `⚠️ Autoavaliação já existente para do tipo ${evaluation.type} no ciclo ${ciclo.name} para ${evaluation.evaluatorId} e ${evaluation.evaluatedId}, ETL interrompido.`,
    );
    return;
  }

  evaluation = await prisma.evaluation.create({
    data: {
      type: EvaluationType.AUTO,
      cycleId: ciclo.id,
      evaluatorId: user.id,
      evaluatedId: user.id,
      teamId: team.id,
      completed: true,
    },
  });

  let score = await prisma.scorePerCycle.findUnique({
    where: {
      userId_cycleId: {
        userId: user.id,
        cycleId: ciclo.id,
      },
    },
  });

  if (!score) {
    score = await encryptedPrisma.create('scorePerCycle', {
      userId: user.id,
      cycleId: ciclo.id,
      selfScore: 0,
      leaderScore: null,
      finalScore: null,
      feedback: null,
    });

    console.log(
      `🆕 ScorePerCycle criado para ${user.email} no ciclo ${ciclo.name}`,
    );
  } else {
    console.log(
      `ℹ️ ScorePerCycle já existente para ${user.email} no ciclo ${ciclo.name}`,
    );
  }

  let totalNotas = 0;
  let countNotas = 0;

  // === 8. Lê a aba "Autoavaliação" para processar os critérios ===
  console.log(`Total de linhas da aba Autoavaliação: ${respostas.length}`);
  for (const linha of respostas) {
    const criterioOriginal = linha['CRITÉRIO']?.trim();
    if (!criterioOriginal) {
      console.log('❌ Linha ignorada: critério vazio ou inválido:', linha);
      continue;
    }

    const notaTexto = linha['AUTO-AVALIAÇÃO'];
    const justificativa =
      linha[
        'DADOS E FATOS DA AUTO-AVALIAÇÃO\nCITE, DE FORMA OBJETIVA, CASOS E SITUAÇÕES REAIS'
      ];
    const descricao = linha['DESCRIÇÃO GERAL'];

    if (typeof notaTexto !== 'string' && typeof notaTexto !== 'number') {
      console.warn(
        `⚠️ Nota inválida para critério "${criterioOriginal}":`,
        notaTexto,
      );
      continue;
    }

    const nota = parseNota(notaTexto.toString());
    if (nota === null || notaTexto.toString().toUpperCase().includes('NA')) {
      console.log(
        `⏭️ Ignorando critério "${criterioOriginal}" por nota "${notaTexto}"`,
      );
      continue;
    }

    totalNotas += nota;
    countNotas++;

    let criterioDb = await prisma.evaluationCriterion.findFirst({
      where: {
        title: {
          contains: criterioOriginal,
        },
      },
    });

    if (!criterioDb) {
      try {
        criterioDb = await prisma.evaluationCriterion.create({
          data: {
            title: criterioOriginal,
            description: descricao,
            type: CriterionType.FROMETL,
          },
        });
        console.log(`✅ Critério "${criterioOriginal}" criado.`);
      } catch (e) {
        console.error(`❌ Erro ao criar critério "${criterioOriginal}":`, e);
        continue;
      }
    }

    // Verifica e cria atribuição se necessário
    const existingAssignment = await prisma.criteriaAssignment.findFirst({
      where: {
        criterionId: criterioDb.id,
        positionId: user.positionId,
      },
    });

    if (!existingAssignment) {
      await prisma.criteriaAssignment.create({
        data: {
          criterionId: criterioDb.id,
          positionId: user.positionId,
          isRequired: false,
        },
      });
      console.log(`🔗 Atribuição criada para critério "${criterioOriginal}".`);
    }

    // Cria resposta
    try {
      await encryptedPrisma.create('evaluationAnswer', {
        evaluationId: evaluation.id,
        criterionId: criterioDb.id,
        score: nota,
        justification: justificativa || '',
      });
    } catch (e) {
      console.error(
        `❌ Erro ao criar resposta para critério "${criterioOriginal}":`,
        e,
      );
    }
  }

  if (countNotas > 0) {
    const media = totalNotas / countNotas;
    if (score) {
      await encryptedPrisma.update('scorePerCycle', {
        where: { id: score.id },
        data: { selfScore: media },
      });
      console.log(
        `📊 Média da autoavaliação calculada e salva: ${media.toFixed(2)}`,
      );
    } else {
      console.warn(
        '⚠️ Não foi possível atualizar ScorePerCycle: score é null.',
      );
    }
  } else {
    console.log(
      '⚠️ Nenhuma nota válida para calcular a média da autoavaliação.',
    );
  }

  console.log('✅ ETL de autoavaliação finalizado com sucesso!');
}
