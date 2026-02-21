import { UnauthorizedException } from '@nestjs/common';

const TOKEN_PREFIX = 'devtoken.';

export function issueAccessToken(userId: string): string {
  return `${TOKEN_PREFIX}${userId}`;
}

export function parseUserIdFromAuthorizationHeader(
  authHeader: string | string[] | undefined,
): string | null {
  if (!authHeader) return null;
  const raw = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  if (!raw) return null;

  const bearer = raw.startsWith('Bearer ') ? raw.slice('Bearer '.length).trim() : raw.trim();
  if (!bearer.startsWith(TOKEN_PREFIX)) return null;
  const userId = bearer.slice(TOKEN_PREFIX.length).trim();
  return userId.length > 0 ? userId : null;
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
