import { PrismaService } from '../../prisma/prisma.service';
import { PostsService } from '../posts/posts.service';
export declare class AutomationService {
    private readonly prisma;
    private readonly postsService;
    constructor(prisma: PrismaService, postsService: PostsService);
    private startOfToday;
    publishHotTopics(): Promise<{
        success: boolean;
        published: number;
        skipped: number;
    }>;
}
