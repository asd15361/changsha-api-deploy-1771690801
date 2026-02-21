import { PrismaService } from '../../prisma/prisma.service';
export type CreatePostInput = {
    content: string;
    district?: string;
    topics?: string[];
    imageUrls?: string[];
    authorId?: string;
    isBot?: boolean;
    sourceLabel?: string;
};
export declare class PostsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createPost(input: CreatePostInput): Promise<{
        success: boolean;
        postId: string;
        content: string;
        topics: string[];
    }>;
    getPost(postId: string): Promise<{
        id: string;
        authorId: string;
        author: {
            id: string;
            nickname: string;
            isBot: boolean;
        };
        content: string;
        district: string | null;
        topics: any[];
        createdAt: string;
    }>;
    deletePost(postId: string): Promise<{
        success: boolean;
        postId: string;
    }>;
    deletePostByAuthor(postId: string, actorUserId: string): Promise<{
        success: boolean;
        postId: string;
    }>;
}
