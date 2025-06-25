import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.position.createMany({
    data: [
      { id: 'pos1', name: 'Software Engineer', track: 'DESENVOLVIMENTO' },
      { id: 'pos2', name: 'Product Designer', track: 'DESIGN' },
      { id: 'pos3', name: 'Product Manager', track: 'FINANCEIRO' },
      { id: 'pos4', name: 'QA Engineer', track: 'DESENVOLVIMENTO' },
      { id: 'pos5', name: 'UX Researcher', track: 'DESIGN' },
      { id: 'pos6', name: 'COMITE', track: 'COMITE' },
      { id: 'pos7', name: 'RH', track: 'RH' },
    ],
  });

  await prisma.user.createMany({
    data: [
      // Anonymous user for audit logs
      {
        id: 'anonymous',
        name: 'Anonymous User',
        email: 'anonymous@system.com',
        password: 'system',
        role: 'COLABORADOR',
        positionId: 'pos1',
        managerId: null,
      },
      // Team Alpha
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
        mentorId: 'user1', // 👈 Alice é mentora
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
      {
        id: 'user4',
        name: 'Daniela Martins',
        email: 'daniela@example.com',
        password: '123',
        role: 'COLABORADOR',
        positionId: 'pos4',
        managerId: 'user3',
      },
      {
        id: 'user5',
        name: 'Eduardo Silva',
        email: 'eduardo@example.com',
        password: '123',
        role: 'COLABORADOR',
        positionId: 'pos1',
        managerId: 'user3',
        mentorId: 'user4',
      },

      // Team Beta
      {
        id: 'user6',
        name: 'Fabiana Souza',
        email: 'fabiana@example.com',
        password: '123',
        role: 'COLABORADOR',
        positionId: 'pos1',
        managerId: 'user8',
      },
      {
        id: 'user7',
        name: 'Gabriel Rocha',
        email: 'gabriel@example.com',
        password: '123',
        role: 'COLABORADOR',
        positionId: 'pos5',
        managerId: 'user8',
        mentorId: 'user6',
      },
      {
        id: 'user8',
        name: 'Helena Pereira',
        email: 'helena@example.com',
        password: '123',
        role: 'LIDER',
        positionId: 'pos3',
        managerId: null,
      },
      {
        id: 'user9',
        name: 'Igor Lima',
        email: 'igor@example.com',
        password: '123',
        role: 'COLABORADOR',
        positionId: 'pos4',
        managerId: 'user8',
      },
      {
        id: 'user10',
        name: 'Julia Castro',
        email: 'julia@example.com',
        password: '123',
        role: 'COLABORADOR',
        positionId: 'pos2',
        managerId: 'user8',
        mentorId: 'user9',
      },
      {
        id: 'user11',
        name: 'Ylson Santos',
        email: 'ylson@example.com',
        password: '123',
        role: 'COMITE',
        positionId: 'pos6',
        managerId: null,
        mentorId: null,
      },
      {
        id: 'user12',
        name: 'Ana Laura',
        email: 'analaura@example.com',
        password: '123',
        role: 'RH',
        positionId: 'pos7',
        managerId: null,
        mentorId: null,
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
      { id: 'tm3', userId: 'user3', teamId: 'team1' },
      { id: 'tm4', userId: 'user4', teamId: 'team1' },
      { id: 'tm5', userId: 'user5', teamId: 'team1' },

      { id: 'tm6', userId: 'user6', teamId: 'team2' },
      { id: 'tm7', userId: 'user7', teamId: 'team2' },
      { id: 'tm8', userId: 'user8', teamId: 'team2' },
      { id: 'tm9', userId: 'user9', teamId: 'team2' },
      { id: 'tm10', userId: 'user10', teamId: 'team2' },
    ],
  });

  await prisma.evaluationCycle.createMany({
    data: [
      // Ciclos de 2023
      {
        id: 'cycle2023_1',
        name: '2023.1',
        startDate: new Date('2023-06-01'),
        reviewDate: new Date('2023-06-20'),
        endDate: new Date('2023-06-30'),
      },
      {
        id: 'cycle2023_2',
        name: '2023.2',
        startDate: new Date('2023-12-01'),
        reviewDate: new Date('2023-12-21'),
        endDate: new Date('2023-12-31'),
      },

      // Ciclos de 2024
      {
        id: 'cycle2024_1',
        name: '2024.1',
        startDate: new Date('2024-06-01'),
        reviewDate: new Date('2024-06-20'),
        endDate: new Date('2024-06-30'),
      },
      {
        id: 'cycle2024_2',
        name: '2024.2',
        startDate: new Date('2024-12-01'),
        reviewDate: new Date('2024-12-21'),
        endDate: new Date('2024-12-31'),
      },

      // Ciclos de 2025
      {
        id: 'cycle2025_1',
        name: '2025.1',
        startDate: new Date('2025-06-01'),
        reviewDate: new Date('2025-06-20'),
        endDate: new Date('2025-06-30'),
      },
      {
        id: 'cycle2025_2',
        name: '2025.2',
        startDate: new Date('2025-12-01'),
        reviewDate: new Date('2025-12-21'),
        endDate: new Date('2025-12-31'),
      },
      {
        id: 'cycle2025_1teste',
        name: '2025.1 teste',
        startDate: new Date('2025-01-01'),
        reviewDate: new Date('2025-12-21'),
        endDate: new Date('2025-12-31'),
      },
    ],
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
      {
        id: 'crit3',
        title: 'Cumprimento de Metas',
        description: 'Alcançar objetivos estabelecidos.',
        type: 'METAS',
      },
    ],
  });

  await prisma.criteriaAssignment.createMany({
    data: [
      { id: 'ca1', criterionId: 'crit1', teamId: 'team1', positionId: 'pos1' },
      { id: 'ca2', criterionId: 'crit2', teamId: 'team1', positionId: 'pos2' },
      { id: 'ca3', criterionId: 'crit3', teamId: 'team1', positionId: 'pos4' },

      { id: 'ca4', criterionId: 'crit1', teamId: 'team2', positionId: 'pos1' },
      { id: 'ca5', criterionId: 'crit2', teamId: 'team2', positionId: 'pos5' },
      { id: 'ca6', criterionId: 'crit3', teamId: 'team2', positionId: 'pos4' },
    ],
  });

  await prisma.evaluation.createMany({
    data: [
      // Líder Carlos avalia Alice
      {
        id: 'eval1',
        type: 'LIDER',
        cycleId: 'cycle2023_1',
        evaluatorId: 'user3',
        evaluatedId: 'user1',
        teamId: 'team1',
        createdAt: new Date(),
        completed: true,
      },
      {
        id: 'eval11',
        type: 'LIDER',
        cycleId: 'cycle2025_1',
        evaluatorId: 'user3',
        evaluatedId: 'user1',
        teamId: 'team1',
        createdAt: new Date(),
        completed: true,
      },
      // Autoavaliação Alice
      {
        id: 'eval2',
        type: 'AUTO',
        cycleId: 'cycle2023_1',
        evaluatorId: 'user1',
        evaluatedId: 'user1',
        teamId: 'team1',
        createdAt: new Date(),
        completed: true,
      },
      {
        id: 'eval22',
        type: 'AUTO',
        cycleId: 'cycle2025_1',
        evaluatorId: 'user1',
        evaluatedId: 'user1',
        teamId: 'team1',
        createdAt: new Date(),
        completed: true,
      },
      {
        id: 'eval223',
        type: 'AUTO',
        cycleId: 'cycle2024_1',
        evaluatorId: 'user1',
        evaluatedId: 'user1',
        teamId: 'team1',
        createdAt: new Date(),
        completed: true,
      },
      // Membro Bruno avalia Daniela
      {
        id: 'eval3',
        type: 'PAR',
        cycleId: 'cycle2025_1',
        evaluatorId: 'user2',
        evaluatedId: 'user4',
        teamId: 'team1',
        createdAt: new Date(),
        completed: true,
      },

      // Líder Helena avalia Fabiana (Team Beta)
      {
        id: 'eval4',
        type: 'LIDER',
        cycleId: 'cycle2025_1',
        evaluatorId: 'user8',
        evaluatedId: 'user6',
        teamId: 'team2',
        createdAt: new Date(),
        completed: true,
      },
      // Autoavaliação Fabiana
      {
        id: 'eval5',
        type: 'AUTO',
        cycleId: 'cycle2025_1',
        evaluatorId: 'user6',
        evaluatedId: 'user6',
        teamId: 'team2',
        createdAt: new Date(),
        completed: true,
      },
      // Membro Gabriel avalia Julia
      {
        id: 'eval6',
        type: 'PAR',
        cycleId: 'cycle2025_1',
        evaluatorId: 'user7',
        evaluatedId: 'user10',
        teamId: 'team2',
        createdAt: new Date(),
        completed: true,
      },
    ],
  });

  await prisma.evaluationAnswer.createMany({
    data: [
      // Avaliação eval1 (Carlos -> Alice)
      {
        id: 'ans1',
        evaluationId: 'eval1',
        criterionId: 'crit1',
        score: 4,
        justification: 'Colaborou muito bem com o time.',
      },
      {
        id: 'ans2',
        evaluationId: 'eval1',
        criterionId: 'crit2',
        score: 5,
        justification: 'Sempre proativa e com iniciativa.',
      },
      {
        id: 'ans111',
        evaluationId: 'eval11',
        criterionId: 'crit1',
        score: 4,
        justification: 'Colaborou muito bem com o time.',
      },
      {
        id: 'ans21',
        evaluationId: 'eval11',
        criterionId: 'crit2',
        score: 5,
        justification: 'Sempre proativa e com iniciativa.',
      },

      // Avaliação eval2 (Alice autoavaliação)
      {
        id: 'ans3',
        evaluationId: 'eval2',
        criterionId: 'crit1',
        score: 3,
        justification: 'Acredito que posso melhorar a colaboração.',
      },
      {
        id: 'ans4',
        evaluationId: 'eval2',
        criterionId: 'crit2',
        score: 4,
        justification: 'Costumo tomar iniciativa em projetos.',
      },
      // Avaliação ciclo2 (Alice autoavaliação)
      {
        id: 'ans33',
        evaluationId: 'eval22',
        criterionId: 'crit1',
        score: 3,
        justification: 'Acredito que posso melhorar a colaboração.',
      },
      {
        id: 'ans44',
        evaluationId: 'eval22',
        criterionId: 'crit2',
        score: 4,
        justification: 'Costumo tomar iniciativa em projetos.',
      },
      // Avaliação ciclo3 (Alice autoavaliação)
      {
        id: 'ans35',
        evaluationId: 'eval223',
        criterionId: 'crit1',
        score: 3,
        justification: 'Acredito que posso melhorar a colaboração.',
      },
      {
        id: 'ans45',
        evaluationId: 'eval223',
        criterionId: 'crit2',
        score: 4,
        justification: 'Costumo tomar iniciativa em projetos.',
      },

      // Avaliação eval3 (Bruno -> Daniela)
      {
        id: 'ans5',
        evaluationId: 'eval3',
        criterionId: 'crit1',
        score: 4,
        justification: 'Excelente trabalho em equipe.',
      },
      {
        id: 'ans6',
        evaluationId: 'eval3',
        criterionId: 'crit3',
        score: 3,
        justification: 'Metas alcançadas parcialmente.',
      },

      // Avaliação eval4 (Helena -> Fabiana)
      {
        id: 'ans7',
        evaluationId: 'eval4',
        criterionId: 'crit1',
        score: 5,
        justification: 'Ótima colaboração no time Beta.',
      },
      {
        id: 'ans8',
        evaluationId: 'eval4',
        criterionId: 'crit2',
        score: 4,
        justification: 'Sempre pronta para agir.',
      },

      // Avaliação eval5 (Fabiana autoavaliação)
      {
        id: 'ans9',
        evaluationId: 'eval5',
        criterionId: 'crit1',
        score: 4,
        justification: 'Acredito que sou colaborativa.',
      },
      {
        id: 'ans10',
        evaluationId: 'eval5',
        criterionId: 'crit2',
        score: 5,
        justification: 'Tenho muita iniciativa.',
      },

      // Avaliação eval6 (Gabriel -> Julia)
      {
        id: 'ans11',
        evaluationId: 'eval6',
        criterionId: 'crit1',
        score: 3,
        justification: 'Boa colaboração, pode melhorar.',
      },
      {
        id: 'ans12',
        evaluationId: 'eval6',
        criterionId: 'crit3',
        score: 4,
        justification: 'Alcançou a maioria das metas.',
      },
    ],
  });

  await prisma.reference.createMany({
    data: [
      {
        id: 'ref1',
        evaluatorId: 'user1',
        referencedId: 'user2',
        theme: 'Ajuda constante',
        justification: 'Bruno ajudou em um bug crítico',
      },
      {
        id: 'ref2',
        evaluatorId: 'user6',
        referencedId: 'user7',
        theme: 'Design inovador',
        justification: 'Gabriel trouxe ótimas ideias para UX',
      },
      {
        id: 'ref3',
        evaluatorId: 'user3',
        referencedId: 'user5',
        theme: 'Entregas pontuais',
        justification: 'Eduardo sempre entrega no prazo',
      },
    ],
  });

  await prisma.genaiInsight.createMany({
    data: [
      {
        id: 'insight1',
        cycleId: 'cycle2023_1',
        evaluatedId: 'user1',
        summary: 'Alice colaborou bem',
        discrepancies: 'Nenhuma',
        brutalFacts: 'Precisa melhorar entregas',
      },
      {
        id: 'insight2',
        cycleId: 'cycle2023_1',
        evaluatedId: 'user6',
        summary: 'Fabiana é muito engajada',
        discrepancies: 'Pequenas divergências em prazos',
        brutalFacts: 'Excelente comunicação',
      },
    ],
  });
  await prisma.mentorshipEvaluation.createMany({
    data: [
      {
        id: 'eval1',
        mentorId: 'user1',
        menteeId: 'user2',
        cycleId: 'cycle2023_1',
        score: 8.0,
        feedback: 'Bruno tem se mostrado bem dedicado.',
      },
      {
        id: 'eval2',
        mentorId: 'user4',
        menteeId: 'user5',
        cycleId: 'cycle2023_1',
        score: 7.5,
        feedback:
          'Eduardo está evoluindo bem, mas pode melhorar na comunicação.',
      },
      {
        id: 'eval3',
        mentorId: 'user6',
        menteeId: 'user7',
        cycleId: 'cycle2023_1',
        score: 9.0,
        feedback: 'Gabriel tem excelente iniciativa.',
      },
      {
        id: 'eval4',
        mentorId: 'user9',
        menteeId: 'user10',
        cycleId: 'cycle2023_1',
        score: 8.5,
        feedback: 'Julia é muito comprometida com as entregas.',
      },
    ],
  });

  const dataScore = [
    {
      id: 'scr1',
      userId: 'user1',
      cycleId: 'cycle2025_1',
      selfScore: 3.5,
      leaderScore: 3.8,
      peerScore: [4.2, 4.4, 4.3],
      finalScore: 4.0,
      feedback: 'Bom desempenho, pode melhorar alguns pontos.',
    },
    {
      id: 'scr1234',
      userId: 'user1',
      cycleId: 'cycle2024_2',
      selfScore: 3,
      leaderScore: 3.8,
      peerScore: [3.2, 3.4, 3.3],
      finalScore: 3.0,
      feedback: 'Bom desempenho, pode melhorar alguns pontos.',
    },
    {
      id: 'scr12348',
      userId: 'user1',
      cycleId: 'cycle2023_1',
      selfScore: 3,
      leaderScore: 3.8,
      peerScore: [4.2, 2.4, 3.3],
      finalScore: 3.4,
      feedback: 'Bom desempenho, pode melhorar alguns pontos.',
    },
    {
      id: 'scr00',
      userId: 'user1',
      cycleId: 'cycle2023_2',
      selfScore: 3.5,
      leaderScore: 3.8,
      peerScore: [4.3, 4.1],
      finalScore: 4.0,
      feedback: 'Bom desempenho, pode melhorar alguns pontos.',
    },
    {
      id: 'scr09',
      userId: 'user1',
      cycleId: 'cycle2024_1',
      selfScore: 3.5,
      leaderScore: 3.8,
      peerScore: [4.4, 4.2],
      finalScore: 4.0,
      feedback: 'Bom desempenho, pode melhorar alguns pontos.',
    },
    {
      id: 'scr2',
      userId: 'user2',
      cycleId: 'cycle2025_1',
      selfScore: 4.0,
      leaderScore: 4.5,
      peerScore: [4.1, 4.3],
      finalScore: 3.8,
      feedback: 'Mostrou consistência ao longo do ciclo.',
    },
    {
      id: 'scr3',
      userId: 'user3',
      cycleId: 'cycle2025_1',
      selfScore: 4.5,
      leaderScore: 4.8,
      peerScore: [4.7, 4.6, 4.8],
      finalScore: 4.5,
      feedback: 'Excelente desempenho em todas as frentes.',
    },
    {
      id: 'scr4',
      userId: 'user4',
      cycleId: 'cycle2025_1',
      selfScore: 3.5,
      leaderScore: 4.0,
      peerScore: [4.0, 4.2],
      finalScore: 3.7,
      feedback: 'Boa performance com algumas áreas de atenção.',
    },
    {
      id: 'scr5',
      userId: 'user5',
      cycleId: 'cycle2025_1',
      selfScore: 4.5,
      leaderScore: 4.5,
      peerScore: [4.1, 4.3],
      finalScore: 4.3,
      feedback: 'Muito colaborativa e entregas consistentes.',
    },
    {
      id: 'scr6',
      userId: 'user6',
      cycleId: 'cycle2025_1',
      selfScore: 3.5,
      leaderScore: 3.8,
      peerScore: [3.7, 3.6],
      finalScore: 3.5,
      feedback: 'Atuação regular, precisa de mais iniciativa.',
    },
    {
      id: 'scr7',
      userId: 'user7',
      cycleId: 'cycle2025_1',
      selfScore: 3.5,
      leaderScore: 2.8,
      peerScore: [3.5, 3.9],
      finalScore: 3.5,
      feedback: 'Atuação regular, precisa de mais iniciativa.',
    },
    {
      id: 'scr8',
      userId: 'user8',
      cycleId: 'cycle2025_1',
      selfScore: 4.0,
      leaderScore: 4.2,
      peerScore: [4.1, 4.1],
      finalScore: 4.2,
      feedback: 'Ótima entrega técnica e boa comunicação.',
    },
    {
      id: 'scr9',
      userId: 'user9',
      cycleId: 'cycle2025_1',
      selfScore: 5.0,
      leaderScore: 4.8,
      peerScore: [4.7, 4.6],
      finalScore: 4.8,
      feedback: 'Excelente, destaque do time.',
    },
    {
      id: 'scr10',
      userId: 'user10',
      cycleId: 'cycle2025_1',
      selfScore: 4.0,
      leaderScore: 3.8,
      peerScore: [3.6, 3.8],
      finalScore: 4.0,
      feedback: 'Manteve consistência durante o ciclo.',
    },
  ];

  for (const entry of dataScore) {
    await prisma.scorePerCycle.create({
      data: {
        id: entry.id,
        userId: entry.userId,
        cycleId: entry.cycleId,
        selfScore: entry.selfScore,
        leaderScore: entry.leaderScore,
        finalScore: entry.finalScore,
        feedback: entry.feedback,
        peerScores: {
          create: entry.peerScore.map((value) => ({ value })),
        },
      },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
