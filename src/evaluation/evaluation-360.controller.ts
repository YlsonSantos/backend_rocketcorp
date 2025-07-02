import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { Evaluation360Service } from './evaluation-360.service';
import { CreateEvaluation360Dto } from './dto/create-evaluation-360.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('avaliação-360')
@Controller('avaliacao-360')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class Evaluation360Controller {
  constructor(private readonly evaluation360Service: Evaluation360Service) {}

  @Get('team-members')
  @Roles('COLABORADOR', 'LIDER', 'RH', 'COMITE')
  @ApiOperation({ summary: 'Buscar membros da equipe para avaliação 360' })
  @ApiResponse({
    status: 200,
    description: 'Membros da equipe recuperados com sucesso',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
          },
        },
        team: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
          },
        },
        members: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              position: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                },
              },
              hasEvaluation: { type: 'boolean' },
              evaluationStatus: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({
    status: 404,
    description: 'Usuário não encontrado ou não pertence a nenhuma equipe',
  })
  async buscarMembrosEquipe(@Req() req: any) {
    const userId = req.user.userId; // JWT strategy retorna 'userId', não 'sub'
    return await this.evaluation360Service.buscarMembrosEquipe(userId);
  }

  @Get('team-members/:cycleId')
  @Roles('COLABORADOR', 'LIDER', 'RH', 'COMITE')
  @ApiOperation({
    summary:
      'Buscar membros da equipe para avaliação 360 em um ciclo específico',
  })
  @ApiParam({ name: 'cycleId', description: 'ID do ciclo de avaliação' })
  @ApiResponse({
    status: 200,
    description: 'Membros da equipe para o ciclo recuperados com sucesso',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Ciclo não encontrado' })
  async buscarMembrosEquipePorCiclo(
    @Req() req: any,
    @Param('cycleId') cycleId: string,
  ) {
    const userId = req.user.userId; // JWT strategy retorna 'userId', não 'sub'
    return await this.evaluation360Service.buscarMembrosEquipePorCiclo(
      userId,
      cycleId,
    );
  }

  @Post()
  @Roles('COLABORADOR', 'LIDER', 'RH', 'COMITE')
  @ApiOperation({
    summary: 'Criar uma avaliação 360 peer',
    description:
      'Cria uma avaliação 360 do tipo PEER usando o formato padrão CreateEvaluationDto. Aceita apenas um critério (360_evaluation) no array answers.',
  })
  @ApiBody({
    type: CreateEvaluation360Dto,
    description: 'Dados da avaliação 360 no formato padrão',
    examples: {
      peerEvaluation: {
        summary: 'Avaliação peer com formato padrão',
        value: {
          cycleId: 'cycle2025_1',
          evaluatedId: 'user2',
          completed: true,
          strongPoints: 'Excelente comunicação e liderança de equipe',
          weakPoints: 'Pode melhorar a gestão de tempo em projetos complexos',
          answers: [
            {
              criterionId: '360_evaluation',
              score: 4,
              justification: 'Excelente trabalho em equipe e comunicação',
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Avaliação 360 peer criada com sucesso',
  })
  @ApiResponse({
    status: 400,
    description:
      'Requisição inválida - falha na validação ou regras de negócio',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Proibido - permissões insuficientes',
  })
  @HttpCode(HttpStatus.CREATED)
  async criarAvaliacao360(
    @Body() createEvaluation360Dto: CreateEvaluation360Dto,
    @Req() req: any,
  ) {
    const evaluatorId = req.user.userId;

    // Buscar primeiro o critério 360 para validar
    const criterio360 = await this.evaluation360Service.buscarCriterio360();
    if (!criterio360) {
      throw new BadRequestException('Critério 360 não encontrado');
    }

    // Validar que o critério é o 360 (aceitar tanto o ID hardcoded quanto o ID real)
    const answer = createEvaluation360Dto.answers[0];
    if (
      answer.criterionId !== '360_evaluation' &&
      answer.criterionId !== criterio360.id
    ) {
      throw new BadRequestException(
        `Para avaliações 360, o criterionId deve ser "360_evaluation" ou "${criterio360.id}"`,
      );
    }

    return await this.evaluation360Service.criarAvaliacaoPeerPadrao(
      evaluatorId,
      createEvaluation360Dto,
    );
  }

  @Get('criterio-360')
  @Roles('COLABORADOR', 'LIDER', 'RH', 'COMITE')
  @ApiOperation({
    summary: 'Buscar critério específico da avaliação 360',
    description: 'Retorna o critério 360_evaluation usado nas avaliações 360',
  })
  @ApiResponse({
    status: 200,
    description: 'Critério 360 recuperado com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        type: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Critério 360 não encontrado' })
  @HttpCode(HttpStatus.OK)
  async buscarCriterio360() {
    try {
      const resultado = await this.evaluation360Service.buscarCriterio360();
      return resultado;
    } catch (error) {
      throw error;
    }
  }

  @Get(':id')
  @Roles('COLABORADOR', 'LIDER', 'RH', 'COMITE')
  @ApiOperation({
    summary: 'Buscar avaliação 360 por ID',
    description:
      'Retorna os detalhes de uma avaliação 360 específica incluindo respostas',
  })
  @ApiParam({ name: 'id', description: 'ID da avaliação 360', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Avaliação 360 recuperada com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Requisição inválida - UUID inválido',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Avaliação 360 não encontrada' })
  async buscarAvaliacao360PorId(@Param('id') id: string) {
    return await this.evaluation360Service.buscarAvaliacao360PorId(id);
  }
}
