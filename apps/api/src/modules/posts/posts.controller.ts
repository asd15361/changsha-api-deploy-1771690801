import { Body, Controller, Delete, Get, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { requireUserIdFromAuthorizationHeader } from '../../common/auth';
import { PostsService } from './posts.service';

type CreatePostBody = {
  content: string;
  district?: string;
  topics?: string[];
  imageUrls?: string[];
};

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  createPost(@Req() req: Request, @Body() body: CreatePostBody) {
    const userId = requireUserIdFromAuthorizationHeader(req.headers.authorization);
    return this.postsService.createPost({
      ...body,
      authorId: userId,
    });
  }

  @Get(':postId')
  getPost(@Param('postId') postId: string) {
    return this.postsService.getPost(postId);
  }

  @Delete(':postId')
  deletePost(@Req() req: Request, @Param('postId') postId: string) {
    const userId = requireUserIdFromAuthorizationHeader(req.headers.authorization);
    return this.postsService.deletePostByAuthor(postId, userId);
  }
}
