import {
  Controller,
  Get,
  Param,
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
import { PositionsService } from './positions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { TrackType } from '@prisma/client';

@ApiTags('posições')
@Controller('positions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class PositionsController {
  constructor(private readonly positionsService: PositionsService) {}

  @Get('track/:track')
  @Roles('RH')
  @ApiOperation({
    summary: 'Buscar posições por track',
    description: 'Retorna todas as posições de uma track específica',
  })
  @ApiParam({
    name: 'track',
    description: 'Track das posições',
    enum: TrackType,
    example: 'DESENVOLVIMENTO',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de posições recuperada com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'position-uuid' },
          name: { type: 'string', example: 'Software Engineer' },
          track: { type: 'string', example: 'DESENVOLVIMENTO' },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Requisição inválida - track inválida ou erro interno',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Proibido - permissões insuficientes',
  })
  @HttpCode(HttpStatus.OK)
  async findByTrack(@Param('track') track: TrackType) {
    return await this.positionsService.findByTrack(track);
  }

  @Get()
  @Roles('RH')
  @ApiOperation({
    summary: 'Listar todas as posições',
    description: 'Retorna todas as posições organizadas por track',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de posições recuperada com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'position-uuid' },
          name: { type: 'string', example: 'Software Engineer' },
          track: { type: 'string', example: 'DESENVOLVIMENTO' },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Requisição inválida - erro interno',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Proibido - permissões insuficientes',
  })
  @HttpCode(HttpStatus.OK)
  async findAll() {
    return await this.positionsService.findAll();
  }

  @Get(':id')
  @Roles('RH')
  @ApiOperation({
    summary: 'Buscar posição por ID',
    description: 'Retorna uma posição específica pelo ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da posição',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Posição recuperada com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'position-uuid' },
        name: { type: 'string', example: 'Software Engineer' },
        track: { type: 'string', example: 'DESENVOLVIMENTO' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Requisição inválida - posição não encontrada ou erro interno',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Proibido - permissões insuficientes',
  })
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    return await this.positionsService.findOne(id);
  }
}
