import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NotificationSettingsService } from './notification-settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import {
  CreateNotificationSettingDto,
  UpdateNotificationSettingDto,
} from './dto/notification-settings.dto';

@ApiTags('Notification Settings - RH')
@Controller('notification-settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class NotificationSettingsController {
  constructor(private readonly settingsService: NotificationSettingsService) {}

  @Post('cycles/:cycleId')
  @Roles(Role.RH, Role.COMITE)
  @ApiOperation({ summary: 'Configurar notificação para um ciclo' })
  async createSetting(
    @Param('cycleId') cycleId: string,
    @Body() createDto: CreateNotificationSettingDto,
  ) {
    return this.settingsService.createSetting(cycleId, createDto);
  }

  @Get('cycles/:cycleId')
  @ApiOperation({ summary: 'Listar configurações de notificação do ciclo' })
  async getSettings(@Param('cycleId') cycleId: string) {
    return this.settingsService.getSettings(cycleId);
  }

  @Put('cycles/:cycleId/:notificationType')
  @Roles(Role.RH, Role.COMITE)
  @ApiOperation({ summary: 'Atualizar configuração de notificação' })
  async updateSetting(
    @Param('cycleId') cycleId: string,
    @Param('notificationType') notificationType: string,
    @Body() updateDto: UpdateNotificationSettingDto,
  ) {
    return this.settingsService.updateSetting(cycleId, notificationType, updateDto);
  }

  @Delete('cycles/:cycleId/:notificationType')
  @Roles(Role.RH, Role.COMITE)
  @ApiOperation({ summary: 'Remover configuração de notificação' })
  async deleteSetting(
    @Param('cycleId') cycleId: string,
    @Param('notificationType') notificationType: string,
  ) {
    return this.settingsService.deleteSetting(cycleId, notificationType);
  }

  @Post('cycles/:cycleId/test')
  @Roles(Role.RH, Role.COMITE)
  @ApiOperation({ summary: 'Testar notificações do ciclo' })
  async testNotifications(@Param('cycleId') cycleId: string) {
    return this.settingsService.testNotifications(cycleId);
  }
} 