import { PrismaService } from '../../prisma/prisma.service';
export type UpdateMeInput = {
    nickname?: string;
    bio?: string;
    district?: string;
    avatarUrl?: string;
};
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getUserByIdOrThrow(userId: string): Promise<{
        id: string;
        phone: string;
        email: string | null;
        nickname: string;
        bio: string | null;
        district: string | null;
        avatarUrl: string | null;
        status: string;
        isBot: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getMe(userId: string): Promise<{
        id: string;
        phone: string;
        nickname: string;
        district: string | null;
        avatarUrl: string | null;
        status: string;
    }>;
    updateMe(userId: string, input: UpdateMeInput): Promise<{
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
    follow(currentUserId: string, targetUserId: string): Promise<{
        success: boolean;
        userId: string;
        message: string;
    } | {
        success: boolean;
        userId: string;
        message?: undefined;
    }>;
    unfollow(currentUserId: string, targetUserId: string): Promise<{
        success: boolean;
        userId: string;
    }>;
}
