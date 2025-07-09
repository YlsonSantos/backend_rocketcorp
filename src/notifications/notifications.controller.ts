import {
  Controller,
  Get,
  Post,
  Param,
  Request,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface RequestWithUser extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getUserNotifications(
    @Request() req: RequestWithUser,
    @Query('unreadOnly') unreadOnly?: boolean,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.notificationsService.getUserNotifications(req.user.userId, {
      unreadOnly: unreadOnly === true,
      limit: limit ? parseInt(limit.toString()) : undefined,
      offset: offset ? parseInt(offset.toString()) : undefined,
    });
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req: RequestWithUser) {
    const count = await this.notificationsService.getUnreadCount(req.user.userId);
    return { count };
  }

  @Post('mark-as-read/:id')
  async markAsRead(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.notificationsService.markAsRead(id, req.user.userId);
  }

  @Post('mark-all-as-read')
  async markAllAsRead(@Request() req: RequestWithUser) {
    return this.notificationsService.markAllAsRead(req.user.userId);
  }

  @Post('test')
  @ApiOperation({ summary: 'Criar notificação de teste' })
  async createTestNotification(@Request() req: RequestWithUser) {
    return this.notificationsService.createNotification({
      userId: req.user.userId,
      type: 'SYSTEM_ANNOUNCEMENT',
      title: 'Notificação de Teste',
      message: 'Esta é uma notificação de teste criada em ' + new Date().toLocaleString(),
      priority: 'MEDIUM',
    });
  }
} 