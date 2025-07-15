const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAuditLogs() {
  try {
    console.log('🔍 Verificando audit logs no banco de dados...\n');

    // 1. Verificar se existem audit logs
    const auditLogs = await prisma.auditLog.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 10
    });

    console.log(`📊 Total de audit logs encontrados: ${auditLogs.length}\n`);

    if (auditLogs.length === 0) {
      console.log('❌ Nenhum audit log encontrado no banco de dados!');
      console.log('💡 Isso pode indicar que:');
      console.log('   - O interceptor não está sendo executado');
      console.log('   - Há erro na gravação no banco');
      console.log('   - O usuário "anonymous" não existe');
      return;
    }

    // 2. Mostrar os últimos audit logs
    console.log('📋 Últimos audit logs:');
    auditLogs.forEach((log, index) => {
      console.log(`\n${index + 1}. Audit Log ID: ${log.id}`);
      console.log(`   Usuário: ${log.user.name} (${log.user.email})`);
      console.log(`   Ação: ${log.action}`);
      console.log(`   Recurso: ${log.table}`);
      console.log(`   Timestamp: ${log.timestamp}`);
      console.log(`   Trace ID: ${log.metadata.traceId}`);
      console.log(`   IP: ${log.metadata.ip}`);
      console.log(`   Resultado: ${log.metadata.result}`);
      
      if (log.metadata.requestData) {
        console.log(`   Dados da requisição: ${JSON.stringify(log.metadata.requestData, null, 2)}`);
      }
    });

    // 3. Verificar se o usuário anonymous existe
    const anonymousUser = await prisma.user.findUnique({
      where: { id: 'anonymous' }
    });

    console.log(`\n👤 Usuário anonymous existe: ${anonymousUser ? '✅ Sim' : '❌ Não'}`);

    // 4. Verificar estrutura da tabela
    console.log('\n📋 Estrutura da tabela AuditLog:');
    console.log('- id: String (UUID)');
    console.log('- userId: String (Foreign Key para User)');
    console.log('- action: String');
    console.log('- table: String');
    console.log('- timestamp: DateTime');
    console.log('- metadata: Json');

  } catch (error) {
    console.error('❌ Erro ao verificar audit logs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAuditLogs(); 