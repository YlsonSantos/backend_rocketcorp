# Endpoint para Criação de Critérios de Avaliação

## ✅ Endpoint Já Implementado

O endpoint para criação de novos critérios de avaliação **já está implementado** e funcionando no sistema.

## 📍 Detalhes do Endpoint

### **POST** `/criterios-avaliacao`

**Descrição**: Criar um novo critério de avaliação

**Autorização**: Apenas usuários com role `RH`

**Status Code**: 201 (Created)

---

## 📝 Exemplo de Uso

### Request
```bash
curl -X POST http://localhost:3000/criterios-avaliacao \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Comunicação Efetiva",
    "description": "Capacidade de comunicar ideias de forma clara e eficaz",
    "type": "HABILIDADES",
    "weight": 5,
    "assignments": [
      {
        "positionId": "uuid-da-posicao",
        "teamId": "uuid-da-equipe",
        "isRequired": true
      }
    ]
  }'
```

### Response (201 Created)
```json
{
  "id": "criterion-uuid",
  "title": "Comunicação Efetiva",
  "description": "Capacidade de comunicar ideias de forma clara e eficaz",
  "type": "HABILIDADES",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

## 🔧 Campos do Request Body

### Campos Obrigatórios
- **`title`** (string): Título do critério
- **`description`** (string): Descrição detalhada do critério
- **`type`** (enum): Tipo do critério
  - `HABILIDADES`
  - `VALORES`
  - `METAS`

### Campos Opcionais
- **`weight`** (number): Peso do critério (1-10)
- **`assignments`** (array): Lista de atribuições para posições e equipes

### Estrutura do Array `assignments`
```json
{
  "positionId": "uuid-da-posicao",
  "teamId": "uuid-da-equipe", 
  "isRequired": false
}
```

---

## 🚨 Possíveis Erros

### 400 Bad Request
- Dados inválidos ou campos obrigatórios ausentes
- UUIDs inválidos

### 401 Unauthorized
- Token JWT ausente ou inválido

### 403 Forbidden
- Usuário não possui role `RH`

### 409 Conflict
- Atribuição já existe para o critério, posição e equipe especificados

---

## 🔍 Validações

- **Título**: String não vazia
- **Descrição**: String não vazia
- **Tipo**: Deve ser um dos valores válidos do enum
- **Peso**: Número entre 1 e 10 (se fornecido)
- **UUIDs**: Deve ser um UUID válido v4
- **Atribuições**: Array válido com posição e equipe únicas

---

## 📋 Exemplos de Critérios

### Critério de Habilidades
```json
{
  "title": "Resolução de Problemas",
  "description": "Habilidade de identificar e resolver problemas técnicos de forma eficiente",
  "type": "HABILIDADES",
  "weight": 7
}
```

### Critério de Valores
```json
{
  "title": "Colaboração em Equipe",
  "description": "Capacidade de trabalhar efetivamente em equipe e receber feedback construtivo",
  "type": "VALORES",
  "weight": 6
}
```

### Critério de Metas
```json
{
  "title": "Cumprimento de Prazos",
  "description": "Capacidade de entregar projetos dentro dos prazos estabelecidos",
  "type": "METAS",
  "weight": 8
}
```

---

## 🧪 Como Testar

1. **Inicie o servidor**:
   ```bash
   npm run start:dev
   ```

2. **Autentique-se como RH**:
   ```bash
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "rh@rocketcorp.com",
       "password": "sua_senha"
     }'
   ```

3. **Use o token retornado** para criar um critério:
   ```bash
   curl -X POST http://localhost:3000/criterios-avaliacao \
     -H "Authorization: Bearer SEU_TOKEN_AQUI" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Teste de Critério",
       "description": "Critério para teste",
       "type": "HABILIDADES"
     }'
   ```

---

## 📁 Arquivos Relacionados

- **Controller**: `src/evaluation-criteria/evaluation-criteria.controller.ts`
- **Service**: `src/evaluation-criteria/evaluation-criteria.service.ts`
- **DTO**: `src/evaluation-criteria/dto/create-evaluation-criterion.dto.ts`
- **Entity**: `src/evaluation-criteria/entities/evaluation-criterion.entity.ts`

---

## ✅ Status

**IMPLEMENTADO E FUNCIONANDO** ✅

O endpoint está completamente implementado, testado e pronto para uso em produção. 