# MVP — Plataforma PDP (Producto Mínimo Viable implementado)

> Este documento describe **lo que realmente se construyó** (versión demostrable) y cómo se relaciona con el PRD.

---

## 1. Definición del MVP

El MVP implementa el **ciclo completo de desarrollo profesional** de extremo a extremo:

```
Alta del empleado → Evaluación inicial → Oportunidad publicada → Postulación
→ Compatibilidad y brechas → Recomendación IA → Plan aprobado → Ejecución
con entregables → Revisión del supervisor → Re-evaluación → Brecha SUPERADA
```

**Criterio de "terminado" (cumplido):** login por roles, permisos, gestión de empleados y competencias, evaluaciones, oportunidades, postulaciones, compatibilidad, brechas, recomendaciones IA, planes, actividades con entregables, reevaluación y cierre de brechas, notificaciones, auditoría y dashboards por rol.

---

## 2. Módulos implementados

| # | Módulo | Qué hace | Estado |
|---|--------|----------|:------:|
| 1 | **Autenticación** | Login con email/contraseña; JWT firmado; sesión con rol; cambio de contraseña con validación de la actual; restablecimiento admin. | ✅ |
| 2 | **Empleados** | CRUD con status (ACTIVO/INACTIVO), departamento, puesto y supervisor; alta crea usuario EMPLEADO automáticamente; selección de competencias iniciales opcional; importación masiva CSV. | ✅ |
| 3 | **Competencias** | Catálogo técnicas/blandas; activar/desactivar; niveles vigentes por empleado (RF-036). | ✅ |
| 4 | **Evaluaciones** | Inicial y post-capacitación; calificación 1–5 por competencia con comentarios; evaluación de objetivos organizacionales; **RH y Supervisor** evalúan; **supervisor limitado a sus subordinados** (filtro en pantalla + validación en servidor). | ✅ |
| 5 | **Objetivos organizacionales** | Metas estratégicas/operativas con categoría, meta, unidad, peso, período (selector con calendario); evaluación de cumplimiento 0–100%. | ✅ |
| 6 | **Oportunidades** | Tipo (puesto/proyecto/desarrollo), vacantes, fecha de apertura y límite; requisitos ponderados con nivel y obligatoriedad; publicación y cierre; enlace a objetivo estratégico. | ✅ |
| 7 | **Postulaciones** | Aplicación única por oportunidad; validación de fechas y vacantes; cálculo automático de compatibilidad ponderada; brechas registradas. | ✅ |
| 8 | **Recomendaciones IA** | Generación con GLM-4.5 (compatible OpenAI); prompt con brechas; respuesta JSON estructurada; timeout 90 s; **fallback a plantillas locales (RNF-015)**; registro de modelo y origen; aprobación humana (RH/Supervisor). | ✅ |
| 9 | **Planes de desarrollo** | Estados BORRADOR→PROPUESTO→APROBADO→EN_PROGRESO→COMPLETADO; actividades ordenadas con entregable esperado; fecha objetivo; precarga desde recomendación aprobada; auto-completado al terminar actividades; continúa aunque la oportunidad se cierre. | ✅ |
| 10 | **Entregables y evidencias** | El empleado describe el trabajo y adjunta URL (GitHub, Drive, demo); estado ENTREGADA; supervisor revisa, deja feedback y aprueba o devuelve a EN_PROGRESO. | ✅ |
| 11 | **Cierre de brechas** | Re-evaluación post-capacitación actualiza niveles vigentes y estado de brechas (SUPERADA / EN_DESARROLLO); hito de reevaluación en el plan. | ✅ |
| 12 | **Dashboards por rol** | Admin/RH: KPIs globales, gráficas Recharts, brechas abiertas; Supervisor: su equipo y avances; Empleado: su progreso y planes. | ✅ |
| 13 | **Notificaciones in-app** | Alertas de postulaciones, aprobaciones, entregables, evaluaciones; leído/no leído; campana en header. | ✅ |
| 14 | **Auditoría** | Registro inmutable de acciones críticas (altas, evaluaciones, aprobaciones, importaciones) con usuario, fecha y detalle. | ✅ |
| 15 | **Mi Perfil** | Datos laborales, matriz de competencias vigente, cambio de contraseña. | ✅ |
| 16 | **UI/UX** | Tema oscuro vino/negro/rojo; sidebar por rol; login con fondos dinámicos; tooltips de competencias. | ✅ |

---

## 3. Roles y permisos (implementados)

| Acción | ADMIN | RH | SUPERVISOR | EMPLEADO |
|--------|:-----:|:--:|:----------:|:--------:|
| Gestionar empleados / catálogos | ✅ | ✅ | — | — |
| Crear/cerrar oportunidades | ✅ | ✅ | — | — |
| **Realizar evaluaciones** | ✅ | ✅ | ✅ *(solo subordinados)* | — |
| Ver todas las postulaciones | ✅ | ✅ | — | — |
| Generar/aprobar recomendaciones | ✅ | ✅ | ✅ | — |
| Crear/aprobar planes | ✅ | ✅ | ✅ | — |
| Revisar entregables | ✅ | — | ✅ | — |
| Postularse / ver su plan | — | — | — | ✅ |
| Registrar avance y evidencias | — | — | — | ✅ |
| Auditoría | ✅ | ✅ | — | — |

---

## 4. Flujo de demostración (datos demo)

**Cuentas** (contraseña `Demo1234!`): `admin@demo.mx`, `rh@demo.mx`, `supervisor@demo.mx`, `empleado@demo.mx`

1. **Empleado** (`empleado@demo.mx`) → Oportunidades → postularse a "Líder de proyecto de datos" → compatibilidad 75%, brechas: Python 2→4, SQL 3→4.
2. **Supervisor** (`supervisor@demo.mx`) → Evaluaciones → **solo ve a Elena Vega** (su subordinada).
3. **RH** (`rh@demo.mx`) → Postulaciones → Generar recomendación (origen IA, modelo GLM-4.5) → Aprobar → crear plan → aprobar plan.
4. **Empleado** → Mi plan → iniciar actividades → entregar evidencia (URL).
5. **Supervisor** → revisar entregable → feedback → aprobar actividad.
6. **RH o Supervisor** → evaluación post-capacitación con nivel ≥ requerido → **brecha SUPERADA**.

---

## 5. Arquitectura del MVP

| Capa | Implementación |
|------|----------------|
| Frontend | Next.js 16 App Router + React 19 + TypeScript + Tailwind v4 (tema vino/negro/rojo) |
| Lógica de negocio | Server Actions (`src/app/actions.ts`) con `requireRole()` en cada acción |
| Datos | SQLite + Prisma ORM (17 entidades); init.sql + seed de demo |
| Seguridad | Auth.js v5 (JWT firmado), bcrypt (costo 10), RBAC, auditoría |
| IA | Fetch a API compatible OpenAI (GLM-4.5), JSON estructurado, timeout 90 s, fallback plantillas |
| Calidad | 17–18 tests E2E (`tests/*.mjs`), TypeScript 0 errores (`tsc --noEmit`) |

**Métricas del código:** ~10,088 líneas en `src/` (47 archivos), +1,392 líneas de tests.

---

## 6. Fuera del MVP (documentado)

Nómina, asistencia, vacaciones, LMS, certificados, decisiones automáticas de IA, app móvil, SSO/Active Directory (D-14: fase posterior), integraciones con nómina/calendario.

---

## 7. Cómo correrlo

Ver `SETUP.md` en la raíz del proyecto. Resumen:

```bash
npm install
node prisma/apply-init.mjs
npx tsx prisma/seed.ts
npm run dev   # http://localhost:3000
```
