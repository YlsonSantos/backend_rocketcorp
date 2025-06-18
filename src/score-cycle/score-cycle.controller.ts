import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ScoreService } from './score-cycle.service';
import { CreateScoreDto } from './dto/create-score-cycle.dto';
import { UpdateScoreDto } from './dto/update-score-cycle.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Score per Cycle')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('score-cycle')
export class ScoreCycleController {
  constructor(private readonly scoreCycleService: ScoreService) {}

  @Roles('LIDER', 'COLABORADOR')
  @Post()
  @ApiOperation({ summary: 'Cria um ScoreCycle' })
  @ApiResponse({ status: 201, description: 'Score criado com sucesso' })
  create(@Body() createScoreCycleDto: CreateScoreDto) {
    return this.scoreCycleService.create(createScoreCycleDto);
  }

  @Roles('COLABORADOR', 'LIDER', 'COMITE', 'RH')
  @Get()
  @ApiOperation({ summary: 'Lista todos os ScoreCycles' })
  @ApiResponse({
    status: 200,
    description: 'Lista de scores retornada com sucesso',
  })
  findAll() {
    return this.scoreCycleService.findAll();
  }

  @Roles('COLABORADOR', 'LIDER', 'COMITE', 'RH')
  @Get(':id')
  @ApiOperation({ summary: 'Busca um ScoreCycle por ID' })
  @ApiResponse({ status: 200, description: 'Score encontrado' })
  @ApiResponse({ status: 404, description: 'Score não encontrado' })
  findOne(@Param('id') id: string) {
    return this.scoreCycleService.findOne(id);
  }

  @Roles('LIDER', 'COMITE')
  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um ScoreCycle' })
  @ApiResponse({ status: 200, description: 'Score atualizado com sucesso' })
  update(@Param('id') id: string, @Body() updateScoreCycleDto: UpdateScoreDto) {
    return this.scoreCycleService.update(id, updateScoreCycleDto);
  }

  @Roles('RH')
  @Delete(':id')
  @ApiOperation({ summary: 'Remove um ScoreCycle por ID' })
  @ApiResponse({ status: 200, description: 'Score removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Score não encontrado' })
  remove(@Param('id') id: string) {
    return this.scoreCycleService.remove(id);
  }
}
