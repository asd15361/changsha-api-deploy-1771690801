import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type UpdateMeInput = {
  nickname?: string;
  bio?: string;
  district?: string;
  avatarUrl?: string;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

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

  async follow(currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) {
      return { success: false, userId: targetUserId, message: 'Cannot follow self.' };
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
