import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AutomaticNotificationsService } from './automatic-notifications.service';
import { PrismaService } from '../../prisma/prisma.service';

async function testAutomaticNotifications() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const automaticNotificationsService = app.get(AutomaticNotificationsService);
    const prisma = app.get(PrismaService);

    console.log('🧪 Testando sistema de notificações automáticas...\n');

    // 1. Testar verificação de prazos de avaliação
    console.log('1. Testando verificação de prazos de avaliação...');
    await automaticNotificationsService.checkEvaluationDeadlines();
    console.log('✅ Verificação de prazos concluída\n');

    // 2. Testar verificação de prazos de metas
    console.log('2. Testando verificação de prazos de metas...');
    await automaticNotificationsService.checkGoalDeadlines();
    console.log('✅ Verificação de prazos de metas concluída\n');

    // 3. Testar lembretes de pesquisas
    console.log('3. Testando lembretes de pesquisas...');
    await automaticNotificationsService.checkSurveyReminders();
    console.log('✅ Lembretes de pesquisas concluídos\n');

    // 4. Testar verificação de fim de ciclos
    console.log('4. Testando verificação de fim de ciclos...');
    await automaticNotificationsService.checkCycleEndings();
    console.log('✅ Verificação de fim de ciclos concluída\n');

    // 5. Testar verificação de avaliações de mentoria
    console.log('5. Testando verificação de avaliações de mentoria...');
    await automaticNotificationsService.checkMentorshipEvaluations();
    console.log('✅ Verificação de avaliações de mentoria concluída\n');

    // 6. Verificar notificações criadas
    console.log('6. Verificando notificações criadas...');
    const notifications = await prisma.notification.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    console.log(`📊 Total de notificações encontradas: ${notifications.length}`);
    notifications.forEach((notification, index) => {
      console.log(`${index + 1}. ${notification.title} - ${notification.user.name} (${notification.type})`);
    });

    console.log('\n🎉 Teste do sistema de notificações automáticas concluído!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await app.close();
  }
}

// Executar o teste se este arquivo for executado diretamente
if (require.main === module) {
  testAutomaticNotifications();
}

export { testAutomaticNotifications }; 