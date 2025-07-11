import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  UseGuards,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { EvaluationCriteriaService } from './evaluation-criteria.service';
import { EvaluationCriterion } from './entities/evaluation-criterion.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { EvaluationCriterion as PrismaEvaluationCriterion } from '@prisma/client';
import { CreateNextCycleCriterionDto } from './dto/create-evaluation-criterion.dto';
import { QueryEvaluationCriteriaDto } from './dto/query-evaluation-criteria.dto';

@ApiTags('critérios de avaliação')
@Controller('criterios-avaliacao')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class EvaluationCriteriaController {
  constructor(
    private readonly evaluationCriteriaService: EvaluationCriteriaService,
  ) {}

  @Post('upsert')
  @Roles('RH')
  @ApiOperation({
    summary: 'Criar e atualizar critérios de avaliação simultaneamente',
    description:
      'Permite criar novos critérios e atualizar existentes em uma única operação. Critérios sem mudanças são identificados e reportados separadamente.',
  })
  @ApiResponse({
    status: 201,
    description: 'Operação de upsert concluída com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Upsert operation completed' },
        summary: {
          type: 'object',
          properties: {
            created: {
              type: 'number',
              example: 2,
              description: 'Critérios criados',
            },
            updated: {
              type: 'number',
              example: 3,
              description: 'Critérios atualizados',
            },
            unchanged: {
              type: 'number',
              example: 1,
              description: 'Critérios sem mudanças',
            },
            errors: {
              type: 'number',
              example: 0,
              description: 'Erros encontrados',
            },
          },
        },
        details: {
          type: 'object',
          properties: {
            created: {
              type: 'array',
              items: { $ref: '#/components/schemas/EvaluationCriterion' },
            },
            updated: {
              type: 'array',
              items: { $ref: '#/components/schemas/EvaluationCriterion' },
            },
            unchanged: {
              type: 'array',
              items: { $ref: '#/components/schemas/EvaluationCriterion' },
            },
            errors: { type: 'array', items: { type: 'object' } },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Requisição inválida - falha na validação dos dados',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Proibido - permissões insuficientes',
  })
  @HttpCode(HttpStatus.CREATED)
  async upsertCriteria(
    @Body()
    upsertDto: {
      create?: CreateNextCycleCriterionDto[];
      update?: (CreateNextCycleCriterionDto & { id: string })[];
    },
    @Req() req: any,
  ) {
    console.log('User object in upsert:', req.user);
    console.log('User role:', req.user?.role);
    return this.evaluationCriteriaService.upsertCriteria(upsertDto);
  }

  @Get()
  @Roles('RH')
  @ApiOperation({ summary: 'Listar critérios de avaliação com filtros' })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['GESTAO', 'EXECUCAO', 'COMPORTAMENTO', 'AV360', 'FROMETL'],
  })
  @ApiQuery({
    name: 'track',
    required: false,
    enum: ['DESENVOLVIMENTO', 'DESIGN', 'FINANCEIRO', 'COMITE', 'RH'],
  })
  @ApiQuery({ name: 'positionId', required: false })
  @ApiResponse({
    status: 200,
    description: 'Lista de critérios recuperada com sucesso',
    type: [EvaluationCriterion],
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Proibido - permissões insuficientes',
  })
  async findAll(
    @Query() query: QueryEvaluationCriteriaDto,
  ): Promise<PrismaEvaluationCriterion[]> {
    return await this.evaluationCriteriaService.findAll(query);
  }

  @Delete(':id/pos/:posid')
  @Roles('RH')
  @ApiOperation({ summary: 'Deletar critério por ID' })
  @ApiParam({ name: 'id', description: 'ID do critério', type: 'string' })
  @ApiParam({ name: 'posid', description: 'ID da posição', type: 'string' })
  @ApiResponse({ status: 204, description: 'Critério deletado com sucesso' })
  @ApiResponse({
    status: 400,
    description: 'Requisição inválida - UUID inválido ou erro interno',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Proibido - permissões insuficientes',
  })
  @ApiResponse({ status: 404, description: 'Critério não encontrado' })
  @ApiResponse({
    status: 409,
    description: 'Conflito - critério possui respostas associadas',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @Param('posid') posId: string,
  ): Promise<void> {
    return await this.evaluationCriteriaService.removeAssignmentsByTrack(
      id,
      posId,
    );
  }
}
