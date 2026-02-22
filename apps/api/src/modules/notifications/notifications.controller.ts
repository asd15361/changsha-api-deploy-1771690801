import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { requireUserIdFromAuthorizationHeader } from '../../common/auth';
import { NotificationsService } from './notifications.service';

type ReadNotificationsBody = {
  ids: string[];
};

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getNotifications(@Req() req: Request) {
    const userId = requireUserIdFromAuthorizationHeader(
      req.headers.authorization,
    );
    return this.notificationsService.getNotifications(userId);
  }

  @Post('read')
  markRead(@Req() req: Request, @Body() body: ReadNotificationsBody) {
    const userId = requireUserIdFromAuthorizationHeader(
      req.headers.authorization,
    );
    return this.notificationsService.markReadBatch(userId, body.ids ?? []);
  }
}
