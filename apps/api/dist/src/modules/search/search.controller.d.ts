import { SearchService } from './search.service';
export declare class SearchController {
    private readonly searchService;
    constructor(searchService: SearchService);
    searchUsers(q?: string): Promise<{
        query: string;
        items: {
            id: string;
            nickname: string;
            district: string;
        }[];
    }>;
    searchTopics(q?: string): Promise<{
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
