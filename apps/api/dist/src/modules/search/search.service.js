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
exports.SearchService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
function normalizeTopicName(input) {
    const trimmed = input.trim();
    if (trimmed.startsWith('#')) {
        return trimmed.slice(1);
    }
    return trimmed;
}
let SearchService = class SearchService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async searchUsers(query) {
        const q = query.trim();
        const items = await this.prisma.user.findMany({
            where: q
                ? {
                    nickname: {
                        contains: q,
                    },
                }
                : undefined,
            orderBy: {
                createdAt: 'desc',
            },
            take: 20,
            select: {
                id: true,
                nickname: true,
                district: true,
            },
        });
        return {
            query: q,
            items: items.map((item) => ({
                id: item.id,
                nickname: item.nickname,
                district: item.district ?? 'Changsha',
            })),
        };
    }
    async searchTopics(query) {
        const q = normalizeTopicName(query);
        const items = await this.prisma.topic.findMany({
            where: q
                ? {
                    name: {
                        contains: q,
                    },
                }
                : undefined,
            orderBy: {
                createdAt: 'desc',
            },
            take: 20,
        });
        return {
            query: q,
            items: items.map((item) => ({
                topic: item.name,
                postCount: 0,
            })),
        };
    }
    async getTopic(topic) {
        const topicName = normalizeTopicName(topic);
        const item = await this.prisma.topic.findUnique({
            where: { name: topicName },
            include: {
                _count: {
                    select: { posts: true },
                },
            },
        });
        if (!item) {
            throw new common_1.NotFoundException(`topic ${topicName} not found`);
        }
        return {
            topic: item.name,
            postCount: item._count.posts,
        };
    }
    async getTopicPosts(topic, cursor) {
        const topicName = normalizeTopicName(topic);
        const item = await this.prisma.topic.findUnique({
            where: { name: topicName },
            include: {
                posts: {
                    where: {
                        post: {
                            deletedAt: null,
                        },
                    },
                    orderBy: {
                        post: {
                            createdAt: 'desc',
                        },
                    },
                    take: 20,
                    include: {
                        post: {
                            select: {
                                id: true,
                                content: true,
                                createdAt: true,
                            },
                        },
                    },
                },
            },
        });
        if (!item) {
            throw new common_1.NotFoundException(`topic ${topicName} not found`);
        }
        return {
            topic: item.name,
            cursor: cursor ?? null,
            items: item.posts.map((postTopic) => ({
                id: postTopic.post.id,
                content: postTopic.post.content,
                createdAt: postTopic.post.createdAt.toISOString(),
            })),
        };
    }
};
exports.SearchService = SearchService;
exports.SearchService = SearchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SearchService);
//# sourceMappingURL=search.service.js.map