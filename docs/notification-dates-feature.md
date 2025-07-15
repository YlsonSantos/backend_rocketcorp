# Feature: Datas Diferenciadas para Notificações

## Resumo
Implementação minimalista que diferencia as datas de notificação entre gestores e colaboradores para avaliações pendentes, usando `reminderDays` para ambos os roles.

## Lógica Implementada

### Para Gestores (LIDER)
- **Data de referência**: `endDate` do ciclo
- **Quando notificar**: `reminderDays` dias antes do `endDate`
- **Janela de notificação**: Desde `reminderDays` dias antes até o `endDate`
- **Exemplo**: Se `endDate = 15/07` e `reminderDays = 3`, notificar de 12/07 até 15/07

### Para Colaboradores (COLABORADOR)
- **Data de referência**: `reviewDate` do ciclo  
- **Quando notificar**: `reminderDays` dias antes do `reviewDate`
- **Janela de notificação**: Desde `reminderDays` dias antes até o `reviewDate`
- **Exemplo**: Se `reviewDate = 10/07` e `reminderDays = 3`, notificar de 07/07 até 10/07

## Arquivos Modificados

### `src/notifications/automatic-notifications.service.ts`
- Método `sendEvaluationDeadlineNotifications()` modificado
- Adicionada lógica condicional baseada no `role` do usuário
- Ambos os roles usam `reminderDays` com datas de referência diferentes
- Mensagens personalizadas para cada tipo de usuário

### `test-notification-dates.js`
- Script de teste para verificar a lógica implementada
- Mostra as datas calculadas e status das notificações
- Exibe janelas de notificação para ambos os roles

## Como Testar

1. **Iniciar o servidor**:
   ```bash
   npm run start:dev
   ```

2. **Executar o teste**:
   ```bash
   npm run test:notification-dates
   ```

3. **Verificar logs**:
   - O teste mostrará as datas calculadas
   - Indicará se hoje é dia de notificação para cada role
   - Mostrará as janelas de notificação

## Exemplo de Saída do Teste
```
🧪 Testando Lógica de Datas Diferenciadas (com reminderDays)

✅ Login realizado como RH

📅 Verificando ciclos ativos...
✅ Ciclo encontrado:
   Nome: cycle2025_1
   Start Date: 1/1/2025
   Review Date: 6/20/2025
   End Date: 6/30/2025

📋 Lógica de Notificações (com reminderDays):
   Hoje: 7/15/2025
   Gestores (LIDER):
     - Receberão notificação: 6/27/2025 (3 dias antes do endDate)
     - Janela de notificação: 6/27/2025 até 6/30/2025
   Colaboradores (COLABORADOR):
     - Receberão notificação: 6/17/2025 (3 dias antes do reviewDate)
     - Janela de notificação: 6/17/2025 até 6/20/2025

🔔 Status das Notificações:
   Gestores: ❌ Não é dia de notificação
   Colaboradores: ❌ Não é dia de notificação

📝 Exemplo Prático:
   Se reminderDays = 3:
   - Gestores: Notificação 3 dias antes de 6/30/2025
   - Colaboradores: Notificação 3 dias antes de 6/20/2025
```

## Configuração
- O valor de `reminderDays` é configurado nas configurações de notificação do ciclo
- Valor padrão: 3 dias
- Pode ser personalizado por ciclo e tipo de notificação
- **Ambos os roles usam o mesmo valor de `reminderDays`**

## Diferenças Principais
| Role | Data de Referência | Janela de Notificação |
|------|-------------------|----------------------|
| **LIDER** | `endDate` | `reminderDays` antes até `endDate` |
| **COLABORADOR** | `reviewDate` | `reminderDays` antes até `reviewDate` | 