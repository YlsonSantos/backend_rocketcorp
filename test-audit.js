const axios = require('axios');

async function testAudit() {
  try {
    console.log('🔍 Testando sistema de auditoria...\n');

    // 1. Fazer login para obter token
    console.log('1. Fazendo login...');
    const loginResponse = await axios.post('http://localhost:3000/auth/login', {
      email: 'analaura@example.com',
      password: '123456'
    });

    const token = loginResponse.data.access_token;
    console.log('✅ Login realizado com sucesso\n');

    // 2. Fazer uma requisição que deve gerar audit log
    console.log('2. Fazendo requisição para gerar audit log...');
    const auditResponse = await axios.get('http://localhost:3000/users', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Requisição realizada com sucesso');
    console.log(`📊 Resposta: ${auditResponse.data.length} usuários encontrados\n`);

    // 3. Verificar se o audit log foi criado (usando Prisma Studio ou consulta direta)
    console.log('3. Verificando se audit log foi criado...');
    console.log('💡 Abra o Prisma Studio (npx prisma studio) e verifique a tabela AuditLog');
    console.log('💡 Ou execute: npx prisma studio para visualizar o banco\n');

    // 4. Fazer uma requisição POST para testar captura de dados
    console.log('4. Testando requisição POST com dados...');
    const postResponse = await axios.post('http://localhost:3000/criterios-avaliacao/upsert', {
      create: [
        {
          title: 'Teste Audit',
          description: 'Critério para testar auditoria',
          type: 'GESTAO'
        }
      ],
      update: []
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Requisição POST realizada com sucesso');
    console.log('📊 Resposta:', postResponse.data.message);

  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
  }
}

testAudit(); 