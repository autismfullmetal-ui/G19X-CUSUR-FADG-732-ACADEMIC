"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function markNotificationAsRead(notificationId: number) {
  const session = await auth();
  if (!session?.user?.id) return;
  await db.notification.updateMany({
    where: {
      id: notificationId,
      userId: Number(session.user.id),
    },
    data: { read: true },
  });
  revalidatePath("/", "layout");
}

export async function markAllNotificationsAsRead() {
  const session = await auth();
  if (!session?.user?.id) return;
  await db.notification.updateMany({
    where: {
      userId: Number(session.user.id),
      read: false,
    },
    data: { read: true },
  });
  revalidatePath("/", "layout");
}

export async function clearAllNotifications() {
  const session = await auth();
  if (!session?.user?.id) return;
  await db.notification.deleteMany({
    where: {
      userId: Number(session.user.id),
    },
  });
  revalidatePath("/", "layout");
}

export async function requireSessionSafe() {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");
  return session;
}


