import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { requireUserIdFromAuthorizationHeader } from '../../common/auth';
import { UsersService } from './users.service';

type UpdateMeBody = {
  nickname?: string;
  bio?: string;
  district?: string;
  avatarUrl?: string;
};

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@Req() req: Request) {
    const userId = requireUserIdFromAuthorizationHeader(req.headers.authorization);
    return this.usersService.getMe(userId);
  }

  @Patch('me')
  updateMe(@Req() req: Request, @Body() body: UpdateMeBody) {
    const userId = requireUserIdFromAuthorizationHeader(req.headers.authorization);
    return this.usersService.updateMe(userId, body);
  }

  @Get(':userId')
  getUserProfile(@Param('userId') userId: string) {
    return this.usersService.getUserProfile(userId);
  }

  @Post(':userId/follow')
  follow(@Req() req: Request, @Param('userId') userId: string) {
    const currentUserId = requireUserIdFromAuthorizationHeader(req.headers.authorization);
    return this.usersService.follow(currentUserId, userId);
  }

  @Delete(':userId/follow')
  unfollow(@Req() req: Request, @Param('userId') userId: string) {
    const currentUserId = requireUserIdFromAuthorizationHeader(req.headers.authorization);
    return this.usersService.unfollow(currentUserId, userId);
  }
}
