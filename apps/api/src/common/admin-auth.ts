import { ForbiddenException } from '@nestjs/common';

export function requireAdminApiKey(headerValue: string | string[] | undefined) {
  const configuredKey = process.env.ADMIN_API_KEY?.trim();
  if (!configuredKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Admin API key not configured.');
    }
    return;
  }

  const raw = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  const input = raw?.trim() ?? '';
  if (!input || input !== configuredKey) {
    throw new ForbiddenException('Admin API key required.');
  }
}
