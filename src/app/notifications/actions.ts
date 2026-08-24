"use server";

import "server-only";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { getSession } from "@/lib/auth/get-session";

export async function getRecentNotifications(limit = 15) {
  const session = await getSession();
  if (!session) return { items: [], unreadCount: 0 };

  const [items, [countRow]] = await Promise.all([
    db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, session.user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(limit),
    db
      .select({ unreadCount: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, session.user.id), isNull(notifications.readAt))),
  ]);

  return { items, unreadCount: countRow?.unreadCount ?? 0 };
}

export async function markNotificationRead(notificationId: string) {
  const session = await getSession();
  if (!session) return;

  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, session.user.id)));
}

export async function markAllNotificationsRead() {
  const session = await getSession();
  if (!session) return;

  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, session.user.id), isNull(notifications.readAt)));
}
