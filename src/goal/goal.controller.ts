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
import { CreateGoalActionDto } from './dto/create-goal-action.dto';
import { UpdateGoalActionDto } from './dto/update-goal-action.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Goal, GoalAction } from './entities/goal.entity';
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
  createGoal(@Body() createGoalDto: CreateGoalDto, @Req() req: any) {
    const userId = req.user.userId;
    return this.goalService.createGoal(createGoalDto, userId);
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
  updateGoal(@Param('id') id: string, @Body() updateGoalDto: UpdateGoalDto) {
    return this.goalService.updateGoal(id, updateGoalDto);
  }

  @Delete(':id')
  @Roles('COLABORADOR', 'LIDER')
  @ApiOperation({ summary: 'Remove um objetivo existente.' })
  @ApiParam({ name: 'id', description: 'ID do goal' })
  @ApiResponse({ status: 200, description: 'Goal removido', type: Goal })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Goal não encontrado' })
  removeGoal(@Param('id') id: string) {
    return this.goalService.removeGoal(id);
  }

  @Post(':id')
  @Roles('COLABORADOR')
  @ApiOperation({ summary: 'Cria uma ação para um objetivo.' })
  @ApiParam({ name: 'id', description: 'ID do goal' })
  @ApiBody({ type: CreateGoalActionDto })
  @ApiResponse({
    status: 201,
    description: 'Ação criada com sucesso',
    type: GoalAction,
  })
  createGoalAction(
    @Body() createGoalActionDto: CreateGoalActionDto,
    @Param('id') id: string,
  ) {
    return this.goalService.createGoalAction(createGoalActionDto, id);
  }

  @Patch(':id/actions')
  @Roles('COLABORADOR')
  @ApiOperation({ summary: 'Atualiza uma ação de um objetivo.' })
  @ApiParam({ name: 'id', description: 'ID do goal' })
  @ApiBody({ type: UpdateGoalActionDto })
  @ApiResponse({
    status: 200,
    description: 'Ação atualizada com sucesso',
    type: GoalAction,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Goal não encontrado' })
  updateGoalAction(
    @Body() updateGoalActionDto: UpdateGoalActionDto,
    @Param('id') id: string,
  ) {
    return this.goalService.updateGoalAction(updateGoalActionDto, id);
  }

  @Delete(':id/actions')
  @Roles('COLABORADOR')
  @ApiOperation({ summary: 'Remove uma ação de um objetivo.' })
  @ApiParam({ name: 'id', description: 'ID do goal' })
  @ApiResponse({
    status: 200,
    description: 'Ação removida com sucesso',
    type: GoalAction,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Goal não encontrado' })
  removeGoalAction(@Param('id') id: string) {
    return this.goalService.removeGoalAction(id);
  }
}
