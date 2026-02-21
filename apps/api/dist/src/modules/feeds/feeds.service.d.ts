import { PrismaService } from '../../prisma/prisma.service';
type FeedQuery = {
    cursor?: string;
    limit?: string;
    district?: string;
};
type FeedItem = {
    id: string;
    authorId: string;
    author: {
        id: string;
        nickname: string;
        isBot: boolean;
    };
    content: string;
    district: string;
    isBot: boolean;
    createdAt: string;
};
export declare class FeedsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getFollowingFeed(userId: string, query: FeedQuery): Promise<{
        items: FeedItem[];
        nextCursor: string | null;
        limit: number;
        cursor: string | null;
    }>;
    getLocalFeed(query: FeedQuery): Promise<{
        items: FeedItem[];
        nextCursor: string | null;
        limit: number;
        district: string;
        cursor: string | null;
        botRatioLimit: number;
    }>;
}
export {};
