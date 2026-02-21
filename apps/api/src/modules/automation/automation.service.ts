import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PostsService } from '../posts/posts.service';

type HotTopicSeed = {
  topic: string;
  district: string;
  content: string;
};

const defaultSeeds: HotTopicSeed[] = [
  {
    topic: '解放西',
    district: 'Tianxin',
    content: '[Bot] Jiefangxi local nightlife discussion is trending tonight.',
  },
  {
    topic: '高校圈',
    district: 'Yuelu',
    content: '[Bot] Campus event updates are active in university areas.',
  },
  {
    topic: '社区生活',
    district: 'Yuhua',
    content: '[Bot] Neighborhood announcements and local tips are trending now.',
  },
  {
    topic: '长沙同城',
    district: 'Changsha',
    content: '[Bot] Citywide local pulse is active. Join topic threads for details.',
  },
];

@Injectable()
export class AutomationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly postsService: PostsService,
  ) {}

  private startOfToday() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  async publishHotTopics() {
    const botUser = await this.prisma.user.upsert({
      where: { phone: '19900000009' },
      update: {
        nickname: 'ChangshaPulseBot',
        isBot: true,
      },
      create: {
        phone: '19900000009',
        nickname: 'ChangshaPulseBot',
        isBot: true,
        district: 'Changsha',
      },
    });

    let published = 0;
    let skipped = 0;

    for (const seed of defaultSeeds) {
      const topic = await this.prisma.topic.upsert({
        where: { name: seed.topic },
        update: {},
        create: { name: seed.topic },
      });

      const exists = await this.prisma.post.findFirst({
        where: {
          authorId: botUser.id,
          isBot: true,
          sourceLabel: 'hot-topics-bot',
          createdAt: {
            gte: this.startOfToday(),
          },
          postTopics: {
            some: { topicId: topic.id },
          },
        },
        select: { id: true },
      });

      if (exists) {
        skipped += 1;
        continue;
      }

      await this.postsService.createPost({
        authorId: botUser.id,
        content: seed.content,
        district: seed.district,
        topics: [seed.topic],
        imageUrls: [],
        isBot: true,
        sourceLabel: 'hot-topics-bot',
      });
      published += 1;
    }

    return { success: true, published, skipped };
  }
}
