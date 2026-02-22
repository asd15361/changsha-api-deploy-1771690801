import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InteractionsService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureActiveUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true },
    });
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    if (user.status === 'BANNED') {
      throw new ForbiddenException('Account banned.');
    }
    if (user.status === 'MUTED') {
      throw new ForbiddenException('Muted users cannot comment.');
    }
  }

  private async ensurePostExists(postId: string) {
    const post = await this.prisma.post.findFirst({
      where: { id: postId, deletedAt: null },
      select: { id: true },
    });
    if (!post) {
      throw new NotFoundException(`post ${postId} not found`);
    }
  }

  async getComments(postId: string) {
    await this.ensurePostExists(postId);
    const comments = await this.prisma.comment.findMany({
      where: { postId, deletedAt: null },
      include: {
        author: {
          select: { id: true, nickname: true },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
      take: 200,
    });
    return {
      postId,
      items: comments.map((comment) => ({
        id: comment.id,
        authorId: comment.authorId,
        authorName: comment.author.nickname,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
      })),
    };
  }

  async createComment(postId: string, userId: string, contentRaw: string) {
    await this.ensureActiveUser(userId);
    await this.ensurePostExists(postId);

    const content = contentRaw.trim();
    if (!content) {
      throw new BadRequestException('Comment content required.');
    }
    if (content.length > 300) {
      throw new BadRequestException('Comment content too long (max 300).');
    }

    const comment = await this.prisma.comment.create({
      data: {
        postId,
        authorId: userId,
        content,
      },
    });
    return {
      success: true,
      postId,
      commentId: comment.id,
      content: comment.content,
    };
  }

  async deleteComment(commentId: string, userId: string) {
    const result = await this.prisma.comment.updateMany({
      where: {
        id: commentId,
        authorId: userId,
        deletedAt: null,
      },
      data: { deletedAt: new Date() },
    });
    if (result.count === 0) {
      throw new NotFoundException('Comment not found or not owned by user.');
    }
    return { success: true, commentId };
  }

  async likePost(postId: string, userId: string) {
    await this.ensurePostExists(postId);
    await this.prisma.like.upsert({
      where: { postId_userId: { postId, userId } },
      update: {},
      create: { postId, userId },
    });
    return { success: true, postId };
  }

  async unlikePost(postId: string, userId: string) {
    await this.prisma.like.deleteMany({
      where: { postId, userId },
    });
    return { success: true, postId };
  }

  async repostPost(postId: string, userId: string, quoteText?: string) {
    await this.ensureActiveUser(userId);
    await this.ensurePostExists(postId);
    const text = (quoteText ?? '').trim();

    const repost = await this.prisma.post.create({
      data: {
        authorId: userId,
        content: text || '转发',
        district: 'Changsha',
        imageUrls: '[]',
        sourceLabel: `repost:${postId}`,
      },
      select: { id: true },
    });

    return {
      success: true,
      postId,
      repostId: repost.id,
      quoteText: text || null,
    };
  }
}
