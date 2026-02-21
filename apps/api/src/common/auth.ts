import { UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';

const TOKEN_VERSION = 'cspv1';
const LEGACY_PREFIX = 'devtoken.';
const DEFAULT_EXPIRES_IN_SECONDS = 7 * 24 * 60 * 60;

type AccessTokenPayload = {
  sub: string;
  iat: number;
  exp: number;
};

function base64UrlEncode(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64url');
}

function base64UrlDecode(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8');
}

function readSecret(): string {
  const envSecret = process.env.ACCESS_TOKEN_SECRET?.trim();
  if (envSecret) return envSecret;

  const legacySalt = process.env.POCKETBASE_USER_PASSWORD_SALT?.trim();
  if (legacySalt) return legacySalt;

  return 'changsha-local-access-token-secret';
}

function readExpiresInSeconds(): number {
  const raw = process.env.ACCESS_TOKEN_EXPIRES_IN_SECONDS?.trim();
  const parsed = raw ? Number(raw) : NaN;
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.floor(parsed);
  }
  return DEFAULT_EXPIRES_IN_SECONDS;
}

function signPayload(payloadBase64: string): string {
  return createHmac('sha256', readSecret())
    .update(payloadBase64)
    .digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

function parseBearerToken(
  authHeader: string | string[] | undefined,
): string | null {
  if (!authHeader) return null;
  const raw = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  if (!raw) return null;
  return raw.startsWith('Bearer ')
    ? raw.slice('Bearer '.length).trim()
    : raw.trim();
}

function allowLegacyDevToken(): boolean {
  return process.env.ALLOW_LEGACY_DEVTOKEN?.trim() === 'true';
}

export function issueAccessToken(userId: string): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: AccessTokenPayload = {
    sub: userId,
    iat: now,
    exp: now + readExpiresInSeconds(),
  };

  const payloadBase64 = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(payloadBase64);
  return `${TOKEN_VERSION}.${payloadBase64}.${signature}`;
}

export function parseUserIdFromAuthorizationHeader(
  authHeader: string | string[] | undefined,
): string | null {
  const bearer = parseBearerToken(authHeader);
  if (!bearer) return null;

  if (allowLegacyDevToken() && bearer.startsWith(LEGACY_PREFIX)) {
    const userId = bearer.slice(LEGACY_PREFIX.length).trim();
    return userId || null;
  }

  const [version, payloadBase64, signature] = bearer.split('.');
  if (!version || !payloadBase64 || !signature) return null;
  if (version !== TOKEN_VERSION) return null;

  const expectedSignature = signPayload(payloadBase64);
  if (!safeEqual(signature, expectedSignature)) return null;

  try {
    const payload = JSON.parse(
      base64UrlDecode(payloadBase64),
    ) as AccessTokenPayload;
    const now = Math.floor(Date.now() / 1000);
    if (!payload?.sub || typeof payload.sub !== 'string') return null;
    if (!Number.isFinite(payload.exp) || payload.exp <= now) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

export function requireUserIdFromAuthorizationHeader(
  authHeader: string | string[] | undefined,
): string {
  const userId = parseUserIdFromAuthorizationHeader(authHeader);
  if (!userId) {
    throw new UnauthorizedException('Login required.');
  }
  return userId;
}
