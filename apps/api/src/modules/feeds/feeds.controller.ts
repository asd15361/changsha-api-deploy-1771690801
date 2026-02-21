import { Controller, Get, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { requireUserIdFromAuthorizationHeader } from '../../common/auth';
import { FeedsService } from './feeds.service';

@Controller('feeds')
export class FeedsController {
  constructor(private readonly feedsService: FeedsService) {}

  @Get('following')
  getFollowingFeed(
    @Req() req: Request,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = requireUserIdFromAuthorizationHeader(req.headers.authorization);
    return this.feedsService.getFollowingFeed(userId, { cursor, limit });
  }

  @Get('local')
  getLocalFeed(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Query('district') district?: string,
  ) {
    return this.feedsService.getLocalFeed({ cursor, limit, district });
  }
}
