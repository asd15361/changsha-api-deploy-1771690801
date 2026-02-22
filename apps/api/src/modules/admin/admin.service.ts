import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type ReportAction =
  | 'ignore'
  | 'delete_post'
  | 'delete_comment'
  | 'mute_user'
  | 'ban_user';
type UserStatusInput = 'normal' | 'limited' | 'muted' | 'banned';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeDays(daysRaw?: string): number {
    const parsed = Number(daysRaw ?? '7');
    if (!Number.isFinite(parsed) || parsed <= 0) return 7;
    return Math.min(30, Math.floor(parsed));
  }

  async getOverviewMetrics(daysRaw?: string) {
    const days = this.normalizeDays(daysRaw);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    await this.prisma.$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS app_events (
        id TEXT PRIMARY KEY,
        event_name TEXT NOT NULL,
        user_id TEXT,
        platform TEXT,
        meta_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
    );

    const [
      newUsers,
      posts,
      comments,
      likes,
      reports,
      resolvedReports,
      topEvents,
    ] = await Promise.all([
      this.prisma.user.count({ where: { createdAt: { gte: since } } }),
      this.prisma.post.count({
        where: { createdAt: { gte: since }, deletedAt: null },
      }),
      this.prisma.comment.count({
        where: { createdAt: { gte: since }, deletedAt: null },
      }),
      this.prisma.like.count({ where: { createdAt: { gte: since } } }),
      this.prisma.report.count({ where: { createdAt: { gte: since } } }),
      this.prisma.report.count({
        where: { createdAt: { gte: since }, status: 'RESOLVED' },
      }),
      this.prisma.$queryRaw<Array<{ event_name: string; count: number }>>`
          SELECT event_name, COUNT(*) as count
          FROM app_events
          WHERE created_at >= ${since.toISOString()}
          GROUP BY event_name
          ORDER BY count DESC
          LIMIT 12
        `,
    ]);

    return {
      days,
      since: since.toISOString(),
      summary: {
        newUsers,
        posts,
        comments,
        likes,
        reports,
        resolvedReports,
      },
      events: topEvents.map((item) => ({
        eventName: item.event_name,
        count: Number(item.count),
      })),
    };
  }

  private mapAction(action: ReportAction): string {
    if (action === 'ignore') return 'IGNORE';
    if (action === 'delete_post') return 'DELETE_POST';
    if (action === 'delete_comment') return 'DELETE_COMMENT';
    if (action === 'mute_user') return 'MUTE_USER';
    return 'BAN_USER';
  }

  private mapUserStatus(status: UserStatusInput): string {
    if (status === 'normal') return 'NORMAL';
    if (status === 'limited') return 'LIMITED';
    if (status === 'muted') return 'MUTED';
    return 'BANNED';
  }

  async getReports() {
    const items = await this.prisma.report.findMany({
      orderBy: [{ createdAt: 'desc' }],
      take: 100,
    });
    return {
      items: items.map((item) => ({
        id: item.id,
        status: item.status.toLowerCase(),
        targetType: item.targetType.toLowerCase(),
        targetId: item.targetId,
        reason: item.reason,
        createdAt: item.createdAt.toISOString(),
      })),
    };
  }

  async handleReport(reportId: string, action: ReportAction, note?: string) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });
    if (!report) {
      throw new NotFoundException(`Report ${reportId} not found`);
    }

    if (action === 'delete_post') {
      await this.prisma.post.updateMany({
        where: { id: report.targetId, deletedAt: null },
        data: { deletedAt: new Date() },
      });
    }

    if (action === 'delete_comment') {
      await this.prisma.comment.updateMany({
        where: { id: report.targetId, deletedAt: null },
        data: { deletedAt: new Date() },
      });
    }

    if (action === 'mute_user' || action === 'ban_user') {
      const status = action === 'mute_user' ? 'MUTED' : 'BANNED';
      await this.prisma.user.updateMany({
        where: { id: report.targetId },
        data: { status },
      });
    }

    await this.prisma.moderationAction.create({
      data: {
        reportId,
        actionType: this.mapAction(action),
        note,
      },
    });

    await this.prisma.report.update({
      where: { id: reportId },
      data: { status: 'RESOLVED' },
    });

    return { success: true, reportId, action };
  }

  async updateUserStatus(userId: string, status: UserStatusInput) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status: this.mapUserStatus(status) },
      select: { id: true, status: true },
    });
    return {
      success: true,
      userId: updated.id,
      status: updated.status.toLowerCase(),
    };
  }

  async adminDeletePost(postId: string) {
    await this.prisma.post.updateMany({
      where: { id: postId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return { success: true, postId };
  }

  async adminDeleteComment(commentId: string) {
    await this.prisma.comment.updateMany({
      where: { id: commentId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return { success: true, commentId };
  }
}
