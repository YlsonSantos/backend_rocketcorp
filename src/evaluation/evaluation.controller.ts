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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { EvaluationService } from './evaluation.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto';
import { Evaluation } from './entities/evaluation.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('avaliações')
@Controller('avaliacao')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService) {}

  @Post()
  @Roles('LIDER', 'RH', 'COMITE')
  @ApiOperation({ summary: 'Criar uma nova avaliação' })
  @ApiResponse({
    status: 201,
    description: 'Avaliação criada com sucesso',
    type: Evaluation,
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
  async criar(
    @Body() criarAvaliacaoDto: CreateEvaluationDto,
  ): Promise<Evaluation> {
    return await this.evaluationService.criar(criarAvaliacaoDto);
  }

  @Get()
  @Roles('LIDER', 'RH', 'COMITE')
  @ApiOperation({ summary: 'Buscar todas as avaliações' })
  @ApiResponse({
    status: 200,
    description: 'Lista de avaliações recuperada com sucesso',
    type: [Evaluation],
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Proibido - permissões insuficientes',
  })
  async buscarTodas(): Promise<Evaluation[]> {
    return await this.evaluationService.buscarTodas();
  }

  @Get(':id')
  @Roles('COLABORADOR', 'LIDER', 'RH', 'COMITE')
  @ApiOperation({ summary: 'Buscar avaliação por ID' })
  @ApiParam({ name: 'id', description: 'ID da avaliação', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Avaliação recuperada com sucesso',
    type: Evaluation,
  })
  @ApiResponse({
    status: 400,
    description: 'Requisição inválida - UUID inválido',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Avaliação não encontrada' })
  async buscarPorId(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Evaluation> {
    return await this.evaluationService.buscarPorId(id);
  }

  @Patch(':id')
  @Roles('LIDER', 'RH', 'COMITE')
  @ApiOperation({ summary: 'Atualizar avaliação por ID' })
  @ApiParam({ name: 'id', description: 'ID da avaliação', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Avaliação atualizada com sucesso',
    type: Evaluation,
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
  @ApiResponse({ status: 404, description: 'Avaliação não encontrada' })
  async atualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() atualizarAvaliacaoDto: UpdateEvaluationDto,
  ): Promise<Evaluation> {
    return await this.evaluationService.atualizar(id, atualizarAvaliacaoDto);
  }

  @Delete(':id')
  @Roles('LIDER', 'RH', 'COMITE')
  @ApiOperation({ summary: 'Deletar avaliação por ID' })
  @ApiParam({ name: 'id', description: 'ID da avaliação', type: 'string' })
  @ApiResponse({ status: 204, description: 'Avaliação deletada com sucesso' })
  @ApiResponse({
    status: 400,
    description: 'Requisição inválida - UUID inválido',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Proibido - permissões insuficientes',
  })
  @ApiResponse({ status: 404, description: 'Avaliação não encontrada' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remover(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return await this.evaluationService.remover(id);
  }
}
