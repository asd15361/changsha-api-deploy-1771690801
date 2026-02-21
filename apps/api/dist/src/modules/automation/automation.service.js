"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutomationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const posts_service_1 = require("../posts/posts.service");
const defaultSeeds = [
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
let AutomationService = class AutomationService {
    prisma;
    postsService;
    constructor(prisma, postsService) {
        this.prisma = prisma;
        this.postsService = postsService;
    }
    startOfToday() {
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
};
exports.AutomationService = AutomationService;
exports.AutomationService = AutomationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        posts_service_1.PostsService])
], AutomationService);
//# sourceMappingURL=automation.service.js.map