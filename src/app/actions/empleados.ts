"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db, ROLES } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { requireRole } from "@/lib/session";
import { num, str, DEFAULT_PASSWORD } from "./_helpers";

export async function createEmployee(formData: FormData) {
  const session = await requireRole([ROLES.ADMIN, ROLES.RH]);
  const email = str(formData.get("email")).toLowerCase();
  const firstName = str(formData.get("firstName"));
  const lastName = str(formData.get("lastName"));
  if (!email || !firstName) {
    redirect("/empleados?error=datos");
  }

  // Competencias iniciales seleccionadas por RH (RF-006, RF-036)
  const rawCompIds = formData.getAll("empCompetencyId").map((v) => num(v));
  const rawLevels = formData.getAll("empLevel").map((v) => num(v));

  const validEntries: { competencyId: number; level: number }[] = [];
  const seenComps = new Set<number>();

  for (let i = 0; i < rawCompIds.length; i++) {
    const cid = rawCompIds[i];
    const lvl = rawLevels[i] || 1;
    if (cid > 0 && lvl >= 1 && lvl <= 5 && !seenComps.has(cid)) {
      seenComps.add(cid);
      validEntries.push({ competencyId: cid, level: lvl });
    }
  }

  const evaluatorId = session?.user?.id ? Number(session.user.id) : null;

  // Transacción: usuario + empleado + evaluación inicial + calificaciones
  // se aplican como una sola unidad atómica (o todo o nada).
  let employee;
  try {
    employee = await db.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({ where: { email } });
      let userId: number | null = existingUser?.id ?? null;
      if (!userId) {
        const user = await tx.user.create({
          data: {
            email,
            passwordHash: bcrypt.hashSync(DEFAULT_PASSWORD, 10),
            // La clave temporal es compartida: se exige cambiarla al primer ingreso
            mustChangePassword: true,
            name: `${firstName} ${lastName}`.trim(),
            role: ROLES.EMPLEADO,
          },
        });
        userId = user.id;
      }

      const created = await tx.employee.create({
        data: {
          firstName,
          lastName,
          email,
          departmentId: num(formData.get("departmentId")),
          positionId: num(formData.get("positionId")),
          supervisorId: num(formData.get("supervisorId")) || null,
          userId,
        },
      });

      if (validEntries.length > 0 && evaluatorId) {
        const evaluation = await tx.evaluation.create({
          data: {
            employeeId: created.id,
            evaluatorId,
            type: "INICIAL",
            status: "FINALIZADA",
            comment: "Evaluación diagnóstica inicial registrada al dar de alta al empleado por RH.",
            finalizedAt: new Date(),
          },
        });

        for (const item of validEntries) {
          await tx.evaluationScore.create({
            data: {
              evaluationId: evaluation.id,
              competencyId: item.competencyId,
              level: item.level,
            },
          });

          await tx.employeeCompetency.upsert({
            where: {
              employeeId_competencyId: {
                employeeId: created.id,
                competencyId: item.competencyId,
              },
            },
            update: { level: item.level },
            create: {
              employeeId: created.id,
              competencyId: item.competencyId,
              level: item.level,
            },
          });
        }
      }

      return created;
    });
  } catch {
    redirect("/empleados?error=duplicado");
  }

  // RF-026: Auditoría
  await logAudit({
    userId: Number(session.user.id),
    action: "CREAR_EMPLEADO",
    entity: "Empleado",
    entityId: employee.id,
    details: `Alta de empleado ${firstName} ${lastName} (${email}) con ${validEntries.length} competencias iniciales.`,
  });

  revalidatePath("/empleados");
  revalidatePath("/evaluaciones");
  redirect("/empleados?ok=1");
}

export async function setEmployeeStatus(formData: FormData) {
  const session = await requireRole([ROLES.ADMIN, ROLES.RH]);
  const id = num(formData.get("employeeId"));
  const status = str(formData.get("status")) === "ACTIVO" ? "ACTIVO" : "INACTIVO";
  await db.employee.update({ where: { id }, data: { status } });

  // RF-026: Auditoría
  await logAudit({
    userId: Number(session.user.id),
    action: "ACTUALIZAR_ESTADO_EMPLEADO",
    entity: "Empleado",
    entityId: id,
    details: `Estado del empleado #${id} cambiado a ${status}.`,
  });

  revalidatePath("/empleados");
}

export async function createDepartment(formData: FormData) {
  await requireRole([ROLES.ADMIN, ROLES.RH]);
  const name = str(formData.get("name"));
  if (name) await db.department.create({ data: { name } });
  revalidatePath("/empleados");
}

export async function createPosition(formData: FormData) {
  await requireRole([ROLES.ADMIN, ROLES.RH]);
  const title = str(formData.get("title"));
  if (title) await db.position.create({ data: { title } });
  revalidatePath("/empleados");
}


