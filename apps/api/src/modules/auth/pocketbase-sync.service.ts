import { Injectable, Logger } from '@nestjs/common';

type PocketBaseAuthResponse = {
  token: string;
};

type PocketBaseUserAuthResponse = {
  token: string;
  record: {
    id: string;
    email: string;
    name?: string;
  };
};

type PocketBaseListResponse<T> = {
  items: T[];
};

type PocketBaseUserRecord = {
  id: string;
};

type PocketBaseUserAppRecord = {
  id: string;
};

@Injectable()
export class PocketBaseSyncService {
  private readonly logger = new Logger(PocketBaseSyncService.name);
  private readonly baseUrl = process.env.POCKETBASE_URL?.trim() ?? '';
  private readonly adminEmail = process.env.POCKETBASE_ADMIN_EMAIL?.trim() ?? '';
  private readonly adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD?.trim() ?? '';
  private readonly authCollectionName = process.env.POCKETBASE_AUTH_COLLECTION?.trim() || 'users';
  private readonly userAppsCollectionName = process.env.POCKETBASE_USER_APPS_COLLECTION?.trim() || 'user_apps';
  private readonly defaultAppId = process.env.POCKETBASE_DEFAULT_APP_ID?.trim() || 'mobile';
  private readonly allowedAppIds = (process.env.POCKETBASE_ALLOWED_APP_IDS?.trim() || 'mobile,web,admin')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  private isConfigured(): boolean {
    return Boolean(this.baseUrl && this.adminEmail && this.adminPassword);
  }

  private normalizeAppId(appIdRaw?: string): string {
    const candidate = (appIdRaw ?? this.defaultAppId).trim() || this.defaultAppId;
    if (!this.allowedAppIds.includes(candidate)) {
      this.logger.warn(`收到未白名单appId(${candidate})，已回退默认值(${this.defaultAppId})。`);
      return this.defaultAppId;
    }
    return candidate;
  }

  private toPocketBaseEmail(phone: string): string {
    return `${phone}@changshapulse.local`;
  }

  private toPocketBasePassword(phone: string): string {
    const salt = process.env.POCKETBASE_USER_PASSWORD_SALT?.trim() || 'changsha_pulse_pb_2026';
    const suffix = phone.slice(-6);
    return `Cp@${suffix}_${salt}`;
  }

  private formatNowIso(): string {
    return new Date().toISOString();
  }

  private async requestJson<T>(
    path: string,
    init?: RequestInit,
    expectedStatus: number[] = [200],
  ): Promise<T> {
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

    return (await response.json()) as T;
  }

  private async getSuperuserToken(): Promise<string> {
    const result = await this.requestJson<PocketBaseAuthResponse>(
      '/api/collections/_superusers/auth-with-password',
      {
        method: 'POST',
        body: JSON.stringify({
          identity: this.adminEmail,
          password: this.adminPassword,
        }),
      },
      [200],
    );

    return result.token;
  }

  private async findUserByEmail(superToken: string, email: string) {
    const escapedEmail = email.replace(/"/g, '\\"');
    return this.requestJson<PocketBaseListResponse<PocketBaseUserRecord>>(
      `/api/collections/${this.authCollectionName}/records?perPage=1&filter=${encodeURIComponent(`email=\"${escapedEmail}\"`)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${superToken}`,
        },
      },
      [200],
    );
  }

  private async authUserWithPassword(email: string, password: string) {
    return this.requestJson<PocketBaseUserAuthResponse>(
      `/api/collections/${this.authCollectionName}/auth-with-password`,
      {
        method: 'POST',
        body: JSON.stringify({
          identity: email,
          password,
        }),
      },
      [200],
    );
  }

  private async upsertUserAppsRecord(superToken: string, userId: string, appId: string) {
    const relationFilter = encodeURIComponent(`user=\"${userId}\" && appId=\"${appId}\"`);
    const list = await this.requestJson<PocketBaseListResponse<PocketBaseUserAppRecord>>(
      `/api/collections/${this.userAppsCollectionName}/records?perPage=1&filter=${relationFilter}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${superToken}`,
        },
      },
      [200],
    );

    const now = this.formatNowIso();
    if (list.items.length > 0) {
      await this.requestJson(
        `/api/collections/${this.userAppsCollectionName}/records/${list.items[0].id}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${superToken}`,
          },
          body: JSON.stringify({
            status: 'active',
            lastLoginAt: now,
          }),
        },
        [200],
      );
      return;
    }

    await this.requestJson(
      `/api/collections/${this.userAppsCollectionName}/records`,
      {
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
      },
      [200],
    );
  }

  async syncUserByPhone(phone: string, nickname: string, appIdRaw?: string): Promise<void> {
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
        await this.requestJson(
          `/api/collections/${this.authCollectionName}/records/${userId}`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${superToken}`,
            },
            body: JSON.stringify({
              name: nickname,
              verified: true,
            }),
          },
          [200],
        );
      } else {
        const created = await this.requestJson<{ id: string }>(
          `/api/collections/${this.authCollectionName}/records`,
          {
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
          },
          [200],
        );
        userId = created.id;
      }

      await this.upsertUserAppsRecord(superToken, userId, appId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`PocketBase用户同步失败: ${message}`);
      throw error;
    }
  }

  async registerEmailUser(
    emailRaw: string,
    password: string,
    nickname: string,
    appIdRaw?: string,
  ): Promise<{ id: string; email: string; name: string }> {
    if (!this.isConfigured()) {
      throw new Error('PocketBase配置不完整，无法注册邮箱用户。');
    }

    const email = emailRaw.trim().toLowerCase();
    const appId = this.normalizeAppId(appIdRaw);
    const superToken = await this.getSuperuserToken();
    const created = await this.requestJson<{ id: string; email: string; name?: string }>(
      `/api/collections/${this.authCollectionName}/records`,
      {
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
      },
      [200],
    );
    await this.upsertUserAppsRecord(superToken, created.id, appId);

    return {
      id: created.id,
      email: created.email,
      name: created.name || nickname,
    };
  }

  async loginEmailUser(
    emailRaw: string,
    password: string,
    appIdRaw?: string,
  ): Promise<{ id: string; email: string; name: string }> {
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
}
