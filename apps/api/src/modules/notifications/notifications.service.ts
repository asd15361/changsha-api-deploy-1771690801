import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type NotificationItem = {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  read: boolean;
};

@Injectable()
export class NotificationsService {
  private readonly readState = new Map<string, Set<string>>();

  constructor(private readonly prisma: PrismaService) {}

  private isRead(userId: string, id: string) {
    return this.readState.get(userId)?.has(id) ?? false;
  }

  private markRead(userId: string, ids: string[]) {
    const set = this.readState.get(userId) ?? new Set<string>();
    ids.forEach((id) => set.add(id));
    this.readState.set(userId, set);
  }

  async getNotifications(
    userId: string,
  ): Promise<{ items: NotificationItem[] }> {
    const [comments, likes, follows] = await Promise.all([
      this.prisma.comment.findMany({
        where: {
          deletedAt: null,
          post: {
            authorId: userId,
          },
          authorId: { not: userId },
        },
        orderBy: [{ createdAt: 'desc' }],
        take: 30,
        include: {
          author: { select: { nickname: true } },
        },
      }),
      this.prisma.like.findMany({
        where: {
          post: {
            authorId: userId,
          },
          userId: { not: userId },
        },
        orderBy: [{ createdAt: 'desc' }],
        take: 30,
        include: {
          user: { select: { nickname: true } },
        },
      }),
      this.prisma.follow.findMany({
        where: {
          followingId: userId,
          followerId: { not: userId },
        },
        orderBy: [{ createdAt: 'desc' }],
        take: 30,
        include: {
          follower: { select: { nickname: true } },
        },
      }),
    ]);

    const items: NotificationItem[] = [
      ...comments.map((item) => {
        const id = `comment:${item.id}`;
        return {
          id,
          type: 'comment',
          message: `${item.author.nickname} 评论了你的帖子`,
          createdAt: item.createdAt.toISOString(),
          read: this.isRead(userId, id),
        };
      }),
      ...likes.map((item) => {
        const id = `like:${item.postId}:${item.userId}`;
        return {
          id,
          type: 'like',
          message: `${item.user.nickname} 点赞了你的帖子`,
          createdAt: item.createdAt.toISOString(),
          read: this.isRead(userId, id),
        };
      }),
      ...follows.map((item) => {
        const id = `follow:${item.followerId}:${item.followingId}`;
        return {
          id,
          type: 'follow',
          message: `${item.follower.nickname} 关注了你`,
          createdAt: item.createdAt.toISOString(),
          read: this.isRead(userId, id),
        };
      }),
    ]
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, 100);

    return { items };
  }

  markReadBatch(userId: string, ids: string[]) {
    this.markRead(userId, ids);
    return {
      success: true,
      ids,
    };
  }
}
