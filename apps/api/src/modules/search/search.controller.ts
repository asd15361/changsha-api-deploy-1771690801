import { Controller, Get, Param, Query } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('search/users')
  searchUsers(@Query('q') q = '') {
    return this.searchService.searchUsers(q);
  }

  @Get('search/topics')
  searchTopics(@Query('q') q = '') {
    return this.searchService.searchTopics(q);
  }

  @Get('topics/hot')
  getHotTopics(@Query('limit') limit?: string, @Query('days') days?: string) {
    return this.searchService.getHotTopics(limit, days);
  }

  @Get('topics/:topic')
  getTopic(@Param('topic') topic: string) {
    return this.searchService.getTopic(topic);
  }

  @Get('topics/:topic/posts')
  getTopicPosts(
    @Param('topic') topic: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.searchService.getTopicPosts(topic, cursor);
  }
}
