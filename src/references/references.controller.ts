import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ReferencesService } from './references.service';
import { CreateReferenceDto } from './dto/create-reference.dto';
import { UpdateReferenceDto } from './dto/update-reference.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Request } from 'express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { Reference } from './entities/reference.entity';

@ApiTags('References')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('references')
export class ReferencesController {
  constructor(private readonly referencesService: ReferencesService) {}

  @Post()
  @Roles('COLABORADOR')
  @ApiOperation({
    summary: 'Create a new reference',
  })
  @ApiResponse({
    status: 201,
    description: 'Reference created',
    type: Reference,
  })
  create(@Req() req: Request, @Body() createReferenceDto: CreateReferenceDto) {
    const evaluatorId = (req.user as any)?.userId;
    return this.referencesService.create(createReferenceDto, evaluatorId);
  }

  @Get()
  @Roles('COLABORADOR')
  @ApiOperation({
    summary: 'Get all references',
  })
  @ApiResponse({
    status: 200,
    description: 'List of references',
    type: [Reference],
  })
  findAll() {
    return this.referencesService.findAll();
  }

  @Get(':id')
  @Roles('COLABORADOR')
  @ApiOperation({
    summary: 'Get a reference by ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Reference found',
    type: Reference,
  })
  findOne(@Param('id') id: string) {
    return this.referencesService.findOne(id);
  }

  @Patch(':id')
  @Roles('COLABORADOR')
  @ApiOperation({
    summary: 'Update a reference',
  })
  @ApiResponse({
    status: 200,
    description: 'Reference updated',
    type: Reference,
  })
  update(
    @Param('id') id: string,
    @Body() updateReferenceDto: UpdateReferenceDto,
  ) {
    return this.referencesService.update(id, updateReferenceDto);
  }

  @Delete(':id')
  @Roles('COLABORADOR')
  @ApiOperation({
    summary: 'Delete a reference',
  })
  @ApiResponse({
    status: 200,
    description: 'Reference deleted',
    type: Reference,
  })
  remove(@Param('id') id: string) {
    return this.referencesService.remove(id);
  }
}
