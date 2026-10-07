import { db } from "@/lib/db";

export type AuditAction =
  | "CREAR_EMPLEADO"
  | "ACTUALIZAR_ESTADO_EMPLEADO"
  | "CREAR_COMPETENCIA"
  | "CAMBIAR_ESTADO_COMPETENCIA"
  | "CREAR_DEPARTAMENTO"
  | "CREAR_PUESTO"
  | "EVALUACION_DIAGNOSTICA"
  | "EVALUACION_POST_CAPACITACION"
  | "CREAR_OPORTUNIDAD"
  | "PUBLICAR_OPORTUNIDAD"
  | "CERRAR_OPORTUNIDAD"
  | "POSTULACION"
  | "GENERAR_RECOMENDACION_IA"
  | "APROBAR_RECOMENDACION"
  | "CREAR_PLAN"
  | "APROBAR_PLAN"
  | "ENTREGA_ACTIVIDAD"
  | "REVISION_ACTIVIDAD"
  | "CIERRE_BRECHA"
  | "CREAR_OBJETIVO"
  | "ACTUALIZAR_OBJETIVO"
  | "EVALUAR_OBJETIVOS"
  | "IMPORTACION_MASIVA"
  | "ACEPTAR_POSTULACION"
  | "RECHAZAR_POSTULACION"
  | "CAMBIO_CONTRASENA"
  | "RESTABLECER_CONTRASENA";

export type AuditEntity =
  | "Empleado"
  | "Usuario"
  | "Competencia"
  | "Departamento"
  | "Puesto"
  | "Evaluacion"
  | "Oportunidad"
  | "Postulacion"
  | "Recomendacion"
  | "Plan"
  | "Actividad"
  | "Brecha"
  | "Objetivo"
  | "Sistema";

export async function logAudit({
  userId,
  action,
  entity,
  entityId,
  details,
  ip,
}: {
  userId?: number | null;
  action: AuditAction | string;
  entity: AuditEntity | string;
  entityId?: number | null;
  details?: string | null;
  ip?: string | null;
}) {
  try {
    return await db.auditLog.create({
      data: {
        userId: userId ?? null,
        action,
        entity,
        entityId: entityId ?? null,
        details: details ?? null,
        ip: ip ?? null,
      },
    });
  } catch (error) {
    console.error("Error creating audit log:", error);
    return null;
  }
}
