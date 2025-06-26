import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { MentoringService } from './mentoring.service';
import { CreateMentoringDto } from './dto/create-mentoring.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';

@ApiTags('Mentoring')
@Controller('mentoring')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class MentoringController {
  constructor(private readonly mentoringService: MentoringService) {}

  @Post()
  @Roles('COLABORADOR')
  @ApiOperation({ summary: 'Cria uma avaliação de mentoria' })
  @ApiResponse({ status: 201, description: 'Avaliação criada com sucesso' })
  @ApiResponse({ status: 409, description: 'Avaliação duplicada' })
  create(@Body() dto: CreateMentoringDto) {
    return this.mentoringService.create(dto);
  }

  /*
  @Get()
  @ApiOperation({ summary: 'Lista todas as avaliações de mentoria' })
  @ApiResponse({ status: 200, description: 'Lista de avaliações' })
  findAll() {
    return this.mentoringService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma avaliação de mentoria por ID' })
  @ApiResponse({ status: 200, description: 'Avaliação encontrada' })
  findOne(@Param('id') id: string) {
    return this.mentoringService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove uma avaliação de mentoria por ID' })
  @ApiResponse({ status: 200, description: 'Avaliação removida com sucesso' })
  remove(@Param('id') id: string) {
    return this.mentoringService.remove(id);
  }*/
}
