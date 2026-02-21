import { AuthService } from './auth.service';
type SendCodeBody = {
    phone: string;
};
type LoginBody = {
    phone: string;
    code: string;
    appId?: string;
};
type RegisterEmailBody = {
    email: string;
    password: string;
    appId?: string;
};
type LoginEmailBody = {
    email: string;
    password: string;
    appId?: string;
};
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    sendCode(body: SendCodeBody): {
        debugCode?: string | undefined;
        success: boolean;
        phone: string;
        expiresInSeconds: number;
    };
    login(body: LoginBody): Promise<{
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
    registerEmail(body: RegisterEmailBody): Promise<{
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
    loginEmail(body: LoginEmailBody): Promise<{
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
export {};
