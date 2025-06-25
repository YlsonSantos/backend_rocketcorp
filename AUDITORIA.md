# Auditoria de Ações (Audit Logging)

## Visão Geral

Este backend implementa um sistema de auditoria robusto para rastrear todas as ações relevantes realizadas via API. O objetivo é garantir conformidade, rastreabilidade e segurança, registrando eventos críticos e sensíveis em um log estruturado.

## Como Funciona

- **Interceptação Global:** Todas as requisições HTTP passam por um interceptor global (`AuditInterceptor`) que registra eventos de auditoria automaticamente.
- **Middleware de Correlação:** Um middleware garante que cada requisição tenha um `correlation-id` único, facilitando o rastreamento ponta-a-ponta.
- **Serviço de Auditoria:** O `AuditService` centraliza a lógica de gravação dos eventos no banco de dados, no modelo `AuditLog`.
- **Usuário Anônimo:** Para requisições não autenticadas (ex: login), os eventos são associados a um usuário especial "anonymous".

## O que é registrado

Cada evento de auditoria contém:
- **eventId:** Identificador único do evento
- **timestamp:** Data/hora UTC do evento
- **actorId:** ID do usuário que realizou a ação (ou "anonymous")
- **action:** Tipo de ação (CREATE, READ, UPDATE, DELETE, LOGIN, etc.)
- **resource:** Recurso afetado (ex: USER, EVALUATION)
- **oldValue/newValue:** Valores antes/depois da alteração (quando aplicável)
- **result:** Resultado da operação (SUCCESS, FAILURE)
- **ip:** IP de origem da requisição
- **userAgent:** User-Agent do cliente
- **traceId:** Correlation ID da requisição
- **additionalContext:** Informações extras (método HTTP, status, etc.)

## Onde os logs são armazenados

Os eventos são gravados na tabela `AuditLog` do banco de dados, com estrutura JSON para os metadados. Também são exibidos no console para debug em desenvolvimento.

## Como consultar

- **Banco de Dados:** Use o Prisma Studio (`npx prisma studio`) para visualizar a tabela `AuditLog`.
- **Console:** Os eventos aparecem no terminal com o prefixo `AUDIT:`.

## Extensibilidade

- **Decorator Manual:** Use o decorator `@Audit()` para registrar eventos customizados em métodos específicos.
- **Integração com outros sistemas:** O serviço pode ser adaptado para enviar logs para sistemas externos (SIEM, ELK, etc).

## Boas Práticas e Segurança

- **Campos Sensíveis:** Senhas e tokens são mascarados automaticamente nos logs.
- **Usuário Anônimo:** Toda ação sem autenticação é registrada com o ID especial `anonymous`.
- **Resiliência:** Falhas no log de auditoria não interrompem o fluxo principal da aplicação.

## Exemplos de Uso

- Criação, atualização ou exclusão de usuários, avaliações, referências, etc.
- Tentativas de login e operações sensíveis.
- Acesso a dados sensíveis (consultas READ).

## Observações

- O sistema pode ser expandido para auditar eventos de background jobs, filas e integrações externas.
- O retention dos logs deve ser definido conforme a política de compliance da empresa.

---

Dúvidas ou sugestões? Fale com o time de backend/segurança. 