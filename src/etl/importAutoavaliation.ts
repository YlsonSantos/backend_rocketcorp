import * as xlsx from 'xlsx';
import { PrismaClient, EvaluationType, CriterionType } from '@prisma/client';

const prisma = new PrismaClient();

// Função auxiliar para transformar o texto da nota em número
function parseNota(notaTexto: string): number | null {
  if (!notaTexto) return null;

  const notaLimpa = notaTexto.match(/[\d,\.]+/);
  if (!notaLimpa) return null;

  return parseFloat(notaLimpa[0].replace(',', '.'));
}

async function main() {
  // Carrega o arquivo Excel
  const workbook = xlsx.readFile('./src/etl/data/ANA_DA_2024_2.xlsx');
  console.log(workbook.SheetNames);

  // === 1. Lê a aba "Perfil" para pegar nome, email e ciclo ===
  const perfilSheet = workbook.Sheets['Perfil'];
  const perfil = xlsx.utils.sheet_to_json<string[][]>(perfilSheet, {
    header: 1,
  });
  console.log(perfil[1][0], perfil[1][1], perfil[1][2]);
  console.log(typeof perfil[1][0], typeof perfil[1][1], typeof perfil[1][2]);

  const nome = perfil[1][0];
  const email = perfil[1][1] as unknown as string;
  const cicloNome = perfil[1][2];
  console.log('Nome:', nome, typeof nome);
  console.log('Email:', email, typeof email);
  console.log('Ciclo:', cicloNome, typeof cicloNome);

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
        endDate: new Date(),
      },
    });
  }

  // === 4. Cria ou encontra o usuário ===
  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: String(nome),
        email: String(email),
        password: '123',
        role: 'COLABORADOR',
        position: {
          create: {
            name: 'Padrão',
            track: 'DESENVOLVIMENTO',
          },
        },
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
  const evaluation = await prisma.evaluation.create({
    data: {
      type: EvaluationType.AUTO,
      cycleId: ciclo.id,
      evaluatorId: user.id,
      evaluatedId: user.id,
      teamId: team.id,
      completed: true,
    },
  });

  // === 8. Lê a aba "Autoavaliação" para processar os critérios ===
  interface LinhaAuto {
    'CRITÉRIO': string;
    'AUTO-AVALIAÇÃO': string;
    'DADOS E FATOS DA AUTO-AVALIAÇÃO': string;
  }

  const autoSheet = workbook.Sheets['Autoavaliação'];
  const respostas = xlsx.utils.sheet_to_json<LinhaAuto>(autoSheet);

  for (const linha of respostas) {
    const criterio = linha['CRITÉRIO'];
    const notaTexto = linha['AUTO-AVALIAÇÃO'];
    const justificativa = linha['DADOS E FATOS DA AUTO-AVALIAÇÃO'];

    if (typeof notaTexto !== 'string' || notaTexto.toUpperCase().includes('NA')) continue;

    const nota = parseNota(notaTexto);
    if (nota === null) continue;

    let criterioDb = await prisma.evaluationCriterion.findFirst({
      where: { title: criterio },
    });

    if (!criterioDb) {
      // Cria o critério
      criterioDb = await prisma.evaluationCriterion.create({
        data: {
          title: criterio,
          description: 'Critério importado automaticamente do Excel',
          type: CriterionType.HABILIDADES,
        },
      });

      console.log(`⚠️ Critério "${criterio}" criado automaticamente.`);

      // Verifica se já há atribuição para evitar duplicações
      const existingAssignment = await prisma.criteriaAssignment.findFirst({
        where: {
          criterionId: criterioDb.id,
          teamId: team.id,
          positionId: user.positionId,
        },
      });

      if (!existingAssignment) {
        await prisma.criteriaAssignment.create({
          data: {
            criterionId: criterioDb.id,
            teamId: team.id,
            positionId: user.positionId,
            isRequired: false,
          },
        });

        console.log(
          `🔗 Critério "${criterio}" atribuído ao time "${team.name}" e posição do usuário.`,
        );
      } else {
        console.log(`ℹ️ Atribuição já existia para o critério "${criterio}".`);
      }
    }

    await prisma.evaluationAnswer.create({
      data: {
        evaluationId: evaluation.id,
        criterionId: criterioDb.id,
        score: nota,
        justification: justificativa || '',
      },
    });
  }

  console.log('✅ ETL de autoavaliação finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar ETL:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
