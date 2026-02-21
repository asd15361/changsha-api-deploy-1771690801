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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let AdminService = class AdminService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    mapAction(action) {
        if (action === 'ignore')
            return 'IGNORE';
        if (action === 'delete_post')
            return 'DELETE_POST';
        if (action === 'delete_comment')
            return 'DELETE_COMMENT';
        if (action === 'mute_user')
            return 'MUTE_USER';
        return 'BAN_USER';
    }
    mapUserStatus(status) {
        if (status === 'normal')
            return 'NORMAL';
        if (status === 'limited')
            return 'LIMITED';
        if (status === 'muted')
            return 'MUTED';
        return 'BANNED';
    }
    async getReports() {
        const items = await this.prisma.report.findMany({
            orderBy: [{ createdAt: 'desc' }],
            take: 100,
        });
        return {
            items: items.map((item) => ({
                id: item.id,
                status: item.status.toLowerCase(),
                targetType: item.targetType.toLowerCase(),
                targetId: item.targetId,
                reason: item.reason,
                createdAt: item.createdAt.toISOString(),
            })),
        };
    }
    async handleReport(reportId, action, note) {
        const report = await this.prisma.report.findUnique({
            where: { id: reportId },
        });
        if (!report) {
            throw new common_1.NotFoundException(`Report ${reportId} not found`);
        }
        if (action === 'delete_post') {
            await this.prisma.post.updateMany({
                where: { id: report.targetId, deletedAt: null },
                data: { deletedAt: new Date() },
            });
        }
        if (action === 'delete_comment') {
            await this.prisma.comment.updateMany({
                where: { id: report.targetId, deletedAt: null },
                data: { deletedAt: new Date() },
            });
        }
        if (action === 'mute_user' || action === 'ban_user') {
            const status = action === 'mute_user' ? 'MUTED' : 'BANNED';
            await this.prisma.user.updateMany({
                where: { id: report.targetId },
                data: { status },
            });
        }
        await this.prisma.moderationAction.create({
            data: {
                reportId,
                actionType: this.mapAction(action),
                note,
            },
        });
        await this.prisma.report.update({
            where: { id: reportId },
            data: { status: 'RESOLVED' },
        });
        return { success: true, reportId, action };
    }
    async updateUserStatus(userId, status) {
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: { status: this.mapUserStatus(status) },
            select: { id: true, status: true },
        });
        return {
            success: true,
            userId: updated.id,
            status: updated.status.toLowerCase(),
        };
    }
    async adminDeletePost(postId) {
        await this.prisma.post.updateMany({
            where: { id: postId, deletedAt: null },
            data: { deletedAt: new Date() },
        });
        return { success: true, postId };
    }
    async adminDeleteComment(commentId) {
        await this.prisma.comment.updateMany({
            where: { id: commentId, deletedAt: null },
            data: { deletedAt: new Date() },
        });
        return { success: true, commentId };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map