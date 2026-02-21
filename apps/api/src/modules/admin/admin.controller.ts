import { Body, Controller, Delete, Get, Param, Patch } from '@nestjs/common';
import { AdminService } from './admin.service';

type ReportActionBody = {
  action: 'ignore' | 'delete_post' | 'delete_comment' | 'mute_user' | 'ban_user';
  note?: string;
};

type UserStatusBody = {
  status: 'normal' | 'limited' | 'muted' | 'banned';
  note?: string;
};

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('reports')
  getReports() {
    return this.adminService.getReports();
  }

  @Patch('reports/:reportId')
  handleReport(
    @Param('reportId') reportId: string,
    @Body() body: ReportActionBody,
  ) {
    return this.adminService.handleReport(reportId, body.action, body.note);
  }

  @Patch('users/:userId/status')
  updateUserStatus(
    @Param('userId') userId: string,
    @Body() body: UserStatusBody,
  ) {
    return this.adminService.updateUserStatus(userId, body.status);
  }

  @Delete('posts/:postId')
  adminDeletePost(@Param('postId') postId: string) {
    return this.adminService.adminDeletePost(postId);
  }

  @Delete('comments/:commentId')
  adminDeleteComment(@Param('commentId') commentId: string) {
    return this.adminService.adminDeleteComment(commentId);
  }
}
