import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';

type CommentBody = {
  content: string;
};

type RepostBody = {
  quoteText?: string;
};

@Controller()
export class InteractionsController {
  @Get('posts/:postId/comments')
  getComments(@Param('postId') postId: string): {
    postId: string;
    items: Array<{ id: string; authorId: string; content: string; createdAt: string }>;
  } {
    return {
      postId,
      items: [
        {
          id: 'comment_mock_001',
          authorId: 'user_mock_004',
          content: '收到，已关注活动。',
          createdAt: new Date().toISOString(),
        },
      ],
    };
  }

  @Post('posts/:postId/comments')
  createComment(
    @Param('postId') postId: string,
    @Body() body: CommentBody,
  ): { success: boolean; postId: string; commentId: string; content: string } {
    return {
      success: true,
      postId,
      commentId: 'comment_mock_002',
      content: body.content,
    };
  }

  @Delete('comments/:commentId')
  deleteComment(@Param('commentId') commentId: string): { success: boolean; commentId: string } {
    return { success: true, commentId };
  }

  @Post('posts/:postId/like')
  likePost(@Param('postId') postId: string): { success: boolean; postId: string } {
    return { success: true, postId };
  }

  @Delete('posts/:postId/like')
  unlikePost(@Param('postId') postId: string): { success: boolean; postId: string } {
    return { success: true, postId };
  }

  @Post('posts/:postId/repost')
  repostPost(
    @Param('postId') postId: string,
    @Body() body: RepostBody,
  ): { success: boolean; postId: string; repostId: string; quoteText: string | null } {
    return {
      success: true,
      postId,
      repostId: 'repost_mock_001',
      quoteText: body.quoteText ?? null,
    };
  }
}
