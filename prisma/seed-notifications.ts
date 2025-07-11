import { PrismaClient, NotificationType } from '@prisma/client';

const prisma = new PrismaClient();

async function seedNotificationTemplates() {
  const templates = [
    {
      type: NotificationType.EVALUATION_DUE,
      title: 'Avaliação Pendente',
      message: 'Você tem uma avaliação pendente para {{evaluatedName}} no ciclo {{cycleName}}.',
      variables: JSON.stringify(['evaluatedName', 'cycleName']),
    },
    {
      type: NotificationType.EVALUATION_COMPLETED,
      title: 'Avaliação Recebida',
      message: '{{evaluatorName}} completou sua avaliação.',
      variables: JSON.stringify(['evaluatorName']),
    },
    {
      type: NotificationType.GOAL_DEADLINE_APPROACHING,
      title: 'Prazo de Meta Aproximando',
      message: 'A meta "{{goalTitle}}" vence em {{daysLeft}} dia(s).',
      variables: JSON.stringify(['goalTitle', 'daysLeft']),
    },
    {
      type: NotificationType.SURVEY_AVAILABLE,
      title: 'Nova Pesquisa Disponível',
      message: 'A pesquisa "{{surveyTitle}}" está disponível até {{endDate}}.',
      variables: JSON.stringify(['surveyTitle', 'endDate']),
    },
    {
      type: NotificationType.CYCLE_STARTED,
      title: 'Ciclo de Avaliação Iniciado',
      message: 'O ciclo "{{cycleName}}" foi iniciado. Verifique suas avaliações pendentes.',
      variables: JSON.stringify(['cycleName']),
    },
  ];

  for (const template of templates) {
    await prisma.notificationTemplate.upsert({
      where: { type: template.type },
      update: template,
      create: template,
    });
  }

  console.log('✅ Notification templates seeded');
}

seedNotificationTemplates()
  .catch(console.error)
  .finally(() => prisma.$disconnect()); 