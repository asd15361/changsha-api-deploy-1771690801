import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { requireUserIdFromAuthorizationHeader } from '../../common/auth';
import { UsersService } from './users.service';

type UpdateMeBody = {
  nickname?: string;
  bio?: string;
  district?: string;
  avatarUrl?: string;
};

type OnboardingBody = {
  district?: string;
  topics?: string[];
};

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@Req() req: Request) {
    const userId = requireUserIdFromAuthorizationHeader(
      req.headers.authorization,
    );
    return this.usersService.getMe(userId);
  }

  @Get('me/creator-stats')
  getMyCreatorStats(@Req() req: Request, @Query('days') days?: string) {
    const userId = requireUserIdFromAuthorizationHeader(
      req.headers.authorization,
    );
    return this.usersService.getMyCreatorStats(userId, days);
  }

  @Patch('me/onboarding')
  completeOnboarding(@Req() req: Request, @Body() body: OnboardingBody) {
    const userId = requireUserIdFromAuthorizationHeader(
      req.headers.authorization,
    );
    return this.usersService.completeOnboarding(userId, body);
  }

  @Patch('me')
  updateMe(@Req() req: Request, @Body() body: UpdateMeBody) {
    const userId = requireUserIdFromAuthorizationHeader(
      req.headers.authorization,
    );
    return this.usersService.updateMe(userId, body);
  }

  @Get('suggested/list')
  getSuggestedUsers(@Req() req: Request, @Query('limit') limit?: string) {
    const currentUserId = requireUserIdFromAuthorizationHeader(
      req.headers.authorization,
    );
    return this.usersService.getSuggestedUsers(currentUserId, limit);
  }

  @Get(':userId')
  getUserProfile(@Param('userId') userId: string) {
    return this.usersService.getUserProfile(userId);
  }

  @Post(':userId/follow')
  follow(@Req() req: Request, @Param('userId') userId: string) {
    const currentUserId = requireUserIdFromAuthorizationHeader(
      req.headers.authorization,
    );
    return this.usersService.follow(currentUserId, userId);
  }

  @Delete(':userId/follow')
  unfollow(@Req() req: Request, @Param('userId') userId: string) {
    const currentUserId = requireUserIdFromAuthorizationHeader(
      req.headers.authorization,
    );
    return this.usersService.unfollow(currentUserId, userId);
  }
}
