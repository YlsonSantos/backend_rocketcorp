import * as XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function carregarMapaDePara(
  caminhoExcel: string,
): Promise<Record<string, string>> {
  const workbook = XLSX.readFile(caminhoExcel);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const linhas = XLSX.utils.sheet_to_json<any>(sheet);

  const mapa: Record<string, string> = {};

  for (const linha of linhas) {
    const antigo = linha['Critério Antigo']?.trim();
    const novo = linha['Critério Novo']?.trim();
    if (antigo && novo) {
      mapa[antigo] = novo;
    }
  }

  return mapa;
}

export async function runFromToCriteria(filePath: string) {
  const criterioDePara = await carregarMapaDePara(filePath);

  for (const [antigo, novo] of Object.entries(criterioDePara)) {
    const criterioAntigo = await prisma.evaluationCriterion.findFirst({
      where: { title: antigo.trim() },
    });

    if (!criterioAntigo) {
      console.warn(`⚠️ Critério antigo não encontrado: "${antigo}"`);
      continue;
    }

    let criterioNovo = await prisma.evaluationCriterion.findFirst({
      where: { title: novo },
    });

    if (!criterioNovo) {
      criterioNovo = await prisma.evaluationCriterion.create({
        data: {
          title: novo,
          description: `Criado automaticamente a partir de "${antigo}"`,
          type: criterioAntigo.type, // herda o tipo do antigo
        },
      });

      console.log(`🆕 Criado critério novo: "${novo}"`);
    }

    const respostasAntigas = await prisma.evaluationAnswer.findMany({
      where: { criterionId: criterioAntigo.id },
    });
    console.log(
      `🔍 Encontradas ${respostasAntigas.length} respostas para o critério`,
    );

    let count = 0;

    for (const resposta of respostasAntigas) {
      // Verifica se já existe uma resposta duplicada para o novo critério e mesma avaliação
      const existe = await prisma.evaluationAnswer.findFirst({
        where: {
          evaluationId: resposta.evaluationId,
          criterionId: criterioNovo.id,
        },
      });

      if (existe) {
        console.warn(
          `❗ Já existe resposta para avaliação ${resposta.evaluationId} com critério "${novo}". Pulando.`,
        );
        continue;
      }

      // Cria nova resposta com mesmo conteúdo, mas com o critério novo
      await prisma.evaluationAnswer.create({
        data: {
          evaluationId: resposta.evaluationId,
          criterionId: criterioNovo.id,
          score: resposta.score,
          justification: resposta.justification ?? '',
        },
      });

      // Deleta a resposta antiga
      await prisma.evaluationAnswer.delete({
        where: { id: resposta.id },
      });

      count++;
    }

    console.log(
      `🔁 Substituídas ${count} respostas de "${antigo}" para "${novo}"`,
    );
  }

  console.log('✅ Atualização completa.');
}
