import { Module } from '@nestjs/common';
import { PostsModule } from '../posts/posts.module';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';

@Module({
  imports: [PostsModule],
  controllers: [AutomationController],
  providers: [AutomationService],
})
export class AutomationModule {}
