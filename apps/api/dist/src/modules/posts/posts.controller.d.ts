import type { Request } from 'express';
import { PostsService } from './posts.service';
type CreatePostBody = {
    content: string;
    district?: string;
    topics?: string[];
    imageUrls?: string[];
};
export declare class PostsController {
    private readonly postsService;
    constructor(postsService: PostsService);
    createPost(req: Request, body: CreatePostBody): Promise<{
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
    deletePost(req: Request, postId: string): Promise<{
        success: boolean;
        postId: string;
    }>;
}
export {};
