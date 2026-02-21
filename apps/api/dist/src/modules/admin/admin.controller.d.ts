import { AdminService } from './admin.service';
type ReportActionBody = {
    action: 'ignore' | 'delete_post' | 'delete_comment' | 'mute_user' | 'ban_user';
    note?: string;
};
type UserStatusBody = {
    status: 'normal' | 'limited' | 'muted' | 'banned';
    note?: string;
};
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
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
    handleReport(reportId: string, body: ReportActionBody): Promise<{
        success: boolean;
        reportId: string;
        action: "ignore" | "delete_post" | "delete_comment" | "mute_user" | "ban_user";
    }>;
    updateUserStatus(userId: string, body: UserStatusBody): Promise<{
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
