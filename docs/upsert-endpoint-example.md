# Endpoint de Upsert - Critérios de Avaliação

## Descrição
O endpoint `/evaluation-criteria/upsert` permite criar novos critérios e atualizar existentes em uma única operação, ideal para sincronização de dados em lote. **Critérios que já existem mas não tiveram mudanças são identificados e reportados separadamente.**

**Nota**: Esta é a única forma de criar e atualizar critérios na aplicação. Endpoints individuais de POST e PATCH foram removidos para simplificar a API.

## Novidades na Versão Atualizada

### Criação Automática de Associações
- Ao criar um critério, você pode especificar um `positionId` para criar automaticamente a associação entre o critério e a posição
- Se a associação já existir, ela será atualizada se necessário (ex: mudança no campo `isRequired`)
- Você ainda pode usar o campo `assignments` para múltiplas associações

### Melhorias na Validação
- Validação de UUID mais robusta no endpoint DELETE
- Tratamento de erros melhorado com transações para garantir consistência de dados

## Endpoints Disponíveis

### 1. Upsert (Criar/Atualizar)
```
POST /criterios-avaliacao/upsert
```

### 2. Listar Critérios
```
GET /criterios-avaliacao
```

### 3. Deletar Critério
```
DELETE /criterios-avaliacao/:id
```

## Autenticação
- Requer token JWT válido
- Roles permitidas: `RH`

## Estrutura da Requisição

```typescript
interface UpsertRequest {
  create: CreateEvaluationCriterionDto[];  // Novos critérios para criar
  update: UpdateCriterionForUpsertDto[];   // Critérios existentes para atualizar
}

interface CreateEvaluationCriterionDto {
  title: string;
  description: string;
  type: 'GESTAO' | 'EXECUCAO' | 'COMPORTAMENTO' | 'AV360' | 'FROMETL';
  weight?: number;                    // Opcional (1-10)
  positionId?: string;                // NOVO: ID da posição para associação automática
  isRequired?: boolean;               // NOVO: Se o critério é obrigatório para a posição
  assignments?: CriteriaAssignmentDto[]; // Opcional: múltiplas associações
}

interface UpdateCriterionForUpsertDto extends CreateEvaluationCriterionDto {
  id: string;  // ID do critério existente
}

interface CriteriaAssignmentDto {
  positionId: string;
  isRequired?: boolean;
}
```

## Exemplo de Uso

### Frontend (React/TypeScript)

```typescript
import axios from 'axios';

const upsertCriteria = async (criteriaData: {
  create: CreateEvaluationCriterionDto[];
  update: UpdateCriterionForUpsertDto[];
}) => {
  try {
    const response = await axios.post('/api/criterios-avaliacao/upsert', criteriaData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const { summary, details } = response.data;
    
    console.log(`Operação concluída:`, {
      criados: summary.created,
      atualizados: summary.updated,
      semMudanças: summary.unchanged,
      erros: summary.errors
    });

    return response.data;
  } catch (error) {
    console.error('Erro na operação de upsert:', error);
    throw error;
  }
};

// Exemplo de uso com positionId (NOVO)
const handleSaveAllCriteria = async () => {
  const criteriaToUpsert = {
    create: [
      {
        title: 'Novo Critério Técnico',
        description: 'Descrição do novo critério',
        type: 'GESTAO',
        positionId: 'position-uuid-1',  // Associação automática
        isRequired: true
      },
      {
        title: 'Novo Critério Comportamental',
        description: 'Descrição do novo critério',
        type: 'COMPORTAMENTO',
        positionId: 'position-uuid-2',  // Associação automática
        isRequired: false
      }
    ],
    update: [
      {
        id: 'existing-criterion-id-1',
        title: 'Critério Atualizado',
        description: 'Nova descrição',
        type: 'AV360'
      },
      {
        id: 'existing-criterion-id-2',
        title: 'Critério Sem Mudanças',
        description: 'Mesma descrição',
        type: 'GESTAO'
      }
    ]
  };

  try {
    const result = await upsertCriteria(criteriaToUpsert);
    
    // Mostrar feedback ao usuário
    if (result.summary.errors === 0) {
      alert(`Sucesso! ${result.summary.created} criados, ${result.summary.updated} atualizados, ${result.summary.unchanged} sem mudanças`);
    } else {
      alert(`Operação parcialmente bem-sucedida. ${result.summary.errors} erros encontrados.`);
    }
  } catch (error) {
    alert('Erro na operação');
  }
};

// Exemplo com múltiplas associações (método tradicional)
const handleSaveWithMultipleAssignments = async () => {
  const criteriaToUpsert = {
    create: [
      {
        title: 'Critério Multi-Posição',
        description: 'Critério aplicável a múltiplas posições',
        type: 'EXECUCAO',
        assignments: [
          { positionId: 'position-uuid-1', isRequired: true },
          { positionId: 'position-uuid-2', isRequired: false },
          { positionId: 'position-uuid-3', isRequired: true }
        ]
      }
    ],
    update: []
  };

  await upsertCriteria(criteriaToUpsert);
};
```

