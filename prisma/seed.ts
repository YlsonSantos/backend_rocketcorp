import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.position.createMany({
    data: [
      { id: 'pos1', name: 'Software Engineer', track: 'DESENVOLVIMENTO' },
      { id: 'pos2', name: 'Product Designer', track: 'DESIGN' },
      { id: 'pos3', name: 'Product Manager', track: 'FINANCEIRO' },
    ],
  });

  await prisma.user.createMany({
    data: [
      {
        id: 'user1',
        name: 'Alice Silva',
        email: 'alice@example.com',
        password: '123',
        role: 'COLABORADOR',
        positionId: 'pos1',
        managerId: 'user3',
      },
      {
        id: 'user2',
        name: 'Bruno Costa',
        email: 'bruno@example.com',
        password: '123',
        role: 'COLABORADOR',
        positionId: 'pos2',
        managerId: 'user3',
      },
      {
        id: 'user3',
        name: 'Carlos Dias',
        email: 'carlos@example.com',
        password: '123',
        role: 'LIDER',
        positionId: 'pos3',
        managerId: null,
      },
    ],
  });

  await prisma.team.createMany({
    data: [
      { id: 'team1', name: 'Team Alpha' },
      { id: 'team2', name: 'Team Beta' },
    ],
  });

  await prisma.teamMember.createMany({
    data: [
      { id: 'tm1', userId: 'user1', teamId: 'team1' },
      { id: 'tm2', userId: 'user2', teamId: 'team1' },
      { id: 'tm3', userId: 'user3', teamId: 'team2' },
    ],
  });

  await prisma.evaluationCycle.create({
    data: {
      id: 'cycle1',
      name: 'Cycle Q1 2025',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-03-31'),
    },
  });

  await prisma.evaluationCriterion.createMany({
    data: [
      {
        id: 'crit1',
        title: 'Trabalho em Equipe',
        description: 'Colaboração com a equipe.',
        type: 'HABILIDADES',
      },
      {
        id: 'crit2',
        title: 'Proatividade',
        description: 'Iniciativa sem ser solicitado.',
        type: 'VALORES',
      },
    ],
  });

  await prisma.criteriaAssignment.createMany({
    data: [
      { id: 'ca1', criterionId: 'crit1', teamId: 'team1', positionId: 'pos1' },
      { id: 'ca2', criterionId: 'crit2', teamId: 'team1', positionId: 'pos2' },
    ],
  });

  await prisma.evaluation.create({
    data: {
      id: 'eval1',
      type: 'LIDER',
      cycleId: 'cycle1',
      evaluatorId: 'user3',
      evaluatedId: 'user1',
      teamId: 'team1',
      createdAt: new Date(),
      completed: true,
    },
  });

  await prisma.evaluationAnswer.createMany({
    data: [
      {
        id: 'ans1',
        evaluationId: 'eval1',
        criterionId: 'crit1',
        score: 4,
        justification: 'Ótima colaboração',
      },
      {
        id: 'ans2',
        evaluationId: 'eval1',
        criterionId: 'crit2',
        score: 5,
        justification: 'Sempre proativo',
      },
    ],
  });

  await prisma.reference.create({
    data: {
      id: 'ref1',
      evaluatorId: 'user1',
      referencedId: 'user2',
      theme: 'Ajuda constante',
      justification: 'Bruno ajudou em um bug crítico',
    },
  });

  await prisma.auditLog.create({
    data: {
      id: 'log1',
      userId: 'user1',
      action: 'CREATE',
      table: 'EvaluationAnswer',
      timestamp: new Date(),
      metadata: { details: 'Resposta criada manualmente' },
    },
  });

  await prisma.genaiInsight.create({
    data: {
      id: 'insight1',
      cycleId: 'cycle1',
      evaluatedId: 'user1',
      summary: 'Alice colaborou bem',
      discrepancies: 'Nenhuma',
      brutalFacts: 'Precisa melhorar entregas',
    },
  });

  await prisma.scorePerCycle.create({
    data: {
      id: 'spc1',
      userId: 'user1',
      cycleId: 'cycle1',
      score: 4.5,
      feedback: 'Ótimo desempenho',
      createdAt: new Date(),
    },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
