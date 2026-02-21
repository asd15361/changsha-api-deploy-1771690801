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
exports.FeedsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
function normalizeLimit(limit) {
    const parsed = Number(limit ?? 20);
    if (Number.isNaN(parsed))
        return 20;
    return Math.max(1, Math.min(50, parsed));
}
async function buildCursorWhere(prisma, cursor) {
    if (!cursor)
        return null;
    const item = await prisma.post.findUnique({
        where: { id: cursor },
        select: { id: true, createdAt: true },
    });
    if (!item)
        return null;
    return {
        OR: [
            { createdAt: { lt: item.createdAt } },
            {
                AND: [{ createdAt: item.createdAt }, { id: { lt: item.id } }],
            },
        ],
    };
}
function mapFeedItem(item) {
    return {
        id: item.id,
        authorId: item.authorId,
        author: item.author,
        content: item.content,
        district: item.district ?? 'Changsha',
        isBot: item.isBot,
        createdAt: item.createdAt.toISOString(),
    };
}
let FeedsService = class FeedsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getFollowingFeed(userId, query) {
        const limit = normalizeLimit(query.limit);
        const cursorWhere = await buildCursorWhere(this.prisma, query.cursor);
        const where = {
            deletedAt: null,
            ...(cursorWhere ? { AND: [cursorWhere] } : {}),
            OR: [
                { authorId: userId },
                {
                    author: {
                        followers: {
                            some: {
                                followerId: userId,
                            },
                        },
                    },
                },
            ],
        };
        const items = await this.prisma.post.findMany({
            where,
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            take: limit,
            include: {
                author: {
                    select: {
                        id: true,
                        nickname: true,
                        isBot: true,
                    },
                },
            },
        });
        const mapped = items.map(mapFeedItem);
        return {
            items: mapped,
            nextCursor: mapped.length === limit ? mapped[mapped.length - 1].id : null,
            limit,
            cursor: query.cursor ?? null,
        };
    }
    async getLocalFeed(query) {
        const limit = normalizeLimit(query.limit);
        const cursorWhere = await buildCursorWhere(this.prisma, query.cursor);
        const andClauses = [];
        if (query.district) {
            andClauses.push({ district: query.district });
        }
        if (cursorWhere) {
            andClauses.push(cursorWhere);
        }
        const rawItems = await this.prisma.post.findMany({
            where: {
                deletedAt: null,
                ...(andClauses.length > 0 ? { AND: andClauses } : {}),
            },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            take: limit * 6,
            include: {
                author: {
                    select: {
                        id: true,
                        nickname: true,
                        isBot: true,
                    },
                },
            },
        });
        const botLimit = Math.floor(limit * 0.2);
        let botCount = 0;
        const filtered = [];
        for (const item of rawItems) {
            if (item.isBot) {
                if (botCount >= botLimit)
                    continue;
                botCount += 1;
            }
            filtered.push(item);
            if (filtered.length >= limit)
                break;
        }
        const mapped = filtered.map(mapFeedItem);
        return {
            items: mapped,
            nextCursor: mapped.length === limit ? mapped[mapped.length - 1].id : null,
            limit,
            district: query.district ?? 'all',
            cursor: query.cursor ?? null,
            botRatioLimit: 0.2,
        };
    }
};
exports.FeedsService = FeedsService;
exports.FeedsService = FeedsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FeedsService);
//# sourceMappingURL=feeds.service.js.map