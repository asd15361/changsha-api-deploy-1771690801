import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { recordAppEvent } from '../../common/analytics';
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

type RankedFeedItem = FeedItem & {
  score: number;
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

  private scoreRecommendedItem(
    item: Prisma.PostGetPayload<{
      include: {
        author: { select: { id: true; nickname: true; isBot: true } };
        _count: { select: { comments: true; likes: true } };
      };
    }>,
    followedAuthorIds: Set<string>,
  ): number {
    const ageHours = Math.max(
      0,
      (Date.now() - item.createdAt.getTime()) / (60 * 60 * 1000),
    );
    const recencyScore = Math.max(0, 72 - ageHours) / 72;
    const engagementRaw = item._count.likes * 2 + item._count.comments * 3;
    const engagementScore = Math.min(1, engagementRaw / 20);
    const followBonus = followedAuthorIds.has(item.authorId) ? 0.2 : 0;
    const botPenalty = item.isBot ? -0.1 : 0;
    return (
      recencyScore * 0.5 + engagementScore * 0.4 + followBonus + botPenalty
    );
  }

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
    await recordAppEvent(this.prisma, {
      eventName: 'feed_view_following',
      userId,
      meta: { itemCount: mapped.length, limit },
    });
    return {
      items: mapped,
      nextCursor: mapped.length === limit ? mapped[mapped.length - 1].id : null,
      limit,
      cursor: query.cursor ?? null,
    };
  }

  async getLocalFeed(query: FeedQuery, viewerUserId?: string | null) {
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
    await recordAppEvent(this.prisma, {
      eventName: 'feed_view_local',
      userId: viewerUserId ?? undefined,
      meta: {
        itemCount: mapped.length,
        limit,
        district: query.district ?? 'all',
      },
    });
    return {
      items: mapped,
      nextCursor: mapped.length === limit ? mapped[mapped.length - 1].id : null,
      limit,
      district: query.district ?? 'all',
      cursor: query.cursor ?? null,
      botRatioLimit: 0.2,
    };
  }

  async getRecommendedFeed(query: FeedQuery, viewerUserId?: string | null) {
    const limit = normalizeLimit(query.limit);
    const cursorWhere = await buildCursorWhere(this.prisma, query.cursor);

    const andClauses: Prisma.PostWhereInput[] = [];
    if (query.district) {
      andClauses.push({ district: query.district });
    }
    if (cursorWhere) {
      andClauses.push(cursorWhere);
    }

    const followedAuthorIds = new Set<string>();
    if (viewerUserId) {
      const following = await this.prisma.follow.findMany({
        where: { followerId: viewerUserId },
        select: { followingId: true },
      });
      following.forEach((item) => followedAuthorIds.add(item.followingId));
    }

    const candidates = await this.prisma.post.findMany({
      where: {
        deletedAt: null,
        ...(andClauses.length > 0 ? { AND: andClauses } : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit * 8,
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

    const ranked = candidates
      .map((item) => {
        const mapped = mapFeedItem(item);
        return {
          ...mapped,
          score: this.scoreRecommendedItem(item, followedAuthorIds),
        } as RankedFeedItem;
      })
      .sort((a, b) => {
        if (b.score === a.score) {
          return a.createdAt < b.createdAt ? 1 : -1;
        }
        return b.score - a.score;
      });

    const selected: FeedItem[] = ranked.slice(0, limit);

    await recordAppEvent(this.prisma, {
      eventName: 'feed_view_recommended',
      userId: viewerUserId ?? undefined,
      meta: {
        itemCount: selected.length,
        limit,
        district: query.district ?? 'all',
      },
    });

    return {
      items: selected,
      nextCursor:
        selected.length === limit ? selected[selected.length - 1].id : null,
      limit,
      district: query.district ?? 'all',
      cursor: query.cursor ?? null,
      strategy: 'weighted_v1',
    };
  }
}
