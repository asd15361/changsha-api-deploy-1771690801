import { PrismaService } from '../../prisma/prisma.service';
import { PocketBaseSyncService } from './pocketbase-sync.service';
export declare class AuthService {
    private readonly prisma;
    private readonly pocketBaseSyncService;
    private readonly otpStore;
    constructor(prisma: PrismaService, pocketBaseSyncService: PocketBaseSyncService);
    private normalizePhone;
    private validatePhone;
    private normalizeEmail;
    private validateEmail;
    private validatePassword;
    private generateUniquePhoneForEmail;
    sendCode(rawPhone: string): {
        debugCode?: string | undefined;
        success: boolean;
        phone: string;
        expiresInSeconds: number;
    };
    login(rawPhone: string, code: string, appIdRaw?: string): Promise<{
        success: boolean;
        token: string;
        refreshToken: string;
        user: {
            id: string;
            phone: string;
            nickname: string;
            district: string | null;
        };
    }>;
    registerEmail(rawEmail: string, rawPassword: string, appIdRaw?: string): Promise<{
        success: boolean;
        token: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            nickname: string;
            district: string | null;
        };
    }>;
    loginEmail(rawEmail: string, rawPassword: string, appIdRaw?: string): Promise<{
        success: boolean;
        token: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            nickname: string;
            district: string | null;
        };
    }>;
}
