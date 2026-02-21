import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

function normalizeTopicName(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith('#')) {
    return trimmed.slice(1);
  }
  return trimmed;
}

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async searchUsers(query: string) {
    const q = query.trim();
    const items = await this.prisma.user.findMany({
      where: q
        ? {
            nickname: {
              contains: q,
            },
          }
        : undefined,
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
      select: {
        id: true,
        nickname: true,
        district: true,
      },
    });

    return {
      query: q,
      items: items.map((item) => ({
        id: item.id,
        nickname: item.nickname,
        district: item.district ?? 'Changsha',
      })),
    };
  }

  async searchTopics(query: string) {
    const q = normalizeTopicName(query);
    const items = await this.prisma.topic.findMany({
      where: q
        ? {
            name: {
              contains: q,
            },
          }
        : undefined,
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });

    return {
      query: q,
      items: items.map((item) => ({
        topic: item.name,
        postCount: 0, // SQLite 不支持 _count
      })),
    };
  }

  async getTopic(topic: string) {
    const topicName = normalizeTopicName(topic);
    const item = await this.prisma.topic.findUnique({
      where: { name: topicName },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });
    if (!item) {
      throw new NotFoundException(`topic ${topicName} not found`);
    }
    return {
      topic: item.name,
      postCount: item._count.posts,
    };
  }

  async getTopicPosts(topic: string, cursor?: string) {
    const topicName = normalizeTopicName(topic);
    const item = await this.prisma.topic.findUnique({
      where: { name: topicName },
      include: {
        posts: {
          where: {
            post: {
              deletedAt: null,
            },
          },
          orderBy: {
            post: {
              createdAt: 'desc',
            },
          },
          take: 20,
          include: {
            post: {
              select: {
                id: true,
                content: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException(`topic ${topicName} not found`);
    }

    return {
      topic: item.name,
      cursor: cursor ?? null,
      items: item.posts.map((postTopic) => ({
        id: postTopic.post.id,
        content: postTopic.post.content,
        createdAt: postTopic.post.createdAt.toISOString(),
      })),
    };
  }
}
