import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { SurveyService } from './survey.service';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { CreateSurveyResponseDto } from './dto/create-survey-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UpdateSurveyDto } from './dto/update-survey.dto';

@ApiTags('Surveys')
@Controller('survey')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class SurveyController {
  constructor(private readonly surveyService: SurveyService) {}

  @Post()
  @Roles('RH')
  create(@Body() createSurveyDto: CreateSurveyDto) {
    return this.surveyService.createSurvey(createSurveyDto);
  }

  @Post(':id/setActive')
  @Roles('RH')
  setActive(@Param('id') id: string) {
    return this.surveyService.setActive(id);
  }

  @Patch(':id')
  @Roles('RH')
  update(@Param('id') id: string, @Body() updateSurveyDto: UpdateSurveyDto) {
    return this.surveyService.update(id, updateSurveyDto);
  }

  @Roles('COLABORADOR')
  @Post('response')
  createResponse(@Body() createSurveyResponseDto: CreateSurveyResponseDto) {
    return this.surveyService.createSurveyResponse(createSurveyResponseDto);
  }

  @Roles('RH', 'LIDER')
  @Get()
  findAll() {
    return this.surveyService.findAll();
  }

  @Roles('COLABORADOR')
  @Get(':id/findNewestSurveys')
  findOne(@Param('id') id: string) {
    return this.surveyService.findByCurrentCycle(id);
  }

  @Roles('RH')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.surveyService.delete(id);
  }
}
