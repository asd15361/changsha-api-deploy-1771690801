import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { requireUserIdFromAuthorizationHeader } from '../../common/auth';
import { ReportsService } from './reports.service';

type ReportBody = {
  targetType: 'post' | 'comment' | 'user';
  targetId: string;
  reason: string;
  detail?: string;
};

type AppealBody = {
  actionId: string;
  reason: string;
};

@Controller()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('reports')
  createReport(@Req() req: Request, @Body() body: ReportBody) {
    const userId = requireUserIdFromAuthorizationHeader(req.headers.authorization);
    return this.reportsService.createReport(userId, body);
  }

  @Get('reports/my')
  getMyReports(@Req() req: Request) {
    const userId = requireUserIdFromAuthorizationHeader(req.headers.authorization);
    return this.reportsService.getMyReports(userId);
  }

  @Post('appeals')
  createAppeal(@Req() req: Request, @Body() body: AppealBody) {
    const userId = requireUserIdFromAuthorizationHeader(req.headers.authorization);
    return this.reportsService.createAppeal(userId, body);
  }

  @Get('appeals/my')
  getMyAppeals(@Req() req: Request) {
    const userId = requireUserIdFromAuthorizationHeader(req.headers.authorization);
    return this.reportsService.getMyAppeals(userId);
  }
}
