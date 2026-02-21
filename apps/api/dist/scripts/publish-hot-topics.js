"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const todaySeeds = [
    {
        topic: '解放西',
        district: 'Tianxin',
        content: '[Bot] Jiefangxi nightlife traffic is rising tonight. Plan transportation in advance.',
    },
    {
        topic: '高校圈',
        district: 'Yuelu',
        content: '[Bot] University area event calendar updated. Check latest campus activities.',
    },
    {
        topic: '社区生活',
        district: 'Yuhua',
        content: '[Bot] Community service and neighborhood notices are trending this morning.',
    },
    {
        topic: '长沙同城',
        district: 'Changsha',
        content: '[Bot] Citywide local conversations are active. Join topic threads and verify details.',
    },
];
function startOfToday() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}
async function main() {
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
            isBot: true,
            district: 'Changsha',
            bio: 'Automated account for city topic updates.',
        },
    });
    let published = 0;
    let skipped = 0;
    for (const seed of todaySeeds) {
        const topic = await prisma.topic.upsert({
            where: { name: seed.topic },
            update: {},
            create: { name: seed.topic },
        });
        const exists = await prisma.post.findFirst({
            where: {
                authorId: botUser.id,
                isBot: true,
                sourceLabel: 'hot-topics-bot',
                createdAt: {
                    gte: startOfToday(),
                },
                postTopics: {
                    some: {
                        topicId: topic.id,
                    },
                },
            },
            select: { id: true },
        });
        if (exists) {
            skipped += 1;
            continue;
        }
        await prisma.post.create({
            data: {
                authorId: botUser.id,
                content: seed.content,
                district: seed.district,
                isBot: true,
                sourceLabel: 'hot-topics-bot',
                imageUrls: "[]",
                postTopics: {
                    create: [
                        {
                            topicId: topic.id,
                        },
                    ],
                },
            },
        });
        published += 1;
    }
    console.log(JSON.stringify({
        success: true,
        published,
        skipped,
    }, null, 2));
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
//# sourceMappingURL=publish-hot-topics.js.map