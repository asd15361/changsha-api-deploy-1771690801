import { PrismaService } from '../../prisma/prisma.service';
type ReportAction = 'ignore' | 'delete_post' | 'delete_comment' | 'mute_user' | 'ban_user';
type UserStatusInput = 'normal' | 'limited' | 'muted' | 'banned';
export declare class AdminService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private mapAction;
    private mapUserStatus;
    getReports(): Promise<{
        items: {
            id: string;
            status: string;
            targetType: string;
            targetId: string;
            reason: string;
            createdAt: string;
        }[];
    }>;
    handleReport(reportId: string, action: ReportAction, note?: string): Promise<{
        success: boolean;
        reportId: string;
        action: ReportAction;
    }>;
    updateUserStatus(userId: string, status: UserStatusInput): Promise<{
        success: boolean;
        userId: string;
        status: string;
    }>;
    adminDeletePost(postId: string): Promise<{
        success: boolean;
        postId: string;
    }>;
    adminDeleteComment(commentId: string): Promise<{
        success: boolean;
        commentId: string;
    }>;
}
export {};
