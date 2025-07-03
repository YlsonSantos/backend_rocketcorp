import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  UseGuards,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  Query,
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
import { CreateEvaluationCriterionDto, UpdateEvaluationCriterionBulkDto } from './dto/create-evaluation-criterion.dto';
import { UpdateEvaluationCriterionDto } from './dto/update-evaluation-criterion.dto';
import { QueryEvaluationCriteriaDto } from './dto/query-evaluation-criteria.dto';
import { EvaluationCriterion } from './entities/evaluation-criterion.entity';
import { CriteriaAssignment } from './entities/criteria-assignment.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
  EvaluationCriterion as PrismaEvaluationCriterion,
  CriteriaAssignment as PrismaCriteriaAssignment,
} from '@prisma/client';

@ApiTags('critérios de avaliação')
@Controller('criterios-avaliacao')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class EvaluationCriteriaController {
  constructor(
    private readonly evaluationCriteriaService: EvaluationCriteriaService,
  ) {}

  @Post()
  @Roles('RH')
  @ApiOperation({ summary: 'Criar um novo critério de avaliação' })
  @ApiResponse({
    status: 201,
    description: 'Critério criado com sucesso',
    type: EvaluationCriterion,
  })
  @ApiResponse({
    status: 400,
    description: 'Requisição inválida - falha na validação',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Proibido - permissões insuficientes',
  })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createDto: CreateEvaluationCriterionDto,
  ): Promise<PrismaEvaluationCriterion> {
    return await this.evaluationCriteriaService.create(createDto);
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

  @Get('position/:positionId')
  @Roles('RH')
  @ApiOperation({ summary: 'Buscar critérios por posição' })
  @ApiParam({
    name: 'positionId',
    description: 'ID da posição',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Critérios da posição recuperados com sucesso',
    type: [EvaluationCriterion],
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Proibido - permissões insuficientes',
  })
  async findByPosition(
    @Param('positionId', ParseUUIDPipe) positionId: string,
  ): Promise<PrismaEvaluationCriterion[]> {
    return await this.evaluationCriteriaService.findByPosition(positionId);
  }

  @Get('track/:track')
  @Roles('RH')
  @ApiOperation({ summary: 'Buscar critérios por track' })
  @ApiParam({
    name: 'track',
    description: 'Track (DESENVOLVIMENTO, DESIGN, FINANCEIRO, COMITE, RH)',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Critérios do track recuperados com sucesso',
    type: [EvaluationCriterion],
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Proibido - permissões insuficientes',
  })
  async findByTrack(
    @Param('track') track: string,
  ): Promise<PrismaEvaluationCriterion[]> {
    return await this.evaluationCriteriaService.findByTrack(track);
  }

  @Get(':id')
  @Roles('RH')
  @ApiOperation({ summary: 'Buscar critério por ID' })
  @ApiParam({ name: 'id', description: 'ID do critério', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Critério recuperado com sucesso',
    type: EvaluationCriterion,
  })
  @ApiResponse({
    status: 400,
    description: 'Requisição inválida - UUID inválido',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Critério não encontrado' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PrismaEvaluationCriterion> {
    return await this.evaluationCriteriaService.findOne(id);
  }

  @Patch(':id')
  @Roles('RH')
  @ApiOperation({ summary: 'Atualizar critério por ID' })
  @ApiParam({ name: 'id', description: 'ID do critério', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Critério atualizado com sucesso',
    type: EvaluationCriterion,
  })
  @ApiResponse({
    status: 400,
    description: 'Requisição inválida - falha na validação',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Proibido - permissões insuficientes',
  })
  @ApiResponse({ status: 404, description: 'Critério não encontrado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateEvaluationCriterionDto,
  ): Promise<PrismaEvaluationCriterion> {
    return await this.evaluationCriteriaService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('RH')
  @ApiOperation({ summary: 'Deletar critério por ID' })
  @ApiParam({ name: 'id', description: 'ID do critério', type: 'string' })
  @ApiResponse({ status: 204, description: 'Critério deletado com sucesso' })
  @ApiResponse({
    status: 400,
    description: 'Requisição inválida - UUID inválido',
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
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return await this.evaluationCriteriaService.remove(id);
  }

  @Post(':criterionId/assignments')
  @Roles('RH')
  @ApiOperation({ summary: 'Criar atribuição para um critério' })
  @ApiParam({
    name: 'criterionId',
    description: 'ID do critério',
    type: 'string',
  })
  @ApiResponse({
    status: 201,
    description: 'Atribuição criada com sucesso',
    type: CriteriaAssignment,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Proibido - permissões insuficientes',
  })
  @ApiResponse({ status: 404, description: 'Critério não encontrado' })
  @ApiResponse({
    status: 409,
    description: 'Conflito - atribuição já existe',
  })
  @HttpCode(HttpStatus.CREATED)
  async createAssignment(
    @Param('criterionId', ParseUUIDPipe) criterionId: string,
    @Body()
    assignmentData: {
      positionId: string;
      isRequired?: boolean;
    },
  ): Promise<PrismaCriteriaAssignment> {
    return await this.evaluationCriteriaService.createAssignment(
      criterionId,
      assignmentData,
    );
  }

  @Patch('assignments/:assignmentId')
  @Roles('RH')
  @ApiOperation({ summary: 'Atualizar atribuição' })
  @ApiParam({
    name: 'assignmentId',
    description: 'ID da atribuição',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Atribuição atualizada com sucesso',
    type: CriteriaAssignment,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Proibido - permissões insuficientes',
  })
  @ApiResponse({ status: 404, description: 'Atribuição não encontrada' })
  async updateAssignment(
    @Param('assignmentId', ParseUUIDPipe) assignmentId: string,
    @Body() updateData: { isRequired?: boolean },
  ): Promise<PrismaCriteriaAssignment> {
    return await this.evaluationCriteriaService.updateAssignment(
      assignmentId,
      updateData,
    );
  }

  @Delete('assignments/:assignmentId')
  @Roles('RH')
  @ApiOperation({ summary: 'Deletar atribuição' })
  @ApiParam({
    name: 'assignmentId',
    description: 'ID da atribuição',
    type: 'string',
  })
  @ApiResponse({ status: 204, description: 'Atribuição deletada com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Proibido - permissões insuficientes',
  })
  @ApiResponse({ status: 404, description: 'Atribuição não encontrada' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeAssignment(
    @Param('assignmentId', ParseUUIDPipe) assignmentId: string,
  ): Promise<void> {
    return await this.evaluationCriteriaService.removeAssignment(assignmentId);
  }

  @Post('bulk')
  @Roles('RH')
  @ApiOperation({
    summary: 'Criar múltiplos critérios de avaliação de uma vez',
  })
  @ApiResponse({
    status: 201,
    description: 'Critérios criados com sucesso',
    type: [EvaluationCriterion],
  })
  @ApiResponse({
    status: 400,
    description: 'Requisição inválida - falha na validação',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Proibido - permissões insuficientes',
  })
  @HttpCode(HttpStatus.CREATED)
  async createBulk(
    @Body() createDtos: CreateEvaluationCriterionDto[],
  ): Promise<PrismaEvaluationCriterion[]> {
    return await this.evaluationCriteriaService.createBulk(createDtos);
  }

  @Patch('bulk')
  @Roles('RH')
  @ApiOperation({
    summary: 'Atualizar múltiplos critérios de avaliação de uma vez',
  })
  @ApiResponse({
    status: 200,
    description: 'Critérios atualizados com sucesso',
    type: [EvaluationCriterion],
  })
  @ApiResponse({
    status: 400,
    description: 'Requisição inválida - falha na validação',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Proibido - permissões insuficientes',
  })
  @ApiResponse({
    status: 404,
    description: 'Um ou mais critérios não encontrados',
  })
  async updateBulk(
    @Body() updateDtos: UpdateEvaluationCriterionBulkDto[],
  ): Promise<PrismaEvaluationCriterion[]> {
    return await this.evaluationCriteriaService.updateBulk(updateDtos);
  }
}
