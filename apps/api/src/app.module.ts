import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PostsModule } from './modules/posts/posts.module';
import { FeedsModule } from './modules/feeds/feeds.module';
import { InteractionsModule } from './modules/interactions/interactions.module';
import { SearchModule } from './modules/search/search.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AdminModule } from './modules/admin/admin.module';
import { PrismaModule } from './prisma/prisma.module';
import { AutomationModule } from './modules/automation/automation.module';
import { MessagesModule } from './modules/messages/messages.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    PostsModule,
    FeedsModule,
    InteractionsModule,
    SearchModule,
    NotificationsModule,
    MessagesModule,
    ReportsModule,
    AdminModule,
    AutomationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
