"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db, ROLES } from "@/lib/db";
import { auth } from "@/lib/auth";
import { calcCompatibility } from "@/lib/compatibility";
import { generateAiRecommendation } from "@/lib/ai";
import { createNotification, notifyUsers } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";
import { requireRole } from "@/lib/session";
import { num, str, DEFAULT_PASSWORD } from "./_helpers";

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


