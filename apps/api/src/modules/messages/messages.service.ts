import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type ListConversationsResult = {
  items: Array<{
    conversationId: string;
    updatedAt: string;
    unreadCount: number;
    peer: {
      id: string;
      nickname: string;
      avatarUrl: string | null;
    } | null;
    lastMessage: {
      id: string;
      content: string;
      createdAt: string;
      senderId: string;
    } | null;
  }>;
};

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureMember(conversationId: string, userId: string) {
    const member = await this.prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });
    if (!member) {
      throw new ForbiddenException('No access to this conversation.');
    }
    return member;
  }

  async createOrGetDm(userId: string, targetUserId: string) {
    if (userId === targetUserId) {
      throw new BadRequestException('Cannot create conversation with yourself.');
    }

    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });
    if (!target) {
      throw new NotFoundException('Target user not found.');
    }

    const [iFollowTarget, targetFollowMe] = await Promise.all([
      this.prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: targetUserId,
          },
        },
        select: { followerId: true },
      }),
      this.prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: targetUserId,
            followingId: userId,
          },
        },
        select: { followerId: true },
      }),
    ]);

    if (!iFollowTarget || !targetFollowMe) {
      throw new BadRequestException('需互相关注后才能发私信。');
    }

    const existing = await this.prisma.conversation.findFirst({
      where: {
        members: {
          some: { userId },
        },
        AND: {
          members: {
            some: { userId: targetUserId },
          },
        },
      },
      select: { id: true },
    });

    if (existing) {
      return { success: true, conversationId: existing.id, created: false };
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        members: {
          create: [{ userId }, { userId: targetUserId }],
        },
      },
      select: { id: true },
    });

    return { success: true, conversationId: conversation.id, created: true };
  }

  async listConversations(userId: string): Promise<ListConversationsResult> {
    const members = await this.prisma.conversationMember.findMany({
      where: { userId },
      orderBy: [{ conversation: { lastMessageAt: 'desc' } }],
      include: {
        conversation: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    nickname: true,
                    avatarUrl: true,
                  },
                },
              },
            },
            messages: {
              orderBy: [{ createdAt: 'desc' }],
              take: 1,
              select: {
                id: true,
                content: true,
                createdAt: true,
                senderId: true,
              },
            },
          },
        },
      },
    });

    const items = await Promise.all(
      members.map(async (member) => {
        const conversationId = member.conversationId;
        const peerMember = member.conversation.members.find(
          (m) => m.userId !== userId,
        );
        const lastMessage = member.conversation.messages[0] ?? null;
        const unreadWhere = {
          conversationId,
          senderId: { not: userId },
          ...(member.lastReadAt ? { createdAt: { gt: member.lastReadAt } } : {}),
        };
        const unreadCount = await this.prisma.message.count({ where: unreadWhere });

        return {
          conversationId,
          updatedAt: member.conversation.updatedAt.toISOString(),
          unreadCount,
          peer: peerMember
            ? {
                id: peerMember.user.id,
                nickname: peerMember.user.nickname,
                avatarUrl: peerMember.user.avatarUrl,
              }
            : null,
          lastMessage: lastMessage
            ? {
                id: lastMessage.id,
                content: lastMessage.content,
                createdAt: lastMessage.createdAt.toISOString(),
                senderId: lastMessage.senderId,
              }
            : null,
        };
      }),
    );

    return { items };
  }

  async listMessages(userId: string, conversationId: string, cursor?: string) {
    await this.ensureMember(conversationId, userId);

    const cursorMessage = cursor
      ? await this.prisma.message.findUnique({
          where: { id: cursor },
          select: { id: true, createdAt: true },
        })
      : null;

    const where = {
      conversationId,
      ...(cursorMessage
        ? {
            OR: [
              { createdAt: { lt: cursorMessage.createdAt } },
              {
                AND: [
                  { createdAt: cursorMessage.createdAt },
                  { id: { lt: cursorMessage.id } },
                ],
              },
            ],
          }
        : {}),
    };

    const rows = await this.prisma.message.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 30,
      include: {
        sender: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
          },
        },
      },
    });

    return {
      items: rows.map((row) => ({
        id: row.id,
        content: row.content,
        createdAt: row.createdAt.toISOString(),
        sender: row.sender,
      })),
      nextCursor: rows.length === 30 ? rows[rows.length - 1].id : null,
    };
  }

  async sendMessage(userId: string, conversationId: string, contentRaw: string) {
    const member = await this.ensureMember(conversationId, userId);
    const content = contentRaw.trim();
    if (!content) {
      throw new BadRequestException('Message content is required.');
    }
    if (content.length > 500) {
      throw new BadRequestException('Message too long (max 500 chars).');
    }

    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: {
          conversationId,
          senderId: userId,
          content,
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
        },
      });

      await tx.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: created.createdAt },
      });

      await tx.conversationMember.update({
        where: { id: member.id },
        data: { lastReadAt: created.createdAt },
      });

      return created;
    });

    return {
      success: true,
      message,
    };
  }

  async markConversationRead(userId: string, conversationId: string) {
    await this.ensureMember(conversationId, userId);
    await this.prisma.conversationMember.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      data: {
        lastReadAt: new Date(),
      },
    });
    return { success: true };
  }
}
