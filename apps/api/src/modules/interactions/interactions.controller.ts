import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { requireUserIdFromAuthorizationHeader } from '../../common/auth';
import { InteractionsService } from './interactions.service';

type CommentBody = {
  content: string;
};

type RepostBody = {
  quoteText?: string;
};

@Controller()
export class InteractionsController {
  constructor(private readonly interactionsService: InteractionsService) {}

  @Get('posts/:postId/comments')
  getComments(@Param('postId') postId: string) {
    return this.interactionsService.getComments(postId);
  }

  @Post('posts/:postId/comments')
  createComment(
    @Req() req: Request,
    @Param('postId') postId: string,
    @Body() body: CommentBody,
  ) {
    const userId = requireUserIdFromAuthorizationHeader(
      req.headers.authorization,
    );
    return this.interactionsService.createComment(postId, userId, body.content);
  }

  @Delete('comments/:commentId')
  deleteComment(@Req() req: Request, @Param('commentId') commentId: string) {
    const userId = requireUserIdFromAuthorizationHeader(
      req.headers.authorization,
    );
    return this.interactionsService.deleteComment(commentId, userId);
  }

  @Post('posts/:postId/like')
  likePost(@Req() req: Request, @Param('postId') postId: string) {
    const userId = requireUserIdFromAuthorizationHeader(
      req.headers.authorization,
    );
    return this.interactionsService.likePost(postId, userId);
  }

  @Delete('posts/:postId/like')
  unlikePost(@Req() req: Request, @Param('postId') postId: string) {
    const userId = requireUserIdFromAuthorizationHeader(
      req.headers.authorization,
    );
    return this.interactionsService.unlikePost(postId, userId);
  }

  @Post('posts/:postId/repost')
  repostPost(
    @Req() req: Request,
    @Param('postId') postId: string,
    @Body() body: RepostBody,
  ) {
    const userId = requireUserIdFromAuthorizationHeader(
      req.headers.authorization,
    );
    return this.interactionsService.repostPost(postId, userId, body.quoteText);
  }
}
