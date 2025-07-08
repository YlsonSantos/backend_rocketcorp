import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { GoalService } from './goal.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Goal } from './entities/goal.entity';
import {
  ApiTags,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiOperation,
} from '@nestjs/swagger';

@ApiTags('Goal')
@Controller('goal')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class GoalController {
  constructor(private readonly goalService: GoalService) {}

  @Post()
  @Roles('COLABORADOR')
  @ApiOperation({
    summary: 'Cria um novo objetivo para o usuário autenticado.',
  })
  @ApiBody({ type: CreateGoalDto })
  @ApiResponse({
    status: 201,
    description: 'Goal criado com sucesso',
    type: Goal,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  create(@Body() createGoalDto: CreateGoalDto, @Req() req: any) {
    const userId = req.user.userId;
    return this.goalService.create(createGoalDto, userId);
  }

  @Get(':userId')
  @Roles('COLABORADOR', 'LIDER')
  @ApiOperation({ summary: 'Lista todos os objetivos de um usuário.' })
  @ApiParam({ name: 'userId', description: 'ID do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Lista de goals do usuário',
    type: [Goal],
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  findFromUser(@Param('userId') userId: string) {
    return this.goalService.findFromUser(userId);
  }

  @Patch(':id')
  @Roles('COLABORADOR', 'LIDER')
  @ApiOperation({ summary: 'Atualiza um objetivo existente.' })
  @ApiParam({ name: 'id', description: 'ID do goal' })
  @ApiBody({ type: UpdateGoalDto })
  @ApiResponse({ status: 200, description: 'Goal atualizado', type: Goal })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Goal não encontrado' })
  update(@Param('id') id: string, @Body() updateGoalDto: UpdateGoalDto) {
    return this.goalService.update(id, updateGoalDto);
  }

  @Delete(':id')
  @Roles('COLABORADOR', 'LIDER')
  @ApiOperation({ summary: 'Remove um objetivo existente.' })
  @ApiParam({ name: 'id', description: 'ID do goal' })
  @ApiResponse({ status: 200, description: 'Goal removido', type: Goal })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Goal não encontrado' })
  remove(@Param('id') id: string) {
    return this.goalService.remove(id);
  }
}
