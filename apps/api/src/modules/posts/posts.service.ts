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

    const author =
      input.authorId != null
        ? await this.prisma.user.findUnique({ where: { id: input.authorId } })
        : null;

    if (!author) {
      throw new NotFoundException('author not found');
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
      },
    });

    return {
      success: true,
      postId: post.id,
      content: post.content,
      topics: post.postTopics.map((item) => item.topic.name),
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
