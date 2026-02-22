import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { recordAppEvent } from '../../common/analytics';
import { issueAccessToken } from '../../common/auth';
import { PocketBaseSyncService } from './pocketbase-sync.service';

type OtpItem = {
  code: string;
  expiresAt: number;
};

@Injectable()
export class AuthService {
  private readonly otpStore = new Map<string, OtpItem>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly pocketBaseSyncService: PocketBaseSyncService,
  ) {}

  private normalizePhone(phone: string): string {
    return phone.replace(/\s+/g, '');
  }

  private validatePhone(phone: string) {
    if (!/^1\d{10}$/.test(phone)) {
      throw new BadRequestException('Invalid phone format.');
    }
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private validateEmail(email: string) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('Invalid email format.');
    }
  }

  private validatePassword(password: string) {
    if (password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters.');
    }
  }

  private ensureCanLogin(status: string) {
    if (status === 'BANNED') {
      throw new UnauthorizedException('Account is banned.');
    }
  }

  private async generateUniquePhoneForEmail(): Promise<string> {
    for (let i = 0; i < 20; i += 1) {
      const candidate = `19${Math.floor(100000000 + Math.random() * 900000000)}`;
      const exists = await this.prisma.user.findUnique({
        where: { phone: candidate },
        select: { id: true },
      });
      if (!exists) return candidate;
    }
    throw new BadRequestException('Unable to allocate phone placeholder.');
  }

  sendCode(rawPhone: string) {
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
      // Dev helper: lets mobile test login without SMS service.
      ...(process.env.NODE_ENV !== 'production' ? { debugCode: code } : {}),
    };
  }

  async login(rawPhone: string, code: string, appIdRaw?: string) {
    const phone = this.normalizePhone(rawPhone);
    this.validatePhone(phone);
    const normalizedCode = code.trim();
    if (!/^\d{6}$/.test(normalizedCode)) {
      throw new BadRequestException('Invalid verification code format.');
    }

    const otpItem = this.otpStore.get(phone);
    if (
      !otpItem ||
      otpItem.expiresAt < Date.now() ||
      otpItem.code !== normalizedCode
    ) {
      throw new UnauthorizedException('Invalid or expired verification code.');
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
    this.ensureCanLogin(user.status);

    await this.pocketBaseSyncService.syncUserByPhone(
      phone,
      user.nickname,
      appIdRaw,
    );

    const token = issueAccessToken(user.id);
    await recordAppEvent(this.prisma, {
      eventName: 'auth_login_phone',
      userId: user.id,
      platform: appIdRaw?.trim() || 'mobile',
    });
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

  async registerEmail(
    rawEmail: string,
    rawPassword: string,
    appIdRaw?: string,
  ) {
    const email = this.normalizeEmail(rawEmail);
    const password = rawPassword.trim();
    this.validateEmail(email);
    this.validatePassword(password);

    const nickname = email.split('@')[0] || '新用户';
    await this.pocketBaseSyncService.registerEmailUser(
      email,
      password,
      nickname,
      appIdRaw,
    );

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
    this.ensureCanLogin(user.status);

    const token = issueAccessToken(user.id);
    await recordAppEvent(this.prisma, {
      eventName: 'auth_register_email',
      userId: user.id,
      platform: appIdRaw?.trim() || 'mobile',
    });
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

  async loginEmail(rawEmail: string, rawPassword: string, appIdRaw?: string) {
    const email = this.normalizeEmail(rawEmail);
    const password = rawPassword.trim();
    this.validateEmail(email);
    this.validatePassword(password);

    const pbUser = await this.pocketBaseSyncService.loginEmailUser(
      email,
      password,
      appIdRaw,
    );
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
    this.ensureCanLogin(user.status);

    const token = issueAccessToken(user.id);
    await recordAppEvent(this.prisma, {
      eventName: 'auth_login_email',
      userId: user.id,
      platform: appIdRaw?.trim() || 'mobile',
    });
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
}
