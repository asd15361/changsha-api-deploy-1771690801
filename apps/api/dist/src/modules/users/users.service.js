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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getUserByIdOrThrow(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException(`User ${userId} not found`);
        }
        return user;
    }
    async getMe(userId) {
        const user = await this.getUserByIdOrThrow(userId);
        return {
            id: user.id,
            phone: user.phone,
            nickname: user.nickname,
            district: user.district,
            avatarUrl: user.avatarUrl,
            status: user.status,
        };
    }
    async updateMe(userId, input) {
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: {
                nickname: input.nickname,
                bio: input.bio,
                district: input.district,
                avatarUrl: input.avatarUrl,
            },
        });
        return {
            success: true,
            profile: {
                id: updated.id,
                nickname: updated.nickname,
                bio: updated.bio,
                district: updated.district,
                avatarUrl: updated.avatarUrl,
            },
        };
    }
    async getUserProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                _count: {
                    select: {
                        followers: true,
                        following: true,
                        posts: true,
                    },
                },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException(`User ${userId} not found`);
        }
        return {
            id: user.id,
            nickname: user.nickname,
            bio: user.bio ?? '',
            district: user.district ?? 'Changsha',
            isBot: user.isBot,
            followers: user._count.followers,
            following: user._count.following,
            posts: user._count.posts,
        };
    }
    async follow(currentUserId, targetUserId) {
        if (currentUserId === targetUserId) {
            return { success: false, userId: targetUserId, message: 'Cannot follow self.' };
        }
        await this.getUserByIdOrThrow(targetUserId);
        await this.prisma.follow.upsert({
            where: {
                followerId_followingId: {
                    followerId: currentUserId,
                    followingId: targetUserId,
                },
            },
            update: {},
            create: {
                followerId: currentUserId,
                followingId: targetUserId,
            },
        });
        return { success: true, userId: targetUserId };
    }
    async unfollow(currentUserId, targetUserId) {
        await this.prisma.follow.deleteMany({
            where: {
                followerId: currentUserId,
                followingId: targetUserId,
            },
        });
        return { success: true, userId: targetUserId };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map