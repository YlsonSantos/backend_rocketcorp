# Endpoint de Upsert - Critérios de Avaliação

## Descrição
O endpoint `/evaluation-criteria/upsert` permite criar novos critérios e atualizar existentes em uma única operação, ideal para sincronização de dados em lote. **Critérios que já existem mas não tiveram mudanças são identificados e reportados separadamente.**

**Nota**: Esta é a única forma de criar e atualizar critérios na aplicação. Endpoints individuais de POST e PATCH foram removidos para simplificar a API.

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
}

interface UpdateCriterionForUpsertDto extends CreateEvaluationCriterionDto {
  id: string;  // ID do critério existente
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

// Exemplo de uso
const handleSaveAllCriteria = async () => {
  const criteriaToUpsert = {
    create: [
      {
        title: 'Novo Critério Técnico',
        description: 'Descrição do novo critério',
        type: 'GESTAO'
      },
      {
        title: 'Novo Critério Comportamental',
        description: 'Descrição do novo critério',
        type: 'COMPORTAMENTO'
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
```

### Exemplo com Formulário Dinâmico

```typescript
const [criteria, setCriteria] = useState<Array<{
  id?: string;
  title: string;
  description: string;
  type: CriterionType;
  isNew?: boolean;
}>>([]);

const handleSaveAll = async () => {
  const createCriteria = criteria
    .filter(c => c.isNew)
    .map(({ title, description, type }) => ({ title, description, type }));

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
  "message": "Upsert operation failed: Validation error",
  "error": "Bad Request"
}
```

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