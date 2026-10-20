# PRD — Plataforma de Planes de Desarrollo Profesional Personalizados

| Campo | Valor |
|-------|-------|
| **Proyecto** | Plataforma de Planes de Desarrollo Profesional Personalizados (PDP) |
| **Tipo** | Sistema web empresarial |
| **Prioridad** | Alta |
| **Objetivo** | Producción empresarial |

---

## 1. Resumen del producto

La plataforma permite a una organización gestionar el desarrollo profesional de sus empleados mediante la evaluación de competencias, el seguimiento del desempeño, la identificación de brechas y la generación de planes de desarrollo personalizados.

El sistema utiliza inteligencia artificial para generar recomendaciones y rutas de aprendizaje personalizadas, tomando como referencia:

- Competencias actuales del empleado.
- Competencias requeridas por una oportunidad.
- Evaluaciones de desempeño.
- Objetivos organizacionales.
- Brechas de competencias.
- Progreso de actividades de desarrollo.
- Resultados de re-evaluaciones.

La IA actúa como **asistente de recomendación**; las decisiones de selección, asignación o promoción permanecen bajo responsabilidad humana (D-06, RN-009).

**Ciclo continuo:** Evaluar → Detectar brechas → Recomendar → Desarrollar → Dar seguimiento → Re-evaluar

## 2. Problema que resuelve

- Dificultad para identificar empleados adecuados para oportunidades internas.
- Falta de visibilidad sobre las competencias reales de los empleados.
- Planes de capacitación genéricos y sin seguimiento.
- Dificultad para comprobar si una capacitación mejoró una competencia.
- Información fragmentada para RH y supervisores.

## 3. Usuarios del sistema (RBAC)

| Rol | Funciones principales |
|-----|----------------------|
| **Empleado** | Consulta su perfil, competencias y oportunidades; se postula; registra entregables y avances en su plan. |
| **Supervisor** | Evalúa competencias de **sus colaboradores directos** (inicial y post-capacitación); revisa planes y entregables; da retroalimentación. |
| **RH** | Administra catálogos (empleados, departamentos, puestos, competencias); crea y cierra oportunidades; revisa postulaciones; genera y aprueba recomendaciones y planes; también puede registrar evaluaciones. |
| **Administrador** | Configuración técnica, usuarios, roles, catálogos y auditoría. |

> Nota de alcance (acordado con el usuario): **RH y Supervisor pueden ambos realizar evaluaciones.** El Supervisor está limitado a su ámbito (solo subordinados).

## 4. Requisitos funcionales principales

| ID | Requisito |
|----|-----------|
| RF-001 | Inicio de sesión con credenciales; cuenta inactiva no accede. |
| RF-002 | Gestión de empleados (alta, consulta, actualización, desactivación). |
| RF-003 | Catálogo de competencias (nombre, descripción, tipo, estado). |
| RF-004 | Escala de competencia de 1 a 5 (Básico → Experto). |
| RF-006 | Evaluación de competencias por evaluador autorizado (RH/Supervisor; supervisor solo sus subordinados). |
| RF-007 | Evaluación de desempeño contra objetivos organizacionales. |
| RF-008 | Creación de oportunidades (puesto, proyecto, desarrollo). |
| RF-009 | Requisitos de oportunidad: competencia, nivel requerido, peso, obligatoria. |
| RF-010 | Postulación única por empleado y oportunidad; fechas de apertura/límite; vacantes. |
| RF-011 | Cálculo de compatibilidad comparando niveles actuales vs requeridos. |
| RF-012 | Identificación de brechas (nivel actual < requerido). |
| RF-013 | Compatibilidad ponderada; obligatorias identificadas aparte. |
| RF-014 | Generación de recomendaciones con IA basadas en brechas (modelo 70-20-10). |
| RF-015 | Revisión humana de recomendaciones antes de convertirse en plan. |
| RF-016–018 | Creación de planes con actividades, asociados a empleado y oportunidad. |
| RF-019–021 | Registro de avance, entregables con evidencias (URL) y re-evaluación post-capacitación. |
| RF-022 | Actualización de brechas tras re-evaluación (SUPERADA / EN_DESARROLLO). |
| RF-023–024 | Dashboards por rol con métricas (Recharts). |
| RF-025 | Notificaciones in-app. |
| RF-026 | Auditoría de acciones críticas. |
| RF-027 | Importación inicial masiva por CSV con plantillas. |
| RF-028 | Perfil de usuario y gestión de contraseñas. |

## 5. Reglas de negocio clave

| Regla | Descripción |
|-------|-------------|
| RN-001 | Un empleado no puede postularse dos veces a la misma oportunidad. |
| RN-006 | Brecha existe cuando nivel_actual < nivel_requerido. |
| RN-007 | Brecha superada cuando nivel_actual >= nivel_objetivo. |
| RN-008/009 | La IA no modifica evaluaciones ni toma decisiones laborales finales. |
| RN-017 | El nivel oficial de una competencia es el de la última evaluación finalizada. |

## 6. Requisitos no funcionales relevantes

| ID | Requisito |
|----|-----------|
| RNF-001 | Contraseñas con hashing seguro (bcrypt), sesión JWT. |
| RNF-010 | Disponibilidad operativa definida por la organización. |
| RNF-014 | Accesibilidad WCAG 2.1 AA en vistas principales. |
| RNF-015 | Resiliencia de IA: timeout + plantillas predefinidas si el servicio falla; ninguna operación crítica depende de la IA. |
| RNF-017 | Explicabilidad: cada recomendación guarda brechas de origen y versión del modelo. |

## 7. Decisiones de producto

| ID | Decisión |
|----|----------|
| D-01 | "Oportunidades" unifica puestos, proyectos y desarrollo. |
| D-03 | Usuario y Empleado son entidades separadas. |
| D-04 | Escala de competencias 1 a 5. |
| D-06 | La IA recomienda, no decide. |
| D-10 | Desarrollo por fases, iniciando con MVP. |
| D-11 | El Supervisor actúa como responsable de su área. |
| — | RH y Supervisor pueden ambos realizar evaluaciones (acuerdo del 13-oct). |

## 8. Fuera de alcance (PRD completo)

Nómina, asistencia, vacaciones, reclutamiento externo, entrevistas por video, gestión financiera, LMS completo, certificados oficiales, evaluación psicológica, decisiones automatizadas por IA, despidos/promociones automáticas, app móvil nativa.

---

## Tecnologías utilizadas en el desarrollo

| Capa | Tecnología | Versión |
|------|------------|---------|
| Frontend | Next.js (App Router) | 16.3.5 |
| UI | React | 19.2.8 |
| Lenguaje | TypeScript | 5.x |
| Estilos | Tailwind CSS | 4.x |
| Base de datos | SQLite (local) | — |
| ORM | Prisma | 6.19.3 |
| Autenticación | Auth.js v5 (NextAuth, JWT + credenciales) | 5.0.0-beta.32 |
| Gráficas | Recharts | 3.10.1 |
| Hashing | bcryptjs (costo 10) | 3.0.3 |
| IA | API compatible OpenAI (GLM-4.5 / Zhipu AI) + fallback plantillas | — |
| Pruebas | Scripts E2E con Node | 17 archivos |
| Entorno | Node.js | ≥ 22 |
