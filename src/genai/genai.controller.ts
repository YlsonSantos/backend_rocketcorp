import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { GenaiService } from './genai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { GenerateInsightDto } from './dto/generate-insight.dto';

@ApiTags('genai-insights')
@Controller('genai')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class GenaiController {
  constructor(private readonly genaiService: GenaiService) {}

  @Post('insights/generate')
  @Roles('RH', 'COMITE', 'LIDER')
  @ApiOperation({
    summary:
      'Gerar resumo automático via GenAI para equalização de colaborador',
  })
  @ApiResponse({
    status: 201,
    description: 'Resumo GenAI gerado com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        cycleId: { type: 'string' },
        evaluatedId: { type: 'string' },
        summary: { type: 'string' },
        discrepancies: { type: 'string' },
        brutalFacts: { type: 'string' },
        createdAt: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Permissões insuficientes' })
  async gerarResumo(@Body() generateInsightDto: GenerateInsightDto) {
    return await this.genaiService.gerarResumoColaborador(
      generateInsightDto.cycleId,
      generateInsightDto.evaluatedId,
    );
  }

  @Get('insights/cycle/:cycleId')
  @Roles('RH', 'COMITE', 'LIDER')
  @ApiOperation({ summary: 'Buscar resumos GenAI por ciclo' })
  @ApiParam({ name: 'cycleId', description: 'ID do ciclo de avaliação' })
  @ApiResponse({
    status: 200,
    description: 'Resumos do ciclo recuperados com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          evaluatedId: { type: 'string' },
          evaluatedName: { type: 'string' },
          summary: { type: 'string' },
          discrepancies: { type: 'string' },
          brutalFacts: { type: 'string' },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Ciclo não encontrado' })
  async buscarResumosPorCiclo(@Param('cycleId') cycleId: string) {
    return await this.genaiService.buscarResumosPorCiclo(cycleId);
  }

  @Get('insights/user/:userId/cycle/:cycleId')
  @Roles('RH', 'COMITE', 'LIDER', 'COLABORADOR')
  @ApiOperation({ summary: 'Buscar resumo GenAI específico de um colaborador' })
  @ApiParam({ name: 'userId', description: 'ID do colaborador' })
  @ApiParam({ name: 'cycleId', description: 'ID do ciclo de avaliação' })
  @ApiResponse({
    status: 200,
    description: 'Resumo do colaborador recuperado com sucesso',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Resumo não encontrado' })
  async buscarResumoColaborador(
    @Param('userId') userId: string,
    @Param('cycleId') cycleId: string,
  ) {
    return await this.genaiService.buscarResumoColaborador(userId, cycleId);
  }

  @Post('insights/batch/cycle/:cycleId')
  @Roles('RH', 'COMITE')
  @ApiOperation({
    summary: 'Gerar resumos para todos os colaboradores de um ciclo',
  })
  @ApiParam({ name: 'cycleId', description: 'ID do ciclo de avaliação' })
  @ApiResponse({
    status: 201,
    description: 'Resumos em lote gerados com sucesso',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        generated: { type: 'number' },
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              userId: { type: 'string' },
              success: { type: 'boolean' },
              insightId: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async gerarResumosEmLote(@Param('cycleId') cycleId: string) {
    return await this.genaiService.gerarResumosEmLote(cycleId);
  }

  @Post('test-gemini')
  @Roles('RH', 'COMITE', 'LIDER')
  @ApiOperation({
    summary: 'Testar conexão com Gemini AI',
  })
  @ApiResponse({
    status: 200,
    description: 'Teste realizado com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        response: { type: 'string' },
      },
    },
  })
  async testarGemini() {
    return await this.genaiService.testarConexaoGemini();
  }
}
