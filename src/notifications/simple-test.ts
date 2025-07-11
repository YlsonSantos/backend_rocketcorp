import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testNotifications() {
  try {
    console.log('🧪 Testando sistema de notificações...\n');

    // 1. Verificar se há dados no banco
    const users = await prisma.user.findMany({ take: 5 });
    const cycles = await prisma.evaluationCycle.findMany({ take: 5 });
    const goals = await prisma.goal.findMany({ take: 5 });
    const surveys = await prisma.survey.findMany({ take: 5 });

    console.log(`📊 Dados encontrados:`);
    console.log(`- Usuários: ${users.length}`);
    console.log(`- Ciclos: ${cycles.length}`);
    console.log(`- Metas: ${goals.length}`);
    console.log(`- Pesquisas: ${surveys.length}\n`);

    // 2. Verificar notificações existentes
    const notifications = await prisma.notification.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    console.log(`📋 Notificações existentes: ${notifications.length}`);
    notifications.forEach((notification, index) => {
      console.log(`${index + 1}. ${notification.title} - ${notification.user.name} (${notification.type})`);
    });

    // 3. Simular criação de uma notificação
    if (users.length > 0) {
      const testNotification = await prisma.notification.create({
        data: {
          userId: users[0].id,
          type: 'SYSTEM_ANNOUNCEMENT',
          title: 'Teste de Notificação',
          message: 'Esta é uma notificação de teste do sistema automático.',
          priority: 'MEDIUM',
          metadata: { test: true },
        },
      });

      console.log(`\n✅ Notificação de teste criada: ${testNotification.id}`);

      // 4. Verificar se a notificação foi criada
      const newNotification = await prisma.notification.findUnique({
        where: { id: testNotification.id },
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      });

      if (newNotification) {
        console.log(`📝 Detalhes da notificação:`);
        console.log(`- Título: ${newNotification.title}`);
        console.log(`- Mensagem: ${newNotification.message}`);
        console.log(`- Usuário: ${newNotification.user.name}`);
        console.log(`- Tipo: ${newNotification.type}`);
        console.log(`- Prioridade: ${newNotification.priority}`);
        console.log(`- Lida: ${newNotification.read}`);
      }

      // 5. Limpar notificação de teste
      await prisma.notification.delete({
        where: { id: testNotification.id },
      });
      console.log(`\n🧹 Notificação de teste removida`);
    }

    console.log('\n🎉 Teste concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o teste
testNotifications(); 