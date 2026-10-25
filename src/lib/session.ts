import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function requireSession(options?: { skipMustChangeCheck?: boolean }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (!options?.skipMustChangeCheck) {
    const currentUser = await db.user.findUnique({
      where: { id: Number(session.user.id) },
      select: { mustChangePassword: true },
    });
    if (currentUser?.mustChangePassword) redirect("/cambiar-contrasena");
  }

  return session;
}

export async function requireRole(roles: string[]) {
  const session = await requireSession();
  if (!roles.includes(session.user.role)) {
    throw new Error("No autorizado");
  }
  return session;
}
