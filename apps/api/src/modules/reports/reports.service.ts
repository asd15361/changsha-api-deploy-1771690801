import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type CreateReportInput = {
  targetType: 'post' | 'comment' | 'user';
  targetId: string;
  reason: string;
  detail?: string;
};

type AppealInput = {
  actionId: string;
  reason: string;
};

@Injectable()
export class ReportsService {
  private readonly appealStore: Array<{
    id: string;
    userId: string;
    actionId: string;
    reason: string;
    createdAt: string;
  }> = [];

  constructor(private readonly prisma: PrismaService) {}

  private mapTargetType(type: CreateReportInput['targetType']): string {
    if (type === 'post') return 'POST';
    if (type === 'comment') return 'COMMENT';
    return 'USER';
  }

  async createReport(userId: string, input: CreateReportInput) {
    const report = await this.prisma.report.create({
      data: {
        reporterId: userId,
        targetType: this.mapTargetType(input.targetType),
        targetId: input.targetId,
        reason: input.reason,
        detail: input.detail,
      },
    });
    return {
      success: true,
      reportId: report.id,
      report: {
        id: report.id,
        targetType: report.targetType,
        targetId: report.targetId,
        reason: report.reason,
        detail: report.detail,
        status: report.status,
        createdAt: report.createdAt.toISOString(),
      },
    };
  }

  async getMyReports(userId: string) {
    const items = await this.prisma.report.findMany({
      where: { reporterId: userId },
      orderBy: [{ createdAt: 'desc' }],
      take: 100,
    });
    return {
      items: items.map((item) => ({
        id: item.id,
        status: item.status.toLowerCase(),
        createdAt: item.createdAt.toISOString(),
      })),
    };
  }

  createAppeal(userId: string, input: AppealInput) {
    const appeal = {
      id: `appeal_${Date.now()}`,
      userId,
      actionId: input.actionId,
      reason: input.reason,
      createdAt: new Date().toISOString(),
    };
    this.appealStore.unshift(appeal);
    return {
      success: true,
      appealId: appeal.id,
      appeal,
    };
  }

  getMyAppeals(userId: string) {
    return {
      items: this.appealStore
        .filter((item) => item.userId === userId)
        .slice(0, 100)
        .map((item) => ({
          id: item.id,
          status: 'pending',
          createdAt: item.createdAt,
        })),
    };
  }
}
