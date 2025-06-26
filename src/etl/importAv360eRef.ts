import * as xlsx from 'xlsx';
import { PrismaClient, EvaluationType } from '@prisma/client';

const prisma = new PrismaClient();

function parseNota(notaTexto: string): number | null {
  if (!notaTexto) return null;
  const match = notaTexto.match(/[\d,\.]+/);
  if (!match) return null;
  return parseFloat(match[0].replace(',', '.'));
}

async function main() {
  const workbook = xlsx.readFile('./src/etl/data/ANA_DA_2024_2.xlsx');

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
      linha['ATUARAM JUNTOS - OBRIGATÓRIO TEREM ATUADO JUNTOS']?.trim();
    const notaTexto = linha['OLHAR NOTA'];
    const justificativa = linha['AJUDE DEVE FAZER BEM E DEVE EXPLORAR'];

    if (!emailAvaliado || !nomeProjeto) {
      console.warn('⚠️ Linha ignorada por falta de dados:', linha);
      continue;
    }

    const avaliado = await prisma.user.findUnique({
      where: { email: emailAvaliado },
    });
    if (!avaliado) {
      console.warn(`⚠️ Avaliado não encontrado: ${emailAvaliado}`);
      continue;
    }

    const team = await prisma.team.findFirst({ where: { name: nomeProjeto } });
    if (!team) {
      console.warn(`⚠️ Time não encontrado: ${nomeProjeto}`);
      continue;
    }

    const nota = parseNota(notaTexto);
    if (nota === null) {
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

    console.log(
      `✅ Avaliação 360 registrada: ${avaliador.email} → ${avaliado.email}`,
    );
  }

  console.log('🏁 ETL da Avaliação 360 finalizado.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
