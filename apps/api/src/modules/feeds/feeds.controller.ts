import { Controller, Get, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import {
  parseUserIdFromAuthorizationHeader,
  requireUserIdFromAuthorizationHeader,
} from '../../common/auth';
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
    const userId = requireUserIdFromAuthorizationHeader(
      req.headers.authorization,
    );
    return this.feedsService.getFollowingFeed(userId, { cursor, limit });
  }

  @Get('local')
  getLocalFeed(
    @Req() req: Request,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Query('district') district?: string,
  ) {
    const userId = parseUserIdFromAuthorizationHeader(
      req.headers.authorization,
    );
    return this.feedsService.getLocalFeed({ cursor, limit, district }, userId);
  }

  @Get('recommended')
  getRecommendedFeed(
    @Req() req: Request,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Query('district') district?: string,
  ) {
    const userId = parseUserIdFromAuthorizationHeader(
      req.headers.authorization,
    );
    return this.feedsService.getRecommendedFeed(
      { cursor, limit, district },
      userId,
    );
  }
}
