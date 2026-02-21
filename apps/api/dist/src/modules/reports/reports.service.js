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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let ReportsService = class ReportsService {
    prisma;
    appealStore = [];
    constructor(prisma) {
        this.prisma = prisma;
    }
    mapTargetType(type) {
        if (type === 'post')
            return 'POST';
        if (type === 'comment')
            return 'COMMENT';
        return 'USER';
    }
    async createReport(userId, input) {
        const report = await this.prisma.report.create({
            data: {
                reporterId: userId,
                targetType: this.mapTargetType(input.targetType),
                targetId: input.targetId,
                reason: input.reason,
                detail: input.detail,
            },
        });
        return {
            success: true,
            reportId: report.id,
            report: {
                id: report.id,
                targetType: report.targetType,
                targetId: report.targetId,
                reason: report.reason,
                detail: report.detail,
                status: report.status,
                createdAt: report.createdAt.toISOString(),
            },
        };
    }
    async getMyReports(userId) {
        const items = await this.prisma.report.findMany({
            where: { reporterId: userId },
            orderBy: [{ createdAt: 'desc' }],
            take: 100,
        });
        return {
            items: items.map((item) => ({
                id: item.id,
                status: item.status.toLowerCase(),
                createdAt: item.createdAt.toISOString(),
            })),
        };
    }
    createAppeal(userId, input) {
        const appeal = {
            id: `appeal_${Date.now()}`,
            userId,
            actionId: input.actionId,
            reason: input.reason,
            createdAt: new Date().toISOString(),
        };
        this.appealStore.unshift(appeal);
        return {
            success: true,
            appealId: appeal.id,
            appeal,
        };
    }
    getMyAppeals(userId) {
        return {
            items: this.appealStore
                .filter((item) => item.userId === userId)
                .slice(0, 100)
                .map((item) => ({
                id: item.id,
                status: 'pending',
                createdAt: item.createdAt,
            })),
        };
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map