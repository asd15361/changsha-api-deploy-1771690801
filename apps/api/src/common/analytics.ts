import type { PrismaService } from '../prisma/prisma.service';

type AppEventInput = {
  eventName: string;
  userId?: string;
  platform?: string;
  meta?: Record<string, unknown>;
};

export async function recordAppEvent(
  prisma: PrismaService,
  input: AppEventInput,
) {
  try {
    await prisma.$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS app_events (
        id TEXT PRIMARY KEY,
        event_name TEXT NOT NULL,
        user_id TEXT,
        platform TEXT,
        meta_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
    );

    const id = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    await prisma.$executeRawUnsafe(
      'INSERT INTO app_events (id, event_name, user_id, platform, meta_json) VALUES (?, ?, ?, ?, ?)',
      id,
      input.eventName,
      input.userId ?? null,
      input.platform ?? null,
      input.meta ? JSON.stringify(input.meta) : null,
    );
  } catch {
    // Analytics must never block core user requests.
  }
}
