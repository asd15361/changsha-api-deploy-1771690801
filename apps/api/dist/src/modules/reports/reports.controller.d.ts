import type { Request } from 'express';
import { ReportsService } from './reports.service';
type ReportBody = {
    targetType: 'post' | 'comment' | 'user';
    targetId: string;
    reason: string;
    detail?: string;
};
type AppealBody = {
    actionId: string;
    reason: string;
};
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    createReport(req: Request, body: ReportBody): Promise<{
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
    getMyReports(req: Request): Promise<{
        items: {
            id: string;
            status: string;
            createdAt: string;
        }[];
    }>;
    createAppeal(req: Request, body: AppealBody): {
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
    getMyAppeals(req: Request): {
        items: {
            id: string;
            status: string;
            createdAt: string;
        }[];
    };
}
export {};
