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
exports.PostsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let PostsService = class PostsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createPost(input) {
        const content = input.content?.trim();
        if (!content) {
            throw new common_1.BadRequestException('content is required');
        }
        const author = input.authorId != null
            ? await this.prisma.user.findUnique({ where: { id: input.authorId } })
            : null;
        if (!author) {
            throw new common_1.NotFoundException('author not found');
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
    async getPost(postId) {
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
            throw new common_1.NotFoundException(`post ${postId} not found`);
        }
        return {
            id: post.id,
            authorId: post.authorId,
            author: post.author,
            content: post.content,
            district: post.district,
            topics: post.postTopics?.map((item) => item.topic.name) ?? [],
            createdAt: post.createdAt.toISOString(),
        };
    }
    async deletePost(postId) {
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
            throw new common_1.NotFoundException(`post ${postId} not found`);
        }
        return { success: true, postId };
    }
    async deletePostByAuthor(postId, actorUserId) {
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
            throw new common_1.NotFoundException(`post ${postId} not found or not owned by actor`);
        }
        return { success: true, postId };
    }
};
exports.PostsService = PostsService;
exports.PostsService = PostsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PostsService);
//# sourceMappingURL=posts.service.js.map