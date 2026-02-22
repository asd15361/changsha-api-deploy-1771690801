import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { requireUserIdFromAuthorizationHeader } from '../../common/auth';
import { MessagesService } from './messages.service';

type CreateConversationBody = {
  targetUserId: string;
};

type SendMessageBody = {
  content: string;
};

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('conversations')
  listConversations(@Req() req: Request) {
    const userId = requireUserIdFromAuthorizationHeader(req.headers.authorization);
    return this.messagesService.listConversations(userId);
  }

  @Post('conversations')
  createConversation(@Req() req: Request, @Body() body: CreateConversationBody) {
    const userId = requireUserIdFromAuthorizationHeader(req.headers.authorization);
    return this.messagesService.createOrGetDm(userId, body.targetUserId);
  }

  @Get('conversations/:conversationId')
  listMessages(
    @Req() req: Request,
    @Param('conversationId') conversationId: string,
    @Query('cursor') cursor?: string,
  ) {
    const userId = requireUserIdFromAuthorizationHeader(req.headers.authorization);
    return this.messagesService.listMessages(userId, conversationId, cursor);
  }

  @Post('conversations/:conversationId')
  sendMessage(
    @Req() req: Request,
    @Param('conversationId') conversationId: string,
    @Body() body: SendMessageBody,
  ) {
    const userId = requireUserIdFromAuthorizationHeader(req.headers.authorization);
    return this.messagesService.sendMessage(userId, conversationId, body.content ?? '');
  }

  @Post('conversations/:conversationId/read')
  markRead(@Req() req: Request, @Param('conversationId') conversationId: string) {
    const userId = requireUserIdFromAuthorizationHeader(req.headers.authorization);
    return this.messagesService.markConversationRead(userId, conversationId);
  }
}
