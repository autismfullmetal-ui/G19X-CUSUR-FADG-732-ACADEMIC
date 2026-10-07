import { db } from "@/lib/db";

export type NotificationType = "INFO" | "SUCCESS" | "WARNING" | "ACTION_REQUIRED";

export async function createNotification({
  userId,
  title,
  message,
  type = "INFO",
  linkUrl,
}: {
  userId: number;
  title: string;
  message: string;
  type?: NotificationType;
  linkUrl?: string;
}) {
  try {
    return await db.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        linkUrl,
      },
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
}

export async function notifyUsers({
  userIds,
  title,
  message,
  type = "INFO",
  linkUrl,
}: {
  userIds: number[];
  title: string;
  message: string;
  type?: NotificationType;
  linkUrl?: string;
}) {
  try {
    const uniqueIds = Array.from(new Set(userIds.filter((id) => typeof id === "number" && id > 0)));
    if (uniqueIds.length === 0) return;
    return await db.notification.createMany({
      data: uniqueIds.map((userId) => ({
        userId,
        title,
        message,
        type,
        linkUrl,
      })),
    });
  } catch (error) {
    console.error("Error creating multiple notifications:", error);
    return null;
  }
}
