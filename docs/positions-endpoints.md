# Endpoints de Posições

## Descrição
O módulo de posições fornece endpoints para gerenciar e consultar posições organizacionais. As posições são categorizadas por tracks (DESENVOLVIMENTO, DESIGN, FINANCEIRO, COMITE, RH).

## Endpoints Disponíveis

### 1. Buscar Posições por Track
```
GET /positions/track/:track
```

### 2. Listar Todas as Posições
```
GET /positions
```

### 3. Buscar Posição por ID
```
GET /positions/:id
```

## Autenticação
- Requer token JWT válido
- Roles permitidas: `RH`

## Estrutura da Resposta

### Posição Individual
```typescript
interface Position {
  id: string;
  name: string;
  track: TrackType;
}
```

### Lista de Posições
```typescript
type PositionsList = Position[];
```

## Tracks Disponíveis

- `DESENVOLVIMENTO` - Posições relacionadas ao desenvolvimento de software
- `DESIGN` - Posições relacionadas ao design de produtos
- `FINANCEIRO` - Posições relacionadas à área financeira
- `COMITE` - Posições de comitê
- `RH` - Posições de recursos humanos

## Exemplos de Uso

### Frontend (React/TypeScript)

```typescript
import axios from 'axios';

// Buscar posições de uma track específica
const getPositionsByTrack = async (track: string) => {
  try {
    const response = await axios.get(`/api/positions/track/${track}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    return response.data;
  } catch (error) {
    console.error('Erro ao buscar posições:', error);
    throw error;
  }
};

// Listar todas as posições
const getAllPositions = async () => {
  try {
    const response = await axios.get('/api/positions', {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    return response.data;
  } catch (error) {
    console.error('Erro ao buscar posições:', error);
    throw error;
  }
};

// Buscar posição específica
const getPositionById = async (id: string) => {
  try {
    const response = await axios.get(`/api/positions/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    return response.data;
  } catch (error) {
    console.error('Erro ao buscar posição:', error);
    throw error;
  }
};

// Exemplo de uso
const handleLoadPositions = async () => {
  try {
    // Buscar posições de desenvolvimento
    const devPositions = await getPositionsByTrack('DESENVOLVIMENTO');
    console.log('Posições de desenvolvimento:', devPositions);

    // Buscar todas as posições
    const allPositions = await getAllPositions();
    console.log('Todas as posições:', allPositions);

    // Buscar posição específica
    const position = await getPositionById('position-uuid');
    console.log('Posição específica:', position);
  } catch (error) {
    console.error('Erro:', error);
  }
};
```

### Exemplo com Select/Dropdown

```typescript
const [positions, setPositions] = useState<Position[]>([]);
const [selectedTrack, setSelectedTrack] = useState<TrackType>('DESENVOLVIMENTO');

useEffect(() => {
  const loadPositions = async () => {
    try {
      const data = await getPositionsByTrack(selectedTrack);
      setPositions(data);
    } catch (error) {
      console.error('Erro ao carregar posições:', error);
    }
  };

  loadPositions();
}, [selectedTrack]);

return (
  <div>
    <select 
      value={selectedTrack} 
      onChange={(e) => setSelectedTrack(e.target.value as TrackType)}
    >
      <option value="DESENVOLVIMENTO">Desenvolvimento</option>
      <option value="DESIGN">Design</option>
      <option value="FINANCEIRO">Financeiro</option>
      <option value="COMITE">Comitê</option>
      <option value="RH">RH</option>
    </select>

    <select>
      {positions.map((position) => (
        <option key={position.id} value={position.id}>
          {position.name}
        </option>
      ))}
    </select>
  </div>
);
```

## Respostas da API

### Sucesso (200) - Lista de Posições
```json
[
  {
    "id": "pos1",
    "name": "Software Engineer",
    "track": "DESENVOLVIMENTO"
  },
  {
    "id": "pos4",
    "name": "QA Engineer",
    "track": "DESENVOLVIMENTO"
  }
]
```

### Sucesso (200) - Posição Individual
```json
{
  "id": "pos1",
  "name": "Software Engineer",
  "track": "DESENVOLVIMENTO"
}
```

### Erro (400) - Track Inválida
```json
{
  "statusCode": 400,
  "message": "Erro ao buscar posições da track INVALID_TRACK: [detalhes do erro]",
  "error": "Bad Request"
}
```

### Erro (400) - Posição Não Encontrada
```json
{
  "statusCode": 400,
  "message": "Posição não encontrada",
  "error": "Bad Request"
}
```

### Erro (401) - Não Autorizado
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### Erro (403) - Proibido
```json
{
  "statusCode": 403,
  "message": "Forbidden",
  "error": "Forbidden"
}
```

## Validações

### Track
- Deve ser um dos valores válidos: `DESENVOLVIMENTO`, `DESIGN`, `FINANCEIRO`, `COMITE`, `RH`
- Validação automática via enum

### ID
- Deve ser um UUID válido
- Validação automática via Prisma

## Ordenação

### Por Track
- Posições são ordenadas alfabeticamente por nome dentro de cada track

### Todas as Posições
- Primeiro ordenadas por track (alfabeticamente)
- Depois ordenadas por nome (alfabeticamente)

## Casos de Uso Comuns

1. **Formulários de Criação de Usuário**: Para selecionar a posição do usuário
2. **Filtros de Critérios**: Para filtrar critérios por posição/track
3. **Relatórios**: Para agrupar dados por track
4. **Dashboards**: Para mostrar estatísticas por área

## Integração com Outros Módulos

### Critérios de Avaliação
- As posições são usadas para associar critérios de avaliação
- Endpoint `/criterios-avaliacao` aceita `positionId` como filtro

### Usuários
- Cada usuário possui uma posição associada
- Usado para determinar critérios de avaliação aplicáveis

### Avaliações
- Critérios são filtrados baseados na posição do usuário avaliado 