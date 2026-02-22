import { Injectable, NotFoundException } from '@nestjs/common';
import { recordAppEvent } from '../../common/analytics';
import { PrismaService } from '../../prisma/prisma.service';

export type UpdateMeInput = {
  nickname?: string;
  bio?: string;
  district?: string;
  avatarUrl?: string;
};

type OnboardingInput = {
  district?: string;
  topics?: string[];
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeLimit(limitRaw?: string, fallback = 10, max = 30): number {
    const parsed = Number(limitRaw ?? fallback);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return Math.min(max, Math.floor(parsed));
  }

  private normalizeDays(daysRaw?: string): number {
    const parsed = Number(daysRaw ?? '7');
    if (!Number.isFinite(parsed) || parsed <= 0) return 7;
    return Math.min(30, Math.floor(parsed));
  }

  async getUserByIdOrThrow(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }
    return user;
  }

  async getMe(userId: string) {
    const user = await this.getUserByIdOrThrow(userId);
    return {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      district: user.district,
      avatarUrl: user.avatarUrl,
      status: user.status,
    };
  }

  async getMyCreatorStats(userId: string, daysRaw?: string) {
    const days = this.normalizeDays(daysRaw);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const [posts, commentsReceived, likesReceived, followers] =
      await Promise.all([
        this.prisma.post.count({
          where: {
            authorId: userId,
            createdAt: { gte: since },
            deletedAt: null,
          },
        }),
        this.prisma.comment.count({
          where: {
            createdAt: { gte: since },
            post: { authorId: userId, deletedAt: null },
          },
        }),
        this.prisma.like.count({
          where: {
            createdAt: { gte: since },
            post: { authorId: userId, deletedAt: null },
          },
        }),
        this.prisma.follow.count({ where: { followingId: userId } }),
      ]);

    return {
      days,
      since: since.toISOString(),
      summary: {
        posts,
        commentsReceived,
        likesReceived,
        followers,
      },
    };
  }

  async completeOnboarding(userId: string, input: OnboardingInput) {
    const district = input.district?.trim() || 'Changsha';
    const topics = (input.topics ?? [])
      .map((item) => item.trim().replace(/^#/, ''))
      .filter((item) => item.length > 0)
      .slice(0, 6);

    await this.prisma.user.update({
      where: { id: userId },
      data: { district },
    });

    for (const topic of topics) {
      await this.prisma.topic.upsert({
        where: { name: topic },
        update: {},
        create: { name: topic },
      });
    }

    await recordAppEvent(this.prisma, {
      eventName: 'onboarding_complete',
      userId,
      platform: 'mobile',
      meta: { district, topics },
    });

    return {
      success: true,
      district,
      topics,
    };
  }

  async updateMe(userId: string, input: UpdateMeInput) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        nickname: input.nickname,
        bio: input.bio,
        district: input.district,
        avatarUrl: input.avatarUrl,
      },
    });
    return {
      success: true,
      profile: {
        id: updated.id,
        nickname: updated.nickname,
        bio: updated.bio,
        district: updated.district,
        avatarUrl: updated.avatarUrl,
      },
    };
  }

  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
          },
        },
      },
    });
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }
    return {
      id: user.id,
      nickname: user.nickname,
      bio: user.bio ?? '',
      district: user.district ?? 'Changsha',
      isBot: user.isBot,
      followers: user._count.followers,
      following: user._count.following,
      posts: user._count.posts,
    };
  }

  async getSuggestedUsers(currentUserId: string, limitRaw?: string) {
    const limit = this.normalizeLimit(limitRaw, 10, 20);
    const following = await this.prisma.follow.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true },
    });
    const blockedIds = new Set(following.map((item) => item.followingId));
    blockedIds.add(currentUserId);

    const users = await this.prisma.user.findMany({
      where: {
        id: { notIn: Array.from(blockedIds) },
        isBot: false,
        status: 'NORMAL',
      },
      orderBy: { createdAt: 'desc' },
      take: limit * 3,
      select: {
        id: true,
        nickname: true,
        district: true,
        _count: { select: { followers: true, posts: true } },
      },
    });

    const ranked = users
      .map((user) => ({
        id: user.id,
        nickname: user.nickname,
        district: user.district ?? 'Changsha',
        followers: user._count.followers,
        posts: user._count.posts,
        score: user._count.followers * 2 + user._count.posts,
      }))
      .sort((a, b) => b.score - a.score);

    const selected = ranked.slice(0, limit).map((item) => ({
      id: item.id,
      nickname: item.nickname,
      district: item.district,
      followers: item.followers,
      posts: item.posts,
    }));

    return {
      items: selected,
      limit,
    };
  }

  async follow(currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) {
      return {
        success: false,
        userId: targetUserId,
        message: 'Cannot follow self.',
      };
    }

    await this.getUserByIdOrThrow(targetUserId);
    await this.prisma.follow.upsert({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      },
      update: {},
      create: {
        followerId: currentUserId,
        followingId: targetUserId,
      },
    });

    await recordAppEvent(this.prisma, {
      eventName: 'user_follow',
      userId: currentUserId,
      meta: { targetUserId },
    });

    return { success: true, userId: targetUserId };
  }

  async unfollow(currentUserId: string, targetUserId: string) {
    await this.prisma.follow.deleteMany({
      where: {
        followerId: currentUserId,
        followingId: targetUserId,
      },
    });
    return { success: true, userId: targetUserId };
  }
}
