import type { Request } from 'express';
import { UsersService } from './users.service';
type UpdateMeBody = {
    nickname?: string;
    bio?: string;
    district?: string;
    avatarUrl?: string;
};
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getMe(req: Request): Promise<{
        id: string;
        phone: string;
        nickname: string;
        district: string | null;
        avatarUrl: string | null;
        status: string;
    }>;
    updateMe(req: Request, body: UpdateMeBody): Promise<{
        success: boolean;
        profile: {
            id: string;
            nickname: string;
            bio: string | null;
            district: string | null;
            avatarUrl: string | null;
        };
    }>;
    getUserProfile(userId: string): Promise<{
        id: string;
        nickname: string;
        bio: string;
        district: string;
        isBot: boolean;
        followers: number;
        following: number;
        posts: number;
    }>;
    follow(req: Request, userId: string): Promise<{
        success: boolean;
        userId: string;
        message: string;
    } | {
        success: boolean;
        userId: string;
        message?: undefined;
    }>;
    unfollow(req: Request, userId: string): Promise<{
        success: boolean;
        userId: string;
    }>;
}
export {};
