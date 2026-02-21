"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var PocketBaseSyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PocketBaseSyncService = void 0;
const common_1 = require("@nestjs/common");
let PocketBaseSyncService = PocketBaseSyncService_1 = class PocketBaseSyncService {
    logger = new common_1.Logger(PocketBaseSyncService_1.name);
    baseUrl = process.env.POCKETBASE_URL?.trim() ?? '';
    adminEmail = process.env.POCKETBASE_ADMIN_EMAIL?.trim() ?? '';
    adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD?.trim() ?? '';
    authCollectionName = process.env.POCKETBASE_AUTH_COLLECTION?.trim() || 'users';
    userAppsCollectionName = process.env.POCKETBASE_USER_APPS_COLLECTION?.trim() || 'user_apps';
    defaultAppId = process.env.POCKETBASE_DEFAULT_APP_ID?.trim() || 'mobile';
    allowedAppIds = (process.env.POCKETBASE_ALLOWED_APP_IDS?.trim() || 'mobile,web,admin')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    isConfigured() {
        return Boolean(this.baseUrl && this.adminEmail && this.adminPassword);
    }
    normalizeAppId(appIdRaw) {
        const candidate = (appIdRaw ?? this.defaultAppId).trim() || this.defaultAppId;
        if (!this.allowedAppIds.includes(candidate)) {
            this.logger.warn(`收到未白名单appId(${candidate})，已回退默认值(${this.defaultAppId})。`);
            return this.defaultAppId;
        }
        return candidate;
    }
    toPocketBaseEmail(phone) {
        return `${phone}@changshapulse.local`;
    }
    toPocketBasePassword(phone) {
        const salt = process.env.POCKETBASE_USER_PASSWORD_SALT?.trim() || 'changsha_pulse_pb_2026';
        const suffix = phone.slice(-6);
        return `Cp@${suffix}_${salt}`;
    }
    formatNowIso() {
        return new Date().toISOString();
    }
    async requestJson(path, init, expectedStatus = [200]) {
        const response = await fetch(`${this.baseUrl}${path}`, {
            ...init,
            headers: {
                'Content-Type': 'application/json',
                ...(init?.headers ?? {}),
            },
        });
        if (!expectedStatus.includes(response.status)) {
            const text = await response.text();
            throw new Error(`PocketBase ${response.status}: ${text}`);
        }
        return (await response.json());
    }
    async getSuperuserToken() {
        const result = await this.requestJson('/api/collections/_superusers/auth-with-password', {
            method: 'POST',
            body: JSON.stringify({
                identity: this.adminEmail,
                password: this.adminPassword,
            }),
        }, [200]);
        return result.token;
    }
    async findUserByEmail(superToken, email) {
        const escapedEmail = email.replace(/"/g, '\\"');
        return this.requestJson(`/api/collections/${this.authCollectionName}/records?perPage=1&filter=${encodeURIComponent(`email=\"${escapedEmail}\"`)}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${superToken}`,
            },
        }, [200]);
    }
    async authUserWithPassword(email, password) {
        return this.requestJson(`/api/collections/${this.authCollectionName}/auth-with-password`, {
            method: 'POST',
            body: JSON.stringify({
                identity: email,
                password,
            }),
        }, [200]);
    }
    async upsertUserAppsRecord(superToken, userId, appId) {
        const relationFilter = encodeURIComponent(`user=\"${userId}\" && appId=\"${appId}\"`);
        const list = await this.requestJson(`/api/collections/${this.userAppsCollectionName}/records?perPage=1&filter=${relationFilter}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${superToken}`,
            },
        }, [200]);
        const now = this.formatNowIso();
        if (list.items.length > 0) {
            await this.requestJson(`/api/collections/${this.userAppsCollectionName}/records/${list.items[0].id}`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${superToken}`,
                },
                body: JSON.stringify({
                    status: 'active',
                    lastLoginAt: now,
                }),
            }, [200]);
            return;
        }
        await this.requestJson(`/api/collections/${this.userAppsCollectionName}/records`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${superToken}`,
            },
            body: JSON.stringify({
                user: userId,
                appId,
                role: 'member',
                status: 'active',
                firstLoginAt: now,
                lastLoginAt: now,
            }),
        }, [200]);
    }
    async syncUserByPhone(phone, nickname, appIdRaw) {
        if (!this.isConfigured()) {
            this.logger.warn('PocketBase未配置完整，跳过用户同步。');
            return;
        }
        const appId = this.normalizeAppId(appIdRaw);
        const email = this.toPocketBaseEmail(phone);
        const password = this.toPocketBasePassword(phone);
        try {
            const superToken = await this.getSuperuserToken();
            const userList = await this.findUserByEmail(superToken, email);
            let userId = '';
            if (userList.items.length > 0) {
                userId = userList.items[0].id;
                await this.requestJson(`/api/collections/${this.authCollectionName}/records/${userId}`, {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${superToken}`,
                    },
                    body: JSON.stringify({
                        name: nickname,
                        verified: true,
                    }),
                }, [200]);
            }
            else {
                const created = await this.requestJson(`/api/collections/${this.authCollectionName}/records`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${superToken}`,
                    },
                    body: JSON.stringify({
                        email,
                        password,
                        passwordConfirm: password,
                        verified: true,
                        name: nickname,
                    }),
                }, [200]);
                userId = created.id;
            }
            await this.upsertUserAppsRecord(superToken, userId, appId);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.error(`PocketBase用户同步失败: ${message}`);
            throw error;
        }
    }
    async registerEmailUser(emailRaw, password, nickname, appIdRaw) {
        if (!this.isConfigured()) {
            throw new Error('PocketBase配置不完整，无法注册邮箱用户。');
        }
        const email = emailRaw.trim().toLowerCase();
        const appId = this.normalizeAppId(appIdRaw);
        const superToken = await this.getSuperuserToken();
        const created = await this.requestJson(`/api/collections/${this.authCollectionName}/records`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${superToken}`,
            },
            body: JSON.stringify({
                email,
                password,
                passwordConfirm: password,
                verified: true,
                name: nickname,
            }),
        }, [200]);
        await this.upsertUserAppsRecord(superToken, created.id, appId);
        return {
            id: created.id,
            email: created.email,
            name: created.name || nickname,
        };
    }
    async loginEmailUser(emailRaw, password, appIdRaw) {
        if (!this.isConfigured()) {
            throw new Error('PocketBase配置不完整，无法邮箱登录。');
        }
        const email = emailRaw.trim().toLowerCase();
        const appId = this.normalizeAppId(appIdRaw);
        const authResult = await this.authUserWithPassword(email, password);
        const superToken = await this.getSuperuserToken();
        await this.upsertUserAppsRecord(superToken, authResult.record.id, appId);
        return {
            id: authResult.record.id,
            email: authResult.record.email,
            name: authResult.record.name || email.split('@')[0],
        };
    }
};
exports.PocketBaseSyncService = PocketBaseSyncService;
exports.PocketBaseSyncService = PocketBaseSyncService = PocketBaseSyncService_1 = __decorate([
    (0, common_1.Injectable)()
], PocketBaseSyncService);
//# sourceMappingURL=pocketbase-sync.service.js.map