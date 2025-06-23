import { Controller, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';
//import { CreateUserDto } from './dto/create-user.dto';
//import { UpdateUserDto } from './dto/update-user.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /*
  @Post()
  @ApiOperation({ summary: 'Cria um novo usuário' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um usuário por ID' })
  @ApiResponse({ status: 200, description: 'Usuário encontrado' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um usuário' })
  @ApiResponse({ status: 200, description: 'Usuário atualizado com sucesso' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um usuário por ID' })
  @ApiResponse({ status: 200, description: 'Usuário removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }*/

  @Get()
  @ApiOperation({ summary: 'Lista todos os usuários do ciclo atual' })
  findAll() {
    return this.usersService.findAllCurrentCycle();
  }

  @Get(':id/evaluationsPerCycle')
  @ApiOperation({
    summary: 'Lista os ciclos passados com nota e o ciclo aberto sem nota',
  })
  findCompletedEvaluations(@Param('id') id: string) {
    return this.usersService.findEvaluationsByCycle(id);
  }

  @Get(':id/evolutions')
  @ApiOperation({
    summary: 'Lista as notas do usuário por ciclo para página de resultados',
  })
  findEvolutions(@Param('id') id: string) {
    return this.usersService.findEvolutionsByUserId(id);
  }

  @Get(':id/findAutoavaliation')
  @ApiOperation({
    summary: 'Busca a autoavaliação do usuário para gestor preencher',
  })
  findAutoavaliation(@Param('id') id: string) {
    return this.usersService.findAutoavaliationByUserId(id);
  }
}
