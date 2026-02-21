import { PrismaService } from '../../prisma/prisma.service';
type CreateReportInput = {
    targetType: 'post' | 'comment' | 'user';
    targetId: string;
    reason: string;
    detail?: string;
};
type AppealInput = {
    actionId: string;
    reason: string;
};
export declare class ReportsService {
    private readonly prisma;
    private readonly appealStore;
    constructor(prisma: PrismaService);
    private mapTargetType;
    createReport(userId: string, input: CreateReportInput): Promise<{
        success: boolean;
        reportId: string;
        report: {
            id: string;
            targetType: string;
            targetId: string;
            reason: string;
            detail: string | null;
            status: string;
            createdAt: string;
        };
    }>;
    getMyReports(userId: string): Promise<{
        items: {
            id: string;
            status: string;
            createdAt: string;
        }[];
    }>;
    createAppeal(userId: string, input: AppealInput): {
        success: boolean;
        appealId: string;
        appeal: {
            id: string;
            userId: string;
            actionId: string;
            reason: string;
            createdAt: string;
        };
    };
    getMyAppeals(userId: string): {
        items: {
            id: string;
            status: string;
            createdAt: string;
        }[];
    };
}
export {};
