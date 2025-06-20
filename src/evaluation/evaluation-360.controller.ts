import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Evaluation360Service } from './evaluation-360.service';
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
              email: { type: 'string' },
              role: { type: 'string' },
              position: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  track: { type: 'string' },
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
    const userId = req.user.sub; // JWT payload contém o userId no campo 'sub'
    return await this.evaluation360Service.buscarMembrosEquipe(userId);
  }

  @Get('team-members/:cycleId')
  @Roles('COLABORADOR', 'LIDER', 'RH', 'COMITE')
  @ApiOperation({
    summary: 'Buscar membros da equipe para avaliação 360 em um ciclo específico',
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
    const userId = req.user.sub;
    return await this.evaluation360Service.buscarMembrosEquipePorCiclo(
      userId,
      cycleId,
    );
  }
}
