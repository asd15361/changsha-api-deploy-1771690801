type ReadNotificationsBody = {
    ids: string[];
};
export declare class NotificationsController {
    getNotifications(): {
        items: Array<{
            id: string;
            type: string;
            message: string;
            createdAt: string;
            read: boolean;
        }>;
    };
    markRead(body: ReadNotificationsBody): {
        success: boolean;
        ids: string[];
    };
}
export {};
