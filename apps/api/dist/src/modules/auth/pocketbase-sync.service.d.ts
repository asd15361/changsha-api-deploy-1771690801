export declare class PocketBaseSyncService {
    private readonly logger;
    private readonly baseUrl;
    private readonly adminEmail;
    private readonly adminPassword;
    private readonly authCollectionName;
    private readonly userAppsCollectionName;
    private readonly defaultAppId;
    private readonly allowedAppIds;
    private isConfigured;
    private normalizeAppId;
    private toPocketBaseEmail;
    private toPocketBasePassword;
    private formatNowIso;
    private requestJson;
    private getSuperuserToken;
    private findUserByEmail;
    private authUserWithPassword;
    private upsertUserAppsRecord;
    syncUserByPhone(phone: string, nickname: string, appIdRaw?: string): Promise<void>;
    registerEmailUser(emailRaw: string, password: string, nickname: string, appIdRaw?: string): Promise<{
        id: string;
        email: string;
        name: string;
    }>;
    loginEmailUser(emailRaw: string, password: string, appIdRaw?: string): Promise<{
        id: string;
        email: string;
        name: string;
    }>;
}
