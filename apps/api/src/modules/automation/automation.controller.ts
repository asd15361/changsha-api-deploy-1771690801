import { Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { requireAdminApiKey } from '../../common/admin-auth';
import { AutomationService } from './automation.service';

@Controller('admin/automation')
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  @Post('hot-topics/publish')
  publishHotTopics(@Req() req: Request) {
    requireAdminApiKey(req.headers['x-admin-key']);
    return this.automationService.publishHotTopics();
  }
}
