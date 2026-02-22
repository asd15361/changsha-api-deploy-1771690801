import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { requireAdminApiKey } from '../../common/admin-auth';
import { AdminService } from './admin.service';

type ReportActionBody = {
  action:
    | 'ignore'
    | 'delete_post'
    | 'delete_comment'
    | 'mute_user'
    | 'ban_user';
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
  getReports(@Req() req: Request) {
    requireAdminApiKey(req.headers['x-admin-key']);
    return this.adminService.getReports();
  }

  @Get('metrics/overview')
  getMetricsOverview(@Req() req: Request, @Query('days') days?: string) {
    requireAdminApiKey(req.headers['x-admin-key']);
    return this.adminService.getOverviewMetrics(days);
  }

  @Patch('reports/:reportId')
  handleReport(
    @Param('reportId') reportId: string,
    @Body() body: ReportActionBody,
    @Req() req: Request,
  ) {
    requireAdminApiKey(req.headers['x-admin-key']);
    return this.adminService.handleReport(reportId, body.action, body.note);
  }

  @Patch('users/:userId/status')
  updateUserStatus(
    @Param('userId') userId: string,
    @Body() body: UserStatusBody,
    @Req() req: Request,
  ) {
    requireAdminApiKey(req.headers['x-admin-key']);
    return this.adminService.updateUserStatus(userId, body.status);
  }

  @Delete('posts/:postId')
  adminDeletePost(@Param('postId') postId: string, @Req() req: Request) {
    requireAdminApiKey(req.headers['x-admin-key']);
    return this.adminService.adminDeletePost(postId);
  }

  @Delete('comments/:commentId')
  adminDeleteComment(
    @Param('commentId') commentId: string,
    @Req() req: Request,
  ) {
    requireAdminApiKey(req.headers['x-admin-key']);
    return this.adminService.adminDeleteComment(commentId);
  }
}
