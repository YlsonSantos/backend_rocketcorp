import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { runAutoAvaliation } from './importAutoAvaliation';
import { runAv360eRef } from './importAv360eRef';
import { runFromToCriteria } from './fromToCriteria';

const prisma = new PrismaClient();
const pastaData = path.join(__dirname, 'data');

async function main() {
  const arquivos = fs
    .readdirSync(pastaData)
    .filter((f) => f.toLowerCase().endsWith('.xlsx'));

  console.log(`📁 Encontrados ${arquivos.length} arquivos para ETL.`);

  // Primeiro: rodar todos no importAutoAvaliation
  for (const nomeArquivo of arquivos) {
    const filePath = path.join(pastaData, nomeArquivo);
    console.log(`🚀 Autoavaliação → ${nomeArquivo}`);
    try {
      await runAutoAvaliation(filePath);
    } catch (err) {
      console.error(`❌ Erro em Autoavaliação (${nomeArquivo}):`, err);
    }
  }

  // Segundo: rodar todos no importAv360eRef
  for (const nomeArquivo of arquivos) {
    const filePath = path.join(pastaData, nomeArquivo);
    console.log(`🚀 Avaliação 360 → ${nomeArquivo}`);
    try {
      await runAv360eRef(filePath);
    } catch (err) {
      console.error(`❌ Erro em Avaliação 360 (${nomeArquivo}):`, err);
    }
  }

  // Terceiro: rodar todos no fromToCriteria
  for (const nomeArquivo of arquivos) {
    const filePath = path.join(pastaData, nomeArquivo);
    console.log(`🚀 Critérios → ${nomeArquivo}`);
    try {
      await runFromToCriteria(filePath);
    } catch (err) {
      console.error(`❌ Erro em Critérios (${nomeArquivo}):`, err);
    }
  }

  console.log('✅ Todos os processos ETL finalizados.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
