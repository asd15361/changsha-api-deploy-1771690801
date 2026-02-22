import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type CreatePostInput = {
  content: string;
  district?: string;
  topics?: string[];
  imageUrls?: string[];
  authorId?: string;
  isBot?: boolean;
  sourceLabel?: string;
};

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async createPost(input: CreatePostInput) {
    const content = input.content?.trim();
    if (!content) {
      throw new BadRequestException('content is required');
    }
    if (content.length > 300) {
      throw new BadRequestException('content too long, max 300 chars');
    }

    const author =
      input.authorId != null
        ? await this.prisma.user.findUnique({ where: { id: input.authorId } })
        : null;

    if (!author) {
      throw new NotFoundException('author not found');
    }
    if (author.status === 'MUTED' || author.status === 'BANNED') {
      throw new BadRequestException(
        'current account is not allowed to publish',
      );
    }

    const latestPost = await this.prisma.post.findFirst({
      where: {
        authorId: author.id,
        deletedAt: null,
      },
      select: { createdAt: true },
      orderBy: [{ createdAt: 'desc' }],
    });
    if (latestPost && Date.now() - latestPost.createdAt.getTime() < 60_000) {
      throw new BadRequestException(
        'posting too frequently, try again in one minute',
      );
    }

    const topics = (input.topics ?? [])
      .map((topic) => topic.trim())
      .filter((topic) => topic.length > 0)
      .slice(0, 3);

    const post = await this.prisma.post.create({
      data: {
        authorId: author.id,
        content,
        district: input.district?.trim() || null,
        imageUrls: JSON.stringify(input.imageUrls ?? []),
        isBot: input.isBot ?? false,
        sourceLabel: input.sourceLabel,
        postTopics: {
          create: topics.map((name) => ({
            topic: {
              connectOrCreate: {
                where: { name },
                create: { name },
              },
            },
          })),
        },
      },
      include: {
        postTopics: {
          include: {
            topic: true,
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

    return {
      success: true,
      postId: post.id,
      content: post.content,
      topics: post.postTopics.map((item) => item.topic.name),
      likeCount: post._count.likes,
      commentCount: post._count.comments,
    };
  }

  async getPost(postId: string) {
    const post = await this.prisma.post.findFirst({
      where: {
        id: postId,
        deletedAt: null,
      },
      include: {
        author: {
          select: {
            id: true,
            nickname: true,
            isBot: true,
          },
        },
        postTopics: {
          include: {
            topic: true,
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

    if (!post) {
      throw new NotFoundException(`post ${postId} not found`);
    }

    return {
      id: post.id,
      authorId: post.authorId,
      author: post.author,
      content: post.content,
      district: post.district,
      topics: post.postTopics.map((item) => item.topic.name),
      likeCount: post._count.likes,
      commentCount: post._count.comments,
      repostCount: 0,
      createdAt: post.createdAt.toISOString(),
    };
  }

  async deletePost(postId: string) {
    const result = await this.prisma.post.updateMany({
      where: {
        id: postId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });
    if (result.count === 0) {
      throw new NotFoundException(`post ${postId} not found`);
    }
    return { success: true, postId };
  }

  async deletePostByAuthor(postId: string, actorUserId: string) {
    const result = await this.prisma.post.updateMany({
      where: {
        id: postId,
        authorId: actorUserId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });
    if (result.count === 0) {
      throw new NotFoundException(
        `post ${postId} not found or not owned by actor`,
      );
    }
    return { success: true, postId };
  }
}
