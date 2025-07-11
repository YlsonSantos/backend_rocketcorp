const axios = require('axios');

const API_BASE = 'http://localhost:3000';

async function testNotifications() {
  try {
    console.log('🧪 Testando sistema de notificações...\n');

    // 1. Fazer login para obter token
    console.log('1. Fazendo login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'alice@example.com',
      password: '123456'
    });
    
    const token = loginResponse.data.access_token;
    console.log('✅ Login realizado com sucesso\n');

    // 2. Verificar notificações do usuário
    console.log('2. Verificando notificações...');
    const notificationsResponse = await axios.get(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`📧 Notificações encontradas: ${notificationsResponse.data.length}`);
    notificationsResponse.data.forEach((notification, index) => {
      console.log(`   ${index + 1}. ${notification.title}: ${notification.message}`);
    });
    console.log('');

    // 3. Verificar contagem de não lidas
    console.log('3. Verificando contagem de não lidas...');
    const unreadResponse = await axios.get(`${API_BASE}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`📊 Notificações não lidas: ${unreadResponse.data.count}\n`);

    // 4. Marcar uma notificação como lida (se existir)
    if (notificationsResponse.data.length > 0) {
      console.log('4. Marcando primeira notificação como lida...');
      await axios.post(`${API_BASE}/notifications/mark-as-read/${notificationsResponse.data[0].id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Notificação marcada como lida\n');
    }

    // 5. Testar criação de nova notificação
    console.log('5. Criando nova notificação de teste...');
    const testNotificationResponse = await axios.post(`${API_BASE}/notifications/test`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Nova notificação criada com sucesso\n');

    // 6. Verificar notificações novamente
    console.log('6. Verificando notificações após criação...');
    const updatedNotificationsResponse = await axios.get(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`📧 Total de notificações: ${updatedNotificationsResponse.data.length}`);
    console.log('✅ Teste concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.response?.data || error.message);
  }
}

testNotifications(); 