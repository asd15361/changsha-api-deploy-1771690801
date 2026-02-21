import { Body, Controller, Get, Post } from '@nestjs/common';

type ReadNotificationsBody = {
  ids: string[];
};

@Controller('notifications')
export class NotificationsController {
  @Get()
  getNotifications(): {
    items: Array<{ id: string; type: string; message: string; createdAt: string; read: boolean }>;
  } {
    return {
      items: [
        {
          id: 'notify_mock_001',
          type: 'comment',
          message: '有人评论了你的帖子',
          createdAt: new Date().toISOString(),
          read: false,
        },
      ],
    };
  }

  @Post('read')
  markRead(@Body() body: ReadNotificationsBody): { success: boolean; ids: string[] } {
    return {
      success: true,
      ids: body.ids ?? [],
    };
  }
}
