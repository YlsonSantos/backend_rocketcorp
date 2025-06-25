import { Controller, Post, Body } from '@nestjs/common';
import { MentoringService } from './mentoring.service';
import { CreateMentoringDto } from './dto/create-mentoring.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Mentoring')
@Controller('mentoring')
export class MentoringController {
  constructor(private readonly mentoringService: MentoringService) {}

  @Post()
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
