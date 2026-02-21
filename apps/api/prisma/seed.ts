import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const baseUser = await prisma.user.upsert({
    where: { phone: '19900000001' },
    update: {
      nickname: 'ChangshaUser',
      district: 'Yuelu',
    },
    create: {
      phone: '19900000001',
      nickname: 'ChangshaUser',
      district: 'Yuelu',
      bio: 'Seed account for local feed testing.',
    },
  });

  const botUser = await prisma.user.upsert({
    where: { phone: '19900000009' },
    update: {
      nickname: 'ChangshaPulseBot',
      isBot: true,
      district: 'Changsha',
    },
    create: {
      phone: '19900000009',
      nickname: 'ChangshaPulseBot',
      district: 'Changsha',
      isBot: true,
      bio: 'Automated account for verified city updates.',
    },
  });

  const topicNames = ['长沙同城', '解放西', '高校圈', '社区生活'];
  for (const topicName of topicNames) {
    await prisma.topic.upsert({
      where: { name: topicName },
      update: {},
      create: { name: topicName },
    });
  }

  const samplePost = await prisma.post.create({
    data: {
      authorId: baseUser.id,
      content: '长沙Pulse 初始化完成，欢迎发布第一条同城动态。',
      district: 'Yuelu',
      imageUrls: "[]",
    },
  });

  await prisma.post.create({
    data: {
      authorId: botUser.id,
      content: '[Bot] Daily city brief published. Please verify details before taking action.',
      district: 'Changsha',
      isBot: true,
      sourceLabel: 'seed',
      imageUrls: "[]",
      postTopics: {
        create: [
          {
            topic: {
              connect: { name: '长沙同城' },
            },
          },
        ],
      },
    },
  });

  await prisma.follow.upsert({
    where: {
      followerId_followingId: {
        followerId: baseUser.id,
        followingId: botUser.id,
      },
    },
    update: {},
    create: {
      followerId: baseUser.id,
      followingId: botUser.id,
    },
  });

  await prisma.comment.create({
    data: {
      postId: samplePost.id,
      authorId: botUser.id,
      content: 'Bot comment: local flow looks healthy.',
    },
  });

  await prisma.report.upsert({
    where: { id: 'seed_report_001' },
    update: {},
    create: {
      id: 'seed_report_001',
      reporterId: baseUser.id,
      targetType: 'POST',
      targetId: samplePost.id,
      reason: 'Seed report for admin queue testing',
      detail: 'This is a seeded moderation item.',
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
