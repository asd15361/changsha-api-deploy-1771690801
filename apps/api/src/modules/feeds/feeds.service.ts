import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type FeedQuery = {
  cursor?: string;
  limit?: string;
  district?: string;
};

type FeedItem = {
  id: string;
  authorId: string;
  author: {
    id: string;
    nickname: string;
    isBot: boolean;
  };
  content: string;
  district: string;
  isBot: boolean;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  repostCount: number;
};

function normalizeLimit(limit?: string): number {
  const parsed = Number(limit ?? 20);
  if (Number.isNaN(parsed)) return 20;
  return Math.max(1, Math.min(50, parsed));
}

async function buildCursorWhere(
  prisma: PrismaClient,
  cursor?: string,
): Promise<Prisma.PostWhereInput | null> {
  if (!cursor) return null;
  const item = await prisma.post.findUnique({
    where: { id: cursor },
    select: { id: true, createdAt: true },
  });
  if (!item) return null;
  return {
    OR: [
      { createdAt: { lt: item.createdAt } },
      {
        AND: [{ createdAt: item.createdAt }, { id: { lt: item.id } }],
      },
    ],
  };
}

function mapFeedItem(
  item: Prisma.PostGetPayload<{
    include: {
      author: { select: { id: true; nickname: true; isBot: true } };
      _count: { select: { comments: true; likes: true } };
    };
  }>,
): FeedItem {
  return {
    id: item.id,
    authorId: item.authorId,
    author: item.author,
    content: item.content,
    district: item.district ?? 'Changsha',
    isBot: item.isBot,
    createdAt: item.createdAt.toISOString(),
    likeCount: item._count.likes,
    commentCount: item._count.comments,
    repostCount: 0,
  };
}

@Injectable()
export class FeedsService {
  constructor(private readonly prisma: PrismaService) {}

  async getFollowingFeed(userId: string, query: FeedQuery) {
    const limit = normalizeLimit(query.limit);
    const cursorWhere = await buildCursorWhere(this.prisma, query.cursor);

    const where: Prisma.PostWhereInput = {
      deletedAt: null,
      ...(cursorWhere ? { AND: [cursorWhere] } : {}),
      OR: [
        { authorId: userId },
        {
          author: {
            followers: {
              some: {
                followerId: userId,
              },
            },
          },
        },
      ],
    };

    const items = await this.prisma.post.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            nickname: true,
            isBot: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    const mapped = items.map(mapFeedItem);
    return {
      items: mapped,
      nextCursor: mapped.length === limit ? mapped[mapped.length - 1].id : null,
      limit,
      cursor: query.cursor ?? null,
    };
  }

  async getLocalFeed(query: FeedQuery) {
    const limit = normalizeLimit(query.limit);
    const cursorWhere = await buildCursorWhere(this.prisma, query.cursor);
    const andClauses: Prisma.PostWhereInput[] = [];
    if (query.district) {
      andClauses.push({ district: query.district });
    }
    if (cursorWhere) {
      andClauses.push(cursorWhere);
    }

    const rawItems = await this.prisma.post.findMany({
      where: {
        deletedAt: null,
        ...(andClauses.length > 0 ? { AND: andClauses } : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit * 6,
      include: {
        author: {
          select: {
            id: true,
            nickname: true,
            isBot: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    const botLimit = Math.floor(limit * 0.2);
    let botCount = 0;
    const filtered: typeof rawItems = [];

    for (const item of rawItems) {
      if (item.isBot) {
        if (botCount >= botLimit) continue;
        botCount += 1;
      }
      filtered.push(item);
      if (filtered.length >= limit) break;
    }

    const mapped = filtered.map(mapFeedItem);
    return {
      items: mapped,
      nextCursor: mapped.length === limit ? mapped[mapped.length - 1].id : null,
      limit,
      district: query.district ?? 'all',
      cursor: query.cursor ?? null,
      botRatioLimit: 0.2,
    };
  }

  async getRecommendedFeed(query: FeedQuery) {
    return this.getLocalFeed(query);
  }
}
