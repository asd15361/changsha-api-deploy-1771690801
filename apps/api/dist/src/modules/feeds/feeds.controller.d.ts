import type { Request } from 'express';
import { FeedsService } from './feeds.service';
export declare class FeedsController {
    private readonly feedsService;
    constructor(feedsService: FeedsService);
    getFollowingFeed(req: Request, cursor?: string, limit?: string): Promise<{
        items: {
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
        }[];
        nextCursor: string | null;
        limit: number;
        cursor: string | null;
    }>;
    getLocalFeed(cursor?: string, limit?: string, district?: string): Promise<{
        items: {
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
        }[];
        nextCursor: string | null;
        limit: number;
        district: string;
        cursor: string | null;
        botRatioLimit: number;
    }>;
}
