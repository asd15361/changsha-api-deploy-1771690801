"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const auth_1 = require("../../common/auth");
const pocketbase_sync_service_1 = require("./pocketbase-sync.service");
let AuthService = class AuthService {
    prisma;
    pocketBaseSyncService;
    otpStore = new Map();
    constructor(prisma, pocketBaseSyncService) {
        this.prisma = prisma;
        this.pocketBaseSyncService = pocketBaseSyncService;
    }
    normalizePhone(phone) {
        return phone.replace(/\s+/g, '');
    }
    validatePhone(phone) {
        if (!/^1\d{10}$/.test(phone)) {
            throw new common_1.BadRequestException('Invalid phone format.');
        }
    }
    normalizeEmail(email) {
        return email.trim().toLowerCase();
    }
    validateEmail(email) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new common_1.BadRequestException('Invalid email format.');
        }
    }
    validatePassword(password) {
        if (password.length < 8) {
            throw new common_1.BadRequestException('Password must be at least 8 characters.');
        }
    }
    async generateUniquePhoneForEmail() {
        for (let i = 0; i < 20; i += 1) {
            const candidate = `19${Math.floor(100000000 + Math.random() * 900000000)}`;
            const exists = await this.prisma.user.findUnique({ where: { phone: candidate }, select: { id: true } });
            if (!exists)
                return candidate;
        }
        throw new common_1.BadRequestException('Unable to allocate phone placeholder.');
    }
    sendCode(rawPhone) {
        const phone = this.normalizePhone(rawPhone);
        this.validatePhone(phone);
        const code = String(Math.floor(100000 + Math.random() * 900000));
        const expiresInSeconds = 300;
        this.otpStore.set(phone, {
            code,
            expiresAt: Date.now() + expiresInSeconds * 1000,
        });
        return {
            success: true,
            phone,
            expiresInSeconds,
            ...(process.env.NODE_ENV !== 'production' ? { debugCode: code } : {}),
        };
    }
    async login(rawPhone, code, appIdRaw) {
        const phone = this.normalizePhone(rawPhone);
        this.validatePhone(phone);
        const normalizedCode = code.trim();
        if (!/^\d{6}$/.test(normalizedCode)) {
            throw new common_1.BadRequestException('Invalid verification code format.');
        }
        const otpItem = this.otpStore.get(phone);
        if (!otpItem || otpItem.expiresAt < Date.now() || otpItem.code !== normalizedCode) {
            throw new common_1.UnauthorizedException('Invalid or expired verification code.');
        }
        this.otpStore.delete(phone);
        const user = await this.prisma.user.upsert({
            where: { phone },
            update: {},
            create: {
                phone,
                nickname: `用户${phone.slice(-4)}`,
                district: 'Changsha',
            },
        });
        await this.pocketBaseSyncService.syncUserByPhone(phone, user.nickname, appIdRaw);
        const token = (0, auth_1.issueAccessToken)(user.id);
        return {
            success: true,
            token,
            refreshToken: token,
            user: {
                id: user.id,
                phone: user.phone,
                nickname: user.nickname,
                district: user.district,
            },
        };
    }
    async registerEmail(rawEmail, rawPassword, appIdRaw) {
        const email = this.normalizeEmail(rawEmail);
        const password = rawPassword.trim();
        this.validateEmail(email);
        this.validatePassword(password);
        const nickname = email.split('@')[0] || '新用户';
        await this.pocketBaseSyncService.registerEmailUser(email, password, nickname, appIdRaw);
        const user = await this.prisma.user.upsert({
            where: { email },
            update: { nickname },
            create: {
                email,
                phone: await this.generateUniquePhoneForEmail(),
                nickname,
                district: 'Changsha',
            },
        });
        const token = (0, auth_1.issueAccessToken)(user.id);
        return {
            success: true,
            token,
            refreshToken: token,
            user: {
                id: user.id,
                email,
                nickname: user.nickname,
                district: user.district,
            },
        };
    }
    async loginEmail(rawEmail, rawPassword, appIdRaw) {
        const email = this.normalizeEmail(rawEmail);
        const password = rawPassword.trim();
        this.validateEmail(email);
        this.validatePassword(password);
        const pbUser = await this.pocketBaseSyncService.loginEmailUser(email, password, appIdRaw);
        const user = await this.prisma.user.upsert({
            where: { email },
            update: { nickname: pbUser.name || email.split('@')[0] },
            create: {
                email,
                phone: await this.generateUniquePhoneForEmail(),
                nickname: pbUser.name || email.split('@')[0],
                district: 'Changsha',
            },
        });
        const token = (0, auth_1.issueAccessToken)(user.id);
        return {
            success: true,
            token,
            refreshToken: token,
            user: {
                id: user.id,
                email,
                nickname: user.nickname,
                district: user.district,
            },
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        pocketbase_sync_service_1.PocketBaseSyncService])
], AuthService);
//# sourceMappingURL=auth.service.js.map