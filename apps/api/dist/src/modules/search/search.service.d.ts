import { PrismaService } from '../../prisma/prisma.service';
export declare class SearchService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    searchUsers(query: string): Promise<{
        query: string;
        items: {
            id: string;
            nickname: string;
            district: string;
        }[];
    }>;
    searchTopics(query: string): Promise<{
        query: string;
        items: {
            topic: string;
            postCount: number;
        }[];
    }>;
    getTopic(topic: string): Promise<{
        topic: string;
        postCount: number;
    }>;
    getTopicPosts(topic: string, cursor?: string): Promise<{
        topic: string;
        cursor: string | null;
        items: {
            id: string;
            content: string;
            createdAt: string;
        }[];
    }>;
}
