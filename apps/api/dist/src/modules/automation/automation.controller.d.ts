import { AutomationService } from './automation.service';
export declare class AutomationController {
    private readonly automationService;
    constructor(automationService: AutomationService);
    publishHotTopics(): Promise<{
        success: boolean;
        published: number;
        skipped: number;
    }>;
}