### Exemplo com Formulário Dinâmico

```typescript
const [criteria, setCriteria] = useState<Array<{
  id?: string;
  title: string;
  description: string;
  type: CriterionType;
  positionId?: string;
  isRequired?: boolean;
  isNew?: boolean;
}>>([]);

const handleSaveAll = async () => {
  const createCriteria = criteria
    .filter(c => c.isNew)
    .map(({ title, description, type, positionId, isRequired }) => ({ 
      title, 
      description, 
      type, 
      positionId, 
      isRequired 
    }));

  const updateCriteria = criteria
    .filter(c => !c.isNew && c.id)
    .map(({ id, title, description, type }) => ({ id, title, description, type }));

  const upsertData = {
    create: createCriteria,
    update: updateCriteria
  };

  await upsertCriteria(upsertData);
};
```

## Resposta da API

### Sucesso (201)
```json
{
  "message": "Upsert operation completed",
  "summary": {
    "created": 2,
    "updated": 1,
    "unchanged": 2,
    "errors": 0
  },
  "details": {
    "created": [
      {
        "id": "new-id-1",
        "title": "Novo Critério",
        "description": "Descrição",
        "type": "GESTAO",
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "updated": [
      {
        "id": "existing-id-1",
        "title": "Critério Atualizado",
        "description": "Nova descrição",
        "type": "COMPORTAMENTO",
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "unchanged": [
      {
        "id": "existing-id-2",
        "title": "Critério Sem Mudanças",
        "description": "Mesma descrição",
        "type": "GESTAO",
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "errors": []
  }
}
```

### Erro (400)
```json
{
  "statusCode": 400,
  "message": "Upsert operation failed: [detalhes do erro]",
  "error": "Bad Request"
}
```

## Comportamento das Associações

### Ao Criar Critério com positionId
1. O critério é criado
2. Uma associação é automaticamente criada com a posição especificada
3. Se a associação já existir, ela é atualizada se necessário

### Ao Criar Critério com assignments
1. O critério é criado
2. Múltiplas associações são criadas conforme especificado
3. Associações duplicadas são tratadas graciosamente

### Ao Deletar Critério
1. O sistema verifica se há respostas de avaliação associadas
2. Se houver respostas, a operação é bloqueada (erro 409)
3. Se não houver respostas, todas as associações são removidas
4. O critério é deletado
5. Tudo é feito em uma transação para garantir consistência

## Validações

### UUID
- Todos os IDs devem ser UUIDs válidos (versão 4)
- Validação rigorosa no endpoint DELETE

### Campos Obrigatórios
- `title`: string não vazia
- `description`: string não vazia  
- `type`: um dos valores válidos (GESTAO, EXECUCAO, COMPORTAMENTO, AV360, FROMETL)

### Campos Opcionais
- `weight`: número entre 1 e 10
- `positionId`: UUID válido (se fornecido)
- `isRequired`: boolean (padrão: false)
- `assignments`: array de objetos com positionId e isRequired

## Tratamento de Erros

### Erro 400 - Bad Request
- Dados inválidos na requisição
- UUID inválido
- Erro interno durante a operação

### Erro 401 - Unauthorized
- Token JWT inválido ou ausente

### Erro 403 - Forbidden
- Usuário sem permissão RH

### Erro 404 - Not Found
- Critério não encontrado (DELETE)

### Erro 409 - Conflict
- Tentativa de deletar critério com respostas associadas
- Conflito de dados durante a operação

## Vantagens da API Simplificada

1. **Simplicidade**: Apenas 2 endpoints para gerenciar critérios
2. **Performance**: Uma única requisição para múltiplas operações
3. **Detecção Inteligente**: Identifica critérios sem mudanças e não executa updates desnecessários
4. **Feedback Detalhado**: Informações sobre criados, atualizados, sem mudanças e falhas
5. **Flexibilidade**: Permite misturar criação e atualização
6. **Tratamento de Erros**: Continua processando mesmo se algumas operações falharem
7. **Otimização**: Evita operações de banco desnecessárias
8. **Consistência**: Interface unificada para todas as operações

## Casos de Uso

- Sincronização de dados entre sistemas
- Importação de planilhas com dados mistos
- Interface de edição em lote
- Migração de dados
- Backup e restauração de critérios
- Verificação de integridade de dados
- Formulários dinâmicos com criação/edição simultânea 