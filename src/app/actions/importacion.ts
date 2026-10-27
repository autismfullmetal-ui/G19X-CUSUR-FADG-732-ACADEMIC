"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db, ROLES } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { requireRole } from "@/lib/session";
import { num, str } from "./_helpers";

function parseCsv(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  return lines.map((line) => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  });
}

export async function importEmployeesCsv(formData: FormData) {
  const session = await requireRole([ROLES.ADMIN, ROLES.RH]);
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    redirect("/importacion?error=archivo_vacio");
  }

  const text = await file.text();
  const rows = parseCsv(text);
  if (rows.length < 2) {
    redirect("/importacion?error=sin_datos");
  }

  const header = rows[0].map((h) => h.toLowerCase());
  const colIndex = {
    firstName: header.findIndex((h) => h.includes("nombre") && !h.includes("apellido")),
    lastName: header.findIndex((h) => h.includes("apellido")),
    email: header.findIndex((h) => h.includes("email") || h.includes("correo")),
    department: header.findIndex((h) => h.includes("departamento") || h.includes("depto") || h.includes("area")),
    position: header.findIndex((h) => h.includes("puesto") || h.includes("cargo")),
    role: header.findIndex((h) => h.includes("rol")),
    supervisorEmail: header.findIndex((h) => h.includes("supervisor")),
  };

  if (colIndex.firstName === -1 || colIndex.email === -1) {
    redirect("/importacion?error=cabeceras_invalidas");
  }

  const passHash = bcrypt.hashSync(DEFAULT_PASSWORD, 10);
  let createdCount = 0;
  let skippedCount = 0;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const firstName = row[colIndex.firstName] || "";
    const lastName = colIndex.lastName !== -1 ? row[colIndex.lastName] || "" : "";
    const email = (row[colIndex.email] || "").toLowerCase().trim();
    const deptName = colIndex.department !== -1 ? row[colIndex.department] || "General" : "General";
    const posTitle = colIndex.position !== -1 ? row[colIndex.position] || "Colaborador" : "Colaborador";
    const roleRaw = (colIndex.role !== -1 ? row[colIndex.role] : "EMPLEADO")?.toUpperCase().trim();
    const role = [ROLES.ADMIN, ROLES.RH, ROLES.SUPERVISOR, ROLES.EMPLEADO].includes(roleRaw as any)
      ? roleRaw
      : ROLES.EMPLEADO;
    const supEmail = colIndex.supervisorEmail !== -1 ? (row[colIndex.supervisorEmail] || "").toLowerCase().trim() : "";

    if (!firstName || !email || !email.includes("@")) {
      skippedCount++;
      continue;
    }

    // Verificar si ya existe el empleado o usuario
    const existingEmp = await db.employee.findUnique({ where: { email } });
    const existingUser = await db.user.findUnique({ where: { email } });

    if (existingEmp || existingUser) {
      skippedCount++;
      continue;
    }

    // Upsert Department y Position
    const department = await db.department.upsert({
      where: { name: deptName },
      update: {},
      create: { name: deptName },
    });

    const position = await db.position.upsert({
      where: { title: posTitle },
      update: {},
      create: { title: posTitle },
    });

    // Crear User para acceso a la plataforma
    const user = await db.user.create({
      data: {
        email,
        name: `${firstName} ${lastName}`.trim(),
        passwordHash: passHash,
        mustChangePassword: true,
        role,
      },
    });

    // Buscar supervisor si fue proporcionado
    let supervisorId: number | null = null;
    if (supEmail) {
      const supervisor = await db.employee.findUnique({ where: { email: supEmail } });
      if (supervisor) {
        supervisorId = supervisor.id;
      }
    }

    // Crear Employee
    await db.employee.create({
      data: {
        firstName,
        lastName,
        email,
        departmentId: department.id,
        positionId: position.id,
        supervisorId,
        userId: user.id,
        status: "ACTIVO",
      },
    });

    createdCount++;
  }

  // RF-026: Auditoría
  await logAudit({
    userId: Number(session.user.id),
    action: "IMPORTACION_MASIVA",
    entity: "Empleado",
    details: `Importación masiva de personal: ${createdCount} colaboradores y usuarios dados de alta, ${skippedCount} omitidos (duplicados o incompletos).`,
  });

  revalidatePath("/empleados");
  revalidatePath("/dashboard");
  revalidatePath("/importacion");
  redirect(`/importacion?ok=empleados&created=${createdCount}&skipped=${skippedCount}`);
}

export async function importCompetenciesCsv(formData: FormData) {
  const session = await requireRole([ROLES.ADMIN, ROLES.RH]);
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    redirect("/importacion?error=archivo_vacio");
  }

  const text = await file.text();
  const rows = parseCsv(text);
  if (rows.length < 2) {
    redirect("/importacion?error=sin_datos");
  }

  const header = rows[0].map((h) => h.toLowerCase());
  const colIndex = {
    name: header.findIndex((h) => h.includes("nombre") || h.includes("competencia")),
    description: header.findIndex((h) => h.includes("descripcion") || h.includes("detalle")),
    type: header.findIndex((h) => h.includes("tipo")),
  };

  if (colIndex.name === -1) {
    redirect("/importacion?error=cabeceras_invalidas");
  }

  let createdCount = 0;
  let skippedCount = 0;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const name = row[colIndex.name]?.trim();
    const description = colIndex.description !== -1 ? row[colIndex.description]?.trim() : "";
    const typeRaw = colIndex.type !== -1 ? row[colIndex.type]?.toUpperCase().trim() : "TECNICA";
    const type = typeRaw.includes("BLANDA") ? "BLANDA" : "TECNICA";

    if (!name) {
      skippedCount++;
      continue;
    }

    const existing = await db.competency.findUnique({ where: { name } });
    if (existing) {
      skippedCount++;
      continue;
    }

    await db.competency.create({
      data: {
        name,
        description: description || name,
        type,
        status: "ACTIVA",
      },
    });

    createdCount++;
  }

  // RF-026: Auditoría
  await logAudit({
    userId: Number(session.user.id),
    action: "IMPORTACION_MASIVA",
    entity: "Competencia",
    details: `Importación masiva de catálogo de competencias: ${createdCount} creadas, ${skippedCount} omitidas por existir previamente.`,
  });

  revalidatePath("/competencias");
  revalidatePath("/dashboard");
  revalidatePath("/importacion");
  redirect(`/importacion?ok=competencias&created=${createdCount}&skipped=${skippedCount}`);
}


