# Sistema de Notificações Automáticas

## Visão Geral

O sistema de notificações automáticas foi implementado para enviar notificações em tempo real aos usuários baseado em eventos específicos do sistema. O sistema utiliza cron jobs para verificar periodicamente condições que geram notificações automáticas.

## Componentes Principais

### 1. AutomaticNotificationsService

Localizado em `src/notifications/automatic-notifications.service.ts`, este serviço contém todos os cron jobs e métodos para geração de notificações automáticas.

### 2. Cron Jobs Implementados

#### Verificação de Prazos de Avaliação
- **Agendamento**: Diariamente às 9h (`@Cron(CronExpression.EVERY_DAY_AT_9AM)`)
- **Função**: `checkEvaluationDeadlines()`
- **Comportamento**: Verifica ciclos que terminam em 3 dias e notifica avaliadores com avaliações pendentes
- **Prioridade**: ALTA se ≤ 1 dia, MÉDIA se > 1 dia

#### Verificação de Início de Ciclos
- **Agendamento**: Diariamente às 8h (`@Cron(CronExpression.EVERY_DAY_AT_8AM)`)
- **Função**: `checkCycleStart()`
- **Comportamento**: Notifica todos os usuários quando um novo ciclo de avaliação começa
- **Prioridade**: MÉDIA

#### Verificação de Fim de Ciclos
- **Agendamento**: Diariamente às 17h (`@Cron(CronExpression.EVERY_DAY_AT_5PM)`)
- **Função**: `checkCycleEnd()`
- **Comportamento**: Notifica usuários com avaliações pendentes quando o ciclo termina no dia
- **Prioridade**: ALTA

#### Verificação de Prazos de Metas
- **Agendamento**: Diariamente às 10h (`@Cron(CronExpression.EVERY_DAY_AT_10AM)`)
- **Função**: `checkGoalDeadlines()`
- **Comportamento**: Verifica ações de metas com prazo em 7 dias
- **Prioridade**: ALTA se ≤ 2 dias, MÉDIA se > 2 dias

#### Verificação de Novas Pesquisas
- **Agendamento**: Diariamente às 9h (`@Cron(CronExpression.EVERY_DAY_AT_9AM)`)
- **Função**: `checkNewSurveys()`
- **Comportamento**: Notifica usuários sobre pesquisas criadas nas últimas 24h
- **Prioridade**: MÉDIA

#### Lembretes de Pesquisas
- **Agendamento**: Diariamente às 14h (`@Cron(CronExpression.EVERY_DAY_AT_2PM)`)
- **Função**: `sendSurveyReminders()`
- **Comportamento**: Envia lembretes para usuários que não responderam pesquisas que terminam em 3 dias
- **Prioridade**: ALTA se ≤ 1 dia, MÉDIA se > 1 dia

#### Verificação de Avaliações de Mentoria
- **Agendamento**: Semanalmente às segundas às 9h (`@Cron('0 9 * * 1')`)
- **Função**: `checkMentorshipEvaluations()`
- **Comportamento**: Notifica mentores sobre avaliações pendentes de seus mentorados
- **Prioridade**: MÉDIA

### 3. Métodos de Notificação por Evento

#### Avaliação Completada
- **Método**: `notifyEvaluationCompleted(evaluationId: string)`
- **Trigger**: Quando uma avaliação é marcada como completada
- **Notificações**:
  - Para o avaliado: "Avaliação Recebida"
  - Para o avaliador: "Avaliação Concluída"

#### Meta Completada
- **Método**: `notifyGoalCompleted(goalId: string)`
- **Trigger**: Quando todas as ações de uma meta são completadas
- **Notificação**: "Meta Concluída" para o usuário

#### Score Disponível
- **Método**: `notifyScoreAvailable(scorePerCycleId: string)`
- **Trigger**: Quando um score é calculado e disponibilizado
- **Notificação**: "Score Disponível" para o usuário

## Integração com Outros Módulos

### Avaliações
- O `EvaluationService` chama `notifyEvaluationCompleted()` quando uma avaliação é completada
- Integrado no método `criar()` do serviço

### Metas
- O `GoalService` chama `notifyGoalCompleted()` quando todas as ações de uma meta são completadas
- Integrado no método `updateGoalAction()` do serviço

### Pesquisas
- O `SurveyService` envia notificações automáticas quando uma nova pesquisa é criada e ativada
- Integrado no método `createSurvey()` do serviço

## Configuração

### 1. Instalação de Dependências
```bash
npm install @nestjs/schedule --legacy-peer-deps
```

### 2. Configuração do Módulo
O `ScheduleModule` deve ser importado no `NotificationsModule`:

```typescript
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [PrismaModule, JwtModule, ScheduleModule.forRoot()],
  // ...
})
```

### 3. Variáveis de Ambiente
Nenhuma variável de ambiente específica é necessária para as notificações automáticas.

## Testes

### Executar Teste Manual
```bash
npm run test:notifications
```

Este comando executa todos os cron jobs manualmente e verifica se as notificações são criadas corretamente.

### Verificar Logs
Os cron jobs registram logs no console com o prefixo `[AutomaticNotificationsService]` para facilitar o debugging.

## Tipos de Notificação

O sistema suporta os seguintes tipos de notificação automática:

- `EVALUATION_DUE`: Prazo de avaliação se aproximando
- `EVALUATION_COMPLETED`: Avaliação foi completada
- `EVALUATION_RECEIVED`: Avaliação foi recebida
- `GOAL_DEADLINE_APPROACHING`: Prazo de meta se aproximando
- `GOAL_COMPLETED`: Meta foi completada
- `MENTORSHIP_EVALUATION_DUE`: Avaliação de mentoria pendente
- `SURVEY_AVAILABLE`: Nova pesquisa disponível
- `SURVEY_REMINDER`: Lembrete de pesquisa
- `CYCLE_STARTED`: Novo ciclo iniciado
- `CYCLE_ENDING`: Ciclo terminando
- `SCORE_AVAILABLE`: Score disponível

## Prioridades

- `LOW`: Notificações informativas
- `MEDIUM`: Notificações importantes
- `HIGH`: Notificações urgentes
- `URGENT`: Notificações críticas

## Monitoramento

### Logs
Todos os cron jobs registram logs de início e fim de execução.

### Métricas
O sistema pode ser monitorado através dos logs do NestJS e verificando a tabela `Notification` no banco de dados.

### Alertas
Para monitoramento em produção, recomenda-se:
1. Configurar alertas para falhas nos cron jobs
2. Monitorar o volume de notificações criadas
3. Verificar se as notificações estão sendo entregues via WebSocket

## Troubleshooting

### Cron Jobs Não Executando
1. Verificar se o `ScheduleModule` está importado
2. Verificar logs do NestJS
3. Confirmar que o serviço está sendo instanciado

### Notificações Não Sendo Criadas
1. Verificar se há dados válidos no banco
2. Verificar logs de erro nos métodos
3. Confirmar que as datas estão corretas

### Performance
- Os cron jobs são otimizados para executar consultas eficientes
- Recomenda-se monitorar o tempo de execução em produção
- Considerar escalar horizontalmente se necessário 