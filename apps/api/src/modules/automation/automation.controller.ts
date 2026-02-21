import { Controller, Post } from '@nestjs/common';
import { AutomationService } from './automation.service';

@Controller('admin/automation')
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  @Post('hot-topics/publish')
  publishHotTopics() {
    return this.automationService.publishHotTopics();
  }
}
