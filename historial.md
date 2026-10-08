# Historial de Cambios y Versiones: Plataforma PDP

*Registro cronológico detallado de requerimientos, decisiones arquitectónicas, modificaciones en base de datos, lógica de servidor, componentes y evoluciones del sistema.*

---

## Índice de Versiones e Hitos

1. [Hito 1: Configuración Inicial de API Keys y Conectividad con IA](#hito-1-configuración-inicial-de-api-keys-y-conectividad-con-ia)
2. [Hito 2: Ciclo de Vida de Oportunidades, Fechas, Vacantes y Continuidad de Planes](#hito-2-ciclo-de-vida-de-oportunidades-fechas-vacantes-y-continuidad-de-planes)
3. [Hito 3: Núcleo de Evaluaciones, Entregables Reales y Cierre Automático de Brechas](#hito-3-núcleo-de-evaluaciones-entregables-reales-y-cierre-automático-de-brechas)
4. [Hito 4: Desglose Específico y Riguroso de Planes con IA (GLM-4.5)](#hito-4-desglose-específico-y-riguroso-de-planes-con-ia-glm-45)
5. [Hito 5: Ranura para Segunda API Key y Conmutación por Error (Multi-Provider Failover)](#hito-5-ranura-para-segunda-api-key-y-conmutación-por-error-multi-provider-failover)
6. [Hito 6: Rediseño Visual de Login con Glassmorphism y Fondos Dinámicos](#hito-6-rediseño-visual-de-login-con-glassmorphism-y-fondos-dinámicos)

---

## Hito 1: Configuración Inicial de API Keys y Conectividad con IA

### Requerimiento del Usuario:
* ¿Cómo agregar una API key al proyecto para habilitar las funciones de IA?
* Selección y uso de API Key de **GLM / Zhipu AI**.

### Diagnóstico y Acciones:
1. Se estructuró el archivo [.env](file:///f:/TO_DO%20PROYECTO/pdp/.env) para admitir variables estándar compatibles con llamadas estilo OpenAI: `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`.
2. Se documentaron las opciones en [SETUP.md](file:///f:/TO_DO%20PROYECTO/pdp/SETUP.md).
3. Se implementó la verificación `aiConfigured()` en [src/lib/ai.ts](file:///f:/TO_DO%20PROYECTO/pdp/src/lib/ai.ts) para evitar fallos si la clave no está configurada, recurriendo al mecanismo de plantilla de contingencia (RNF-015).

---

## Hito 2: Ciclo de Vida de Oportunidades, Fechas, Vacantes y Continuidad de Planes

### Requerimientos del Usuario:
* Agregar fecha de apertura (`openDate`) y fecha máxima/límite para aplicar (`deadline`) a las oportunidades.
* Añadir cantidad de vacantes disponibles (`vacancies`).
* Si una oportunidad se cierra administrativamente, el empleado debe poder continuar con su plan de desarrollo sin interrupciones.
* Tomar en cuenta las fechas establecidas al generar los planes de desarrollo.

### Modificaciones en Base de Datos:
* **Modelo `Opportunity` en [prisma/schema.prisma](file:///f:/TO_DO%20PROYECTO/pdp/prisma/schema.prisma) y [prisma/init.sql](file:///f:/TO_DO%20PROYECTO/pdp/prisma/init.sql):**
  * `vacancies Int @default(1)`
  * `openDate DateTime?`
  * `deadline DateTime?`
* **Modelo `DevelopmentPlan`:**
  * `targetDate DateTime?` (fecha objetivo de cumplimiento del plan).
* Sincronización de base de datos ejecutada con `npx prisma db push` y cliente regenerado con `npx prisma generate`.

### Modificaciones en Lógica de Servidor ([src/app/actions.ts](file:///f:/TO_DO%20PROYECTO/pdp/src/app/actions.ts)):
* **`createOpportunity`:** Almacenamiento de vacantes, fecha de apertura y fecha límite.
* **`applyToOpportunity`:**
  * Validación de fecha de apertura: rechazo si la fecha actual es anterior a `openDate`.
  * Validación de fecha límite: rechazo si la fecha actual supera `deadline`.
  * Validación de vacantes: comprobación de disponibilidad antes de registrar la postulación.
* **`closeOpportunity`:** Al cambiar la oportunidad a estado `CERRADA`, solo se cancelan las postulaciones sin plan activo. Aquellas con un `DevelopmentPlan` creado permanecen activas para que el colaborador complete su formación.

### Pruebas Automatizadas:
* Creación y ejecución exitosa de [tests/opportunity-dates-test.mjs](file:///f:/TO_DO%20PROYECTO/pdp/tests/opportunity-dates-test.mjs).

---

## Hito 3: Núcleo de Evaluaciones, Entregables Reales y Cierre Automático de Brechas

### Requerimientos del Usuario:
* El centro del proyecto son las evaluaciones y el desarrollo de los colaboradores.
* El empleado debe poder realizar actividades reales, subir entregables y evidencias (enlaces, repositorios, demos) y no solo visualizar texto estático.
* El supervisor debe poder revisar la evidencia, dejar retroalimentación formal y calificar/aprobar la actividad.
* La reevaluación post-capacitación debe cerrar formalmente las brechas detectadas.

### Modificaciones en Base de Datos:
* **Modelo `PlanActivity`:**
  * `deliverable String?`: Detalle o resumen del trabajo entregado por el empleado.
  * `evidenceUrl String?`: Enlace URL a la evidencia tangible (GitHub, Figma, Google Drive, demo).
  * `submittedAt DateTime?`: Timestamp exacto del envío.
  * `feedback String?`: Observaciones y retroalimentación formal del evaluador.
  * `reviewedAt DateTime?`: Timestamp de la revisión del supervisor.
  * `status`: Ampliado a `PENDIENTE`, `EN_PROGRESO`, `ENTREGADA`, `COMPLETADA`, `NO_COMPLETADA`, `CANCELADA`.
* **Modelo `DevelopmentPlan`:**
  * `postEvaluationId Int?`: Vinculación directa con la evaluación post-capacitación.

### Nuevas Acciones del Servidor ([src/app/actions.ts](file:///f:/TO_DO%20PROYECTO/pdp/src/app/actions.ts)):
* **`submitActivityDeliverable`:** El colaborador envía su entregable y URL; la actividad pasa a `ENTREGADA` y el plan cambia a `EN_PROGRESO`.
* **`reviewActivityDeliverable`:** El evaluador deja retroalimentación y decide:
  * **Aprobar:** Cambia a `COMPLETADA` y registra `reviewedAt`. Si todas las actividades quedan completadas, el plan pasa automáticamente a `COMPLETADO`.
  * **Solicitar ajustes:** Retorna a `EN_PROGRESO` con comentarios de corrección.
* **`createEvaluation` (Cierre Automático de Brechas):**
  * Al realizar una evaluación de tipo `POST_CAPACITACION`, se comparan los nuevos niveles obtenidos con las brechas del empleado (`Gap`).
  * Si `nivelEvaluado >= requiredLevel`, el estado de la brecha pasa automáticamente a **`SUPERADA`**.

### Componentes y Vistas Creados / Modificados:
* **Nuevo componente interactivo [PlanActivityCard.tsx](file:///f:/TO_DO%20PROYECTO/pdp/src/components/PlanActivityCard.tsx):**
  * Vista para el empleado: botones para iniciar, modal/formulario desplegable para adjuntar entregable y enlace, visualización de feedback del supervisor.
  * Vista para el supervisor: inspección de enlace externo, formulario para calificar y dejar observaciones.
* **[src/app/(app)/planes/page.tsx](file:///f:/TO_DO%20PROYECTO/pdp/src/app/(app)/planes/page.tsx):**
  * Barra de progreso porcentual del plan en tiempo real.
  * Integración de `PlanActivityCard`.
  * Acceso dinámico a *"Realizar Evaluación Post-Capacitación"* al alcanzar avances clave.
* **[src/app/(app)/postulaciones/[id]/page.tsx](file:///f:/TO_DO%20PROYECTO/pdp/src/app/(app)/postulaciones/[id]/page.tsx):**
  * Visualización de insignias de brechas superadas (`✓ Superada`).

---

## Hito 4: Desglose Específico y Riguroso de Planes con IA (GLM-4.5)

### Requerimiento del Usuario:
* Los planes que generaba la IA seguían siendo genéricos (*"Curso o práctica de Python"* era muy vago).
* Solicitud de un desglose claro, estructurado, riguroso y técnico.

### Diagnóstico de Causa Raíz:
1. **Fallo silencioso 401:** En `.env` estaba configurada la URL de OpenRouter (`openrouter.ai`) con una clave de **Zhipu AI BigModel**. OpenRouter rechazaba la autenticación con HTTP 401.
2. **Activación de plantilla básica:** Al fallar la llamada a la API, `ai.ts` activaba en silencio la plantilla de contingencia, que contenía textos simples.
3. **Límite de cuota 429:** Al conectar directamente al endpoint de Zhipu, se detectó que la cuenta GLM Coding Plan había alcanzado el límite de 5 horas (`código 1308: 已达到 5 小时的使用上限`).

### Solución Implementada:
1. **Configuración de Endpoint Oficial en [.env](file:///f:/TO_DO%20PROYECTO/pdp/.env):**
   * `AI_BASE_URL="https://open.bigmodel.cn/api/coding/paas/v4"`
   * `AI_MODEL="glm-4.5"`
2. **Estructura Obligatoria de 5 Campos en [src/lib/ai.ts](file:///f:/TO_DO%20PROYECTO/pdp/src/lib/ai.ts):**
   * `fase`: Período cronológico alineado al calendario de la oportunidad (ej. *Fase 1 [Semanas 1-4]*).
   * `titulo`: Nombre técnico formal de la actividad.
   * `descripcion`: Metodología y pasos específicos que ejecutará el colaborador.
   * `herramientas`: Tecnologías, librerías, estándares o plataformas precisas (ej. *FastAPI, Docker, pytest-cov, SonarLint*).
   * `entregable`: Producto tangible y verificable que el colaborador debe entregar (ej. *Repositorio privado en GitHub con API REST y cobertura >75%*).
   * `criterio`: Criterio objetivo de validación para el supervisor.
3. **Plantilla Enriquecida de Contingencia:** Se actualizó `templateRecommendation` para generar exactamente el mismo desglose profundo, evitando respuestas genéricas incluso en modo sin conexión o con cuota agotada.
4. **Tarjetas Visuales en Fase 4 ([postulaciones/[id]/page.tsx](file:///f:/TO_DO%20PROYECTO/pdp/src/app/(app)/postulaciones/[id]/page.tsx)):**
   * Reemplazo de la lista simple `<ol>` por tarjetas con diseño visual por bloques (azul para fase, gris para herramientas, lila para entregables y verde para criterios de validación).
   * Indicador transparente de origen (`IA GLM` vs `Plantilla estructurada por límite de cuota`).
5. **Precarga en Plan ([PlanForm.tsx](file:///f:/TO_DO%20PROYECTO/pdp/src/components/PlanForm.tsx) y [actions.ts](file:///f:/TO_DO%20PROYECTO/pdp/src/app/actions.ts)):**
   * `createPlan` ahora acepta `activitiesJson`. Al crear el plan, el `deliverable` esperado sugerido por la IA se inicializa directamente en `PlanActivity`, de modo que el empleado sabe qué debe construir desde el primer día.

---

## Hito 5: Ranura para Segunda API Key y Conmutación por Error (Multi-Provider Failover)

### Requerimiento del Usuario:
* Crear otro espacio para otra API key en la configuración del proyecto.

### Solución Implementada:
1. **Configuración en [.env](file:///f:/TO_DO%20PROYECTO/pdp/.env):**
   * Se añadieron variables para el Proveedor 2 de respaldo:
     ```env
     AI_BASE_URL_2="https://openrouter.ai/api/v1"
     AI_API_KEY_2=""
     AI_MODEL_2="zhipu/glm-4-9b-chat"
     ```
2. **Lógica de Conmutación Inteligente en [src/lib/ai.ts](file:///f:/TO_DO%20PROYECTO/pdp/src/lib/ai.ts):**
   * Función `getProviders()` que normaliza las credenciales de Proveedor 1 y Proveedor 2.
   * Lógica de failover en `generateAiRecommendation`:
     1. Intenta primero con el Proveedor 1 (GLM Coding Plan).
     2. Si el Proveedor 1 falla (por ejemplo, error HTTP 429 por límite de cuota o error de red), pasa automáticamente y de forma transparente a llamar al Proveedor 2.
     3. Si solo se proporciona la clave en `AI_API_KEY_2`, utiliza directamente el Proveedor 2.
     4. Si ambos fallan o no hay claves, recurre a la plantilla estructurada de alta precisión.
3. **Actualización de Documentación:** Actualización de [SETUP.md](file:///f:/TO_DO%20PROYECTO/pdp/SETUP.md).

---

## Hito 6: Rediseño Visual de Login con Glassmorphism y Fondos Dinámicos

### Requerimiento del Usuario:
* El diseño de login anterior era muy genérico y simplón.
* Solicitud de imágenes de fondo dinámicas (proporcionadas por el usuario).
* Ubicar la tarjeta de login en el **lateral izquierdo** de la pantalla.
* Aplicar un **fondo transparente con efecto glassmorphism** idéntico a la imagen de referencia compartida (tarjeta translúcida esmerilada, campos píldora, botón vino/borgoña redondeado).

### Solución Implementada:
1. **Alineación a la Izquierda:**
   * Contenedor con `justify-start` y espaciado responsivo (`px-6 sm:px-12 md:px-16 lg:px-24`).
2. **Tarjeta Glassmorphism (Frosted Glass):**
   * `backdrop-blur-2xl`, `bg-black/40`, borde de cristal sutil `border-white/20`, esquinas `rounded-3xl` y sombras profundas.
   * Título *"Welcome"* con tipografía limpia en blanco.
   * Inputs en formato de píldora redondeada (`rounded-full`) con clase `.glass-input`.
   * En [src/app/globals.css](file:///f:/TO_DO%20PROYECTO/pdp/src/app/globals.css), se añadieron reglas para `.glass-input` para evitar que las reglas globales del tema claro sobreescriban el fondo translúcido.
   * Botón `LOGIN` con formato píldora y gradiente en tono vino/borgoña (`from-[#7a1c3d] via-[#8f224a] to-[#5c132c]`) con sombra de resplandor.
   * Enlaces discretos *"Forgot Password?"* y *"Sign Up"*. Diseño limpio y despejado sin botones de prueba.
3. **Imágenes de Fondo Dinámicas (Slideshow con Transición Suave):**
   * Creación del directorio [public/backgrounds/](file:///f:/TO_DO%20PROYECTO/pdp/public/backgrounds).
   * Generación de 3 imágenes cinemáticas en resolución 16:9:
     * `bg1.jpg`: Montañas crepúsculo en tonos rosa y violeta (idéntico al estilo de la foto de referencia).
     * `bg2.jpg`: Skyline y arquitectura corporativa moderna nocturna.
     * `bg3.jpg`: Paisaje alpino con aurora boreal esmeralda.
   * Nuevo componente cliente [LoginBackgroundSlideshow.tsx](file:///f:/TO_DO%20PROYECTO/pdp/src/components/LoginBackgroundSlideshow.tsx) con transición suave de desvanecimiento (cross-fade) cada 8 segundos y controles manuales en la esquina inferior derecha.
   * Documentación para el usuario en [public/backgrounds/README.md](file:///f:/TO_DO%20PROYECTO/pdp/public/backgrounds/README.md) explicando cómo reemplazar o agregar sus propias fotografías.
4. **Componente de Tarjeta:** Nuevo componente [LoginFormCard.tsx](file:///f:/TO_DO%20PROYECTO/pdp/src/components/LoginFormCard.tsx).
5. **Página Principal de Login:** Actualización de [src/app/login/page.tsx](file:///f:/TO_DO%20PROYECTO/pdp/src/app/login/page.tsx).

---

## Hito 6: Asignación de Competencias Iniciales en el Alta de Empleados (RH/Admin)

### Requerimientos del Usuario:
* Al crear un nuevo empleado desde la sección de Recursos Humanos, además de los datos laborales existentes (nombre, apellidos, correo, departamento, puesto, supervisor), RH debe poder asignarle sus competencias iniciales, evitando que los nuevos empleados queden con un perfil de competencias vacío.

### Modificaciones Realizadas:
1. **Acción del Servidor (`createEmployee` en [src/app/actions.ts](file:///f:/TO_DO%20PROYECTO/pdp/src/app/actions.ts)):**
   * Captura y validación de arrays de competencias (`empCompetencyId`) y niveles (`empLevel`, 1 a 5).
   * Deduplicación de competencias seleccionadas.
   * Inserción automática de los registros en `EmployeeCompetency` para asegurar disponibilidad inmediata en el cálculo de compatibilidad (`calcCompatibility`), radar y brechas de oportunidades.
   * Registro formal de una `Evaluation` inicial (tipo `INICIAL`, estado `FINALIZADA`, evaluador: usuario RH/Admin en sesión) con sus respectivos `EvaluationScore` para trazabilidad y auditoría completa del PRD (RF-006, RF-036).
   * Revalidación de las rutas `/empleados` y `/evaluaciones`.

2. **Formulario Interactivo de Empleado ([src/components/EmpleadoForm.tsx](file:///f:/TO_DO%20PROYECTO/pdp/src/components/EmpleadoForm.tsx)):**
   * Nueva sección interactiva *"Competencias iniciales"* con contador dinámico de asignaciones.
   * Botón `+ Agregar competencia` para añadir filas dinámicas con selector de competencia y selector de nivel descriptivo (Nivel 1 - Básico a Nivel 5 - Experto).
   * Opción de conveniencia `Cargar todas` para precargar en un solo clic todas las competencias activas del catálogo.
   * Opción `Limpiar` y botón individual `✕ Quitar` por fila.
   * Deshabilitación inteligente de opciones en el dropdown para evitar asignar la misma competencia dos veces.
   * Estado opcional: si RH decide no asignar competencias en el momento, el empleado se registra y se puede evaluar posteriormente en el módulo de Evaluaciones.

3. **Directorio y Tabla de Empleados ([src/app/(app)/empleados/page.tsx](file:///f:/TO_DO%20PROYECTO/pdp/src/app/(app)/empleados/page.tsx)):**
   * Consulta ampliada en `db.employee.findMany` para incluir `competencies: { include: { competency: true } }`.
   * Consulta de competencias activas y pase como prop a `EmpleadoForm`.
   * Nueva columna **"Competencias"** en la tabla del directorio de empleados donde se visualizan inmediatamente las insignias con el nombre de cada competencia y su nivel vigente (`Nv.1` a `Nv.5`), o la etiqueta *"Sin competencias"* en caso de no tener asignadas.

---

## Hito 7: Dashboards Especializados por Rol con Métricas Recharts y Sistema de Notificaciones In-App (RF-023, RF-024, RF-025)

### Requerimientos del Usuario:
* Implementar los bloques faltantes del PRD con prioridad en impacto visual y funcional:
  1. **Notificaciones In-App (RF-025):** Notificaciones en tiempo real para eventos críticos (postulaciones, asignación de planes, envíos de entregables, revisiones de supervisores y evaluaciones).
  2. **Paneles y Métricas Avanzadas por Rol con Gráficas (RF-023, RF-024):** Dashboards completamente adaptados a cada función organizacional (Empleado, Supervisor, RH/Admin) con cálculo de indicadores clave y visualizaciones interactivas con Recharts.

### Modificaciones Realizadas:

1. **Modelo de Notificaciones en Base de Datos ([prisma/schema.prisma](file:///f:/TO_DO%20PROYECTO/pdp/prisma/schema.prisma)):**
   * Nuevo modelo `Notification`: `id`, `userId`, `title`, `message`, `type` (`INFO`, `SUCCESS`, `WARNING`, `ACTION_REQUIRED`), `linkUrl`, `read` (Boolean), `createdAt`.
   * Índice optimizado `@@index([userId, read])` y relación con cascada con `User`.
   * Sincronización exitosa con la base de datos SQLite y regeneración de Prisma Client.

2. **Módulo y Acciones de Notificaciones ([src/lib/notifications.ts](file:///f:/TO_DO%20PROYECTO/pdp/src/lib/notifications.ts) y [src/app/actions.ts](file:///f:/TO_DO%20PROYECTO/pdp/src/app/actions.ts)):**
   * Utilidades `createNotification` y `notifyUsers`.
   * Nuevas acciones de servidor: `markNotificationAsRead`, `markAllNotificationsAsRead`, `clearAllNotifications`.
   * Disparadores automáticos en eventos clave:
     * Postulación de un colaborador -> Alerta a RH/Admins y confirmación al empleado.
     * Aprobación de plan de desarrollo -> Alerta al colaborador informando que ya puede comenzar.
     * Envío de entregable con evidencia -> Alerta al supervisor con enlace directo para calificar.
     * Calificación o solicitud de ajustes -> Alerta al colaborador con el feedback del evaluador.

3. **Componente de Notificaciones en Barra de Navegación ([src/components/HeaderNotifications.tsx](file:///f:/TO_DO%20PROYECTO/pdp/src/components/HeaderNotifications.tsx) y [src/app/(app)/layout.tsx](file:///f:/TO_DO%20PROYECTO/pdp/src/app/(app)/layout.tsx)):**
   * Campana interactiva en el header con insignia animada de conteo de no leídas (`9+`).
   * Menú flotante (*popover*) con lista cronológica de notificaciones, código de colores por severidad, formato de tiempo transcurrido (*hace X min*), marcado con un clic y botón para limpiar historial.

4. **Dashboards Especializados por Rol con Recharts ([src/app/(app)/dashboard/page.tsx](file:///f:/TO_DO%20PROYECTO/pdp/src/app/(app)/dashboard/page.tsx)):**
   * **Para Administrador y Recursos Humanos ([src/components/dashboard/AdminRhDashboard.tsx](file:///f:/TO_DO%20PROYECTO/pdp/src/components/dashboard/AdminRhDashboard.tsx)):**
     * Indicadores clave con barras de progreso: Cobertura de Evaluaciones (%), Tasa de Cierre de Brechas (%), Tasa de Adopción de Planes (%) y Plantilla Activa.
     * Gráfica Recharts de **Competencias Más Demandadas** en oportunidades activas.
     * Gráfica Recharts Donut de **Distribución de Estados de Planes** (Aprobados, En Progreso, Completados, Borrador).
     * Gráfica Recharts de **Brechas Organizacionales por Competencia** para identificar necesidades prioritarias de capacitación.
     * Tabla en tiempo real de últimas postulaciones con compatibilidad, brechas y accesos rápidos.
   * **Para Supervisor ([src/components/dashboard/SupervisorDashboard.tsx](file:///f:/TO_DO%20PROYECTO/pdp/src/components/dashboard/SupervisorDashboard.tsx)):**
     * Indicadores: Total de equipo a cargo, entregables por revisar, avance promedio del equipo y brechas superadas.
     * Bandeja destacada de **Entregables por Calificar** con acceso a evidencias externas y botón directo de evaluación.
     * Gráfica Recharts de **Progreso de Planes por Colaborador**.
     * Gráfica Recharts Donut de **Cierre de Brechas del Equipo**.
     * Directorio de subordinados directos con accesos para evaluar o inspeccionar planes.
   * **Para Empleado / Colaborador ([src/components/dashboard/EmployeeDashboard.tsx](file:///f:/TO_DO%20PROYECTO/pdp/src/components/dashboard/EmployeeDashboard.tsx)):**
     * Indicadores: Progreso de su plan activo con barra porcentual, brechas superadas vs abiertas, total postulaciones y promedio de dominio competencial (1 a 5).
     * Gráfica Recharts de **Mi Perfil de Competencias** (escala 1 a 5).
     * Lista de **Próximas Actividades a Entregar** con botón directo `Enviar entrega`.
     * Lista de mis postulaciones recientes y oportunidades abiertas recomendadas.

---

## Hito 8: Bloque 3 - Módulo de Auditoría y Trazabilidad (RF-026, OE-17)

### Requerimiento del PRD:
* **RF-026 (Auditoría del Sistema):** La plataforma debe registrar automáticamente todas las operaciones críticas realizadas por los usuarios (creación, edición, eliminación lógica, cambio de estado, aprobación, etc.), incluyendo: usuario ejecutor, fecha y hora exacta, entidad afectada, tipo de acción y detalle descriptivo.
* **OE-17 (Trazabilidad y Cumplimiento Normativo):** El historial de auditoría debe ser inmutable y accesible exclusivamente para perfiles autorizados (`ADMIN` y `RH`), con capacidades de búsqueda libre y filtrado por entidad y acción.

### Modificaciones Realizadas:

1. **Modelo de Datos de Auditoría ([prisma/schema.prisma](file:///f:/TO_DO%20PROYECTO/pdp/prisma/schema.prisma)):**
   * Nuevo modelo `AuditLog`:
     * `id`: Identificador autoincremental único.
     * `userId`: Identificador del usuario que ejecutó la acción (relacionado con modelo `User`).
     * `action`: Código estandarizado de la operación (`CREAR_EMPLEADO`, `CREAR_COMPETENCIA`, `EVALUACION_DIAGNOSTICA`, `CREAR_OPORTUNIDAD`, `PUBLICAR_OPORTUNIDAD`, `CERRAR_OPORTUNIDAD`, `POSTULACION`, `CREAR_PLAN`, `APROBAR_PLAN`, `ENTREGA_ACTIVIDAD`, `REVISION_ACTIVIDAD`).
     * `entity`: Nombre de la entidad afectada (`Empleado`, `Competencia`, `Evaluacion`, `Oportunidad`, `Postulacion`, `Plan`, `Actividad`).
     * `entityId`: ID de la entidad involucrada (opcional).
     * `details`: Explicación textual legible para humanos de la operación realizada.
     * `createdAt`: Marca temporal exacta generada automáticamente.
   * Índices de alto rendimiento: `@@index([action])`, `@@index([entity])`, `@@index([createdAt])`.
   * Sincronización con base de datos SQLite y regeneración de tipos con Prisma Client.

2. **Servicio Centralizado de Auditoría ([src/lib/audit.ts](file:///f:/TO_DO%20PROYECTO/pdp/src/lib/audit.ts)):**
   * Función `logAudit({ userId, action, entity, entityId, details })` con manejo robusto de excepciones para garantizar que un fallo de auditoría no bloquee la transacción principal del usuario.

3. **Instrumentación de Operaciones Críticas en Acciones del Servidor ([src/app/actions.ts](file:///f:/TO_DO%20PROYECTO/pdp/src/app/actions.ts)):**
   * Registro sistemático de eventos en:
     * `createEmployee`: Registro de alta de colaborador con departamento asignado.
     * `setEmployeeStatus`: Registro de activación/inactivación de colaboradores.
     * `createCompetency`: Registro de incorporación de nuevas competencias al catálogo.
     * `toggleCompetency`: Registro de bajas lógicas y reactivaciones de competencias.
     * `createEvaluation`: Registro de evaluaciones diagnósticas y post-capacitación.
     * `createOpportunity`, `publishOpportunity`, `closeOpportunity`: Ciclo de vida de vacantes.
     * `applyToOpportunity`: Registro de postulaciones enviadas.
     * `createPlan`, `approvePlan`: Creación y formalización de planes de desarrollo.
     * `submitActivityDeliverable`, `reviewActivityDeliverable`: Envío y calificación de entregables.

4. **Interfaz de Consulta y Filtrado de Auditoría ([src/app/(app)/auditoria/page.tsx](file:///f:/TO_DO%20PROYECTO/pdp/src/app/(app)/auditoria/page.tsx)):**
   * Acceso protegido por roles (solo visible y accesible para `ADMIN` y `RH`; colaboradores y supervisores reciben pantalla amigable de acceso restringido).
   * Tarjetas de resumen en tiempo real: Total de eventos registrados, operaciones ejecutadas hoy y total de registros mostrados.
   * Filtros combinados por:
     * **Entidad** (Empleado, Competencia, Evaluación, Oportunidad, Plan, Actividad).
     * **Acción** con íconos e insignias codificadas por color según la naturaleza de la operación.
     * **Búsqueda por texto libre** en el detalle del evento o nombre de usuario ejecutor.
   * Enlace directo en la barra superior de navegación (`src/app/(app)/layout.tsx`) para roles autorizados.

5. **Pruebas Automatizadas de Auditoría ([tests/auditoria-test.mjs](file:///f:/TO_DO%20PROYECTO/pdp/tests/auditoria-test.mjs)):**
   * Verificación de autenticación de sesión `ADMIN`.
   * Verificación de consulta y renderizado de la tabla de eventos con código 200.
   * Verificación de funcionamiento del filtro por URL (`?entity=Oportunidad`).
   * Verificación de restricción de acceso para el rol `EMPLEADO` (bloqueo efectivo).

---

## Hito 9: Bloque 4 - Objetivos Organizacionales y Evaluación de Desempeño (RF-007, OE-04)

### Requerimiento del PRD:
* **RF-007 (Evaluación de desempeño):** El sistema deberá permitir evaluar el cumplimiento de objetivos organizacionales.
* **OE-04 (Objetivos de Desempeño):** Permitir registrar y evaluar objetivos de desempeño, vinculándolos a los departamentos, la organización y los planes de desarrollo.

### Modificaciones Realizadas:

1. **Modelos de Datos en Prisma ([prisma/schema.prisma](file:///f:/TO_DO%20PROYECTO/pdp/prisma/schema.prisma)):**
   * `OrganizationalObjective`:
     * `id`, `title`, `description`, `targetPeriod` (ej. "2025 - Q1", "2025 - Anual"), `category` (`ESTRATEGICO`, `INNOVACION`, `CALIDAD`, `OPERATIVO`), `targetValue` (Float), `unit` (String), `weight` (Int 1..5), `status` (`ACTIVO`, `PAUSADO`, `COMPLETADO`, `CANCELADO`), `departmentId` (opcional o global), `createdById`.
     * Relaciones con `ObjectiveEvaluation` y `DevelopmentPlan` (permitiendo vincular planes de desarrollo a metas estratégicas).
   * `ObjectiveEvaluation`:
     * `id`, `evaluationId` (relación con cascada hacia `Evaluation`), `objectiveId`, `currentValue` (valor numérico alcanzado por el empleado), `complianceRate` (% de cumplimiento calculado), `rating` (escala 1 a 5), `feedback` (observaciones del evaluador), `createdAt`.
     * Restricción única `@@unique([evaluationId, objectiveId])`.
   * Sincronización exitosa con base de datos SQLite y regeneración de tipos con Prisma Client.

2. **Acciones del Servidor ([src/app/actions.ts](file:///f:/TO_DO%20PROYECTO/pdp/src/app/actions.ts)):**
   * `createObjective`: Creación de objetivos estratégicos por RH/Admin con registro de auditoría (`CREAR_OBJETIVO`).
   * `updateObjectiveStatus`: Cambio de ciclo de vida (Completar, Pausar o Reactivar) con auditoría (`ACTUALIZAR_OBJETIVO`).
   * `createEvaluation`: Actualizada para evaluar simultáneamente **Competencias (RF-006)** y **Cumplimiento de Objetivos Organizacionales (RF-007)** del departamento del empleado o globales, calculando el `% de cumplimiento` automático y registrando el evento de auditoría `EVALUAR_OBJETIVOS`.

3. **Formulario de Creación de Objetivos ([src/components/ObjetivoForm.tsx](file:///f:/TO_DO%20PROYECTO/pdp/src/components/ObjetivoForm.tsx)):**
   * Formulario interactivo con categorías temáticas con íconos, meta numérica, unidad personalizada, ponderación de 1 a 5 y selector de alcance (Global empresarial vs Departamental).

4. **Pestaña de Objetivos en Evaluaciones ([src/components/EvaluacionForm.tsx](file:///f:/TO_DO%20PROYECTO/pdp/src/components/EvaluacionForm.tsx)):**
   * Integración de dos pestañas: `1. Competencias (RF-006)` y `2. Objetivos de Desempeño (RF-007)`.
   * Permite al evaluador capturar el valor alcanzado, calificación de 1 a 5 y observaciones específicas por objetivo para el colaborador.

5. **Módulo Completo de Objetivos ([src/app/(app)/objetivos/page.tsx](file:///f:/TO_DO%20PROYECTO/pdp/src/app/(app)/objetivos/page.tsx)):**
   * Vista accesible para todos los roles con métricas organizacionales en tiempo real: Objetivos Activos, Promedio de Cumplimiento Global (%), Total de Evaluaciones Registradas y Departamentos alineados.
   * Filtros combinados por Departamento y Estado.
   * Tarjetas informativas con barra de progreso del promedio alcanzado, desglose de calificaciones y resultados recientes de colaboradores.
   * Enlace en la barra superior de navegación (`src/app/(app)/layout.tsx`) para todos los perfiles.

6. **Pruebas Automatizadas de Objetivos y Desempeño ([tests/objetivos-desempeno-test.mjs](file:///f:/TO_DO%20PROYECTO/pdp/tests/objetivos-desempeno-test.mjs)):**
   * Verificación de acceso y creación de objetivos con rol `ADMIN`.
   * Verificación de consulta y visualización de objetivos con rol `EMPLEADO` (sin permisos de edición).
   * Verificación de renderizado de objetivos y competencias en `/evaluaciones`.
   * Verificación de filtros por departamento. 100% exitosas.

---

## Hito 10: Bloque 5 - Carga e Importación Masiva por CSV / Plantilla (RF-027, OE-18)

### Requerimiento del PRD:
* **RF-027 (Carga de datos):** El sistema deberá permitir la importación inicial de empleados, departamentos, puestos y competencias mediante plantillas.
* **OE-18 (Eficiencia Operativa en Cargas Iniciales):** Habilitar la incorporación masiva de nómina y catálogos mediante formatos de texto plano estandarizados (.CSV), con manejo automático de relaciones y trazabilidad.

### Modificaciones Realizadas:

1. **Rutas de Descarga de Plantillas Oficiales ([src/app/api/templates/](file:///f:/TO_DO%20PROYECTO/pdp/src/app/api/templates/)):**
   * `/api/templates/empleados`: Descarga de `plantilla_empleados.csv` con cabeceras `nombre,apellidos,email,departamento,puesto,rol,supervisor_email` y filas de ejemplo.
   * `/api/templates/competencias`: Descarga de `plantilla_competencias.csv` con cabeceras `nombre,descripcion,tipo` y ejemplos de competencias técnicas y blandas.
   * Configuración de cabeceras HTTP `Content-Disposition: attachment` para descarga directa en el navegador.

2. **Parser y Acciones del Servidor ([src/app/actions.ts](file:///f:/TO_DO%20PROYECTO/pdp/src/app/actions.ts)):**
   * Función `parseCsv(text)`: Procesador de CSV que maneja saltos de línea Windows (`\r\n`) y Unix (`\n`), comillas envolventes y limpieza de espacios en blanco.
   * `importEmployeesCsv`:
     * Valida cabeceras requeridas (`nombre`, `email`).
     * Crea departamentos (`Department`) y puestos (`Position`) automáticamente si no existen en la base de datos (upsert inteligente).
     * Crea la cuenta de acceso (`User`) con contraseña inicial segura (`Demo1234!`) y rol asignado.
     * Asocia automáticamente el `supervisorId` si el correo del supervisor está registrado.
     * Filtra y omite duplicados o filas inválidas sin detener la importación.
     * Registra auditoría automática `IMPORTACION_MASIVA` en `AuditLog`.
   * `importCompetenciesCsv`:
     * Valida y normaliza el tipo (`TECNICA` / `BLANDA`).
     * Inserta competencias con estado `ACTIVA` y omite duplicadas existentes.
     * Registra auditoría automática `IMPORTACION_MASIVA`.

3. **Módulo Web de Importación ([src/app/(app)/importacion/page.tsx](file:///f:/TO_DO%20PROYECTO/pdp/src/app/(app)/importacion/page.tsx)):**
   * Acceso exclusivo para perfiles `ADMIN` y `RH`.
   * Tarjetas de métricas del volumen actual (Total de Empleados, Departamentos, Puestos y Competencias).
   * Dos paneles de importación:
     * **Personal y Estructura Organizacional:** Botón para descargar plantilla, selector de archivo y botón de procesamiento.
     * **Catálogo de Competencias:** Botón para descargar plantilla y cargador de archivo.
   * Alertas contextuales de éxito (conteo de registros creados vs omitidos) y de error (archivos vacíos o cabeceras no válidas).

4. **Accesos Rápidos y Navegación:**
   * Botón directo `Importar CSV` integrado en el encabezado de [src/app/(app)/empleados/page.tsx](file:///f:/TO_DO%20PROYECTO/pdp/src/app/(app)/empleados/page.tsx).
   * Botón directo `Importar CSV` integrado en el encabezado de [src/app/(app)/competencias/page.tsx](file:///f:/TO_DO%20PROYECTO/pdp/src/app/(app)/competencias/page.tsx).
   * Enlace permanente en la barra superior de navegación ([src/app/(app)/layout.tsx](file:///f:/TO_DO%20PROYECTO/pdp/src/app/(app)/layout.tsx)) para administradores y RH.

5. **Pruebas Automatizadas ([tests/importacion-csv-test.mjs](file:///f:/TO_DO%20PROYECTO/pdp/tests/importacion-csv-test.mjs)):**
   * Descarga y validación de sintaxis de ambas plantillas CSV (200 OK).
   * Verificación de acceso y permisos de administración (`ADMIN` permitido, `EMPLEADO` bloqueado).
   * Verificación de inserción masiva en base de datos.
   * Verificación de compatibilidad y registro en auditoría con `IMPORTACION_MASIVA`. 100% de tests aprobados.

---

## Hito 11: Bloque 6 - Mi Perfil y Restablecimiento / Cambio de Contraseña (RF-028, RNF-001)

### Requerimiento del PRD:
* **RF-028 (Recuperación y Restablecimiento de Contraseña):** El sistema deberá permitir el restablecimiento de contraseña.
* **RNF-001 (Seguridad y Privacidad):** Hashing seguro de contraseñas con salado irreversible (`bcryptjs`), validación de longitud mínima y verificación de credenciales actuales antes de modificaciones sensibles.

### Modificaciones Realizadas:

1. **Acciones del Servidor ([src/app/actions.ts](file:///f:/TO_DO%20PROYECTO/pdp/src/app/actions.ts)):**
   * `changePassword`:
     * Requiere sesión activa del usuario.
     * Valida obligatoriedad de campos, longitud mínima (≥ 6 caracteres) y coincidencia de confirmación.
     * Verifica la contraseña actual mediante `bcrypt.compareSync` antes de permitir cualquier modificación.
     * Genera hash salado irreversible con `bcrypt.hashSync(newPassword, 10)` y actualiza `user.passwordHash`.
     * Emite notificación in-app de confirmación de seguridad (`SUCCESS`).
     * Registra evento de auditoría `CAMBIO_CONTRASENA` en `AuditLog`.
   * `adminResetPassword`:
     * Permiso exclusivo para roles `ADMIN` y `RH`.
     * Restablece la contraseña de cualquier usuario o colaborador a la clave temporal estandarizada (`Demo1234!`) cuando el empleado la olvida.
     * Emite notificación in-app de advertencia (`WARNING`) invitando a actualizar la clave temporal.
     * Registra evento de auditoría `RESTABLECER_CONTRASENA`.

2. **Módulo de Perfil Personal ([src/app/(app)/perfil/page.tsx](file:///f:/TO_DO%20PROYECTO/pdp/src/app/(app)/perfil/page.tsx)):**
   * Consulta integral de la cuenta: Nombre completo, email corporativo, rol con badge estilizado e identificador de cuenta.
   * Información laboral vinculada: Departamento asignado, puesto, nombre del supervisor directo y estatus laboral.
   * Cuadrícula de competencias vigentes del colaborador con sus niveles de dominio (1 a 5).
   * Formulario seguro para cambio de contraseña con validación de clave actual y confirmación de nueva clave.
   * Banners de confirmación de éxito y mensajes explicativos ante errores de coincidencia o clave actual incorrecta.

3. **Restablecimiento Administrativo desde Nómina ([src/app/(app)/empleados/page.tsx](file:///f:/TO_DO%20PROYECTO/pdp/src/app/(app)/empleados/page.tsx)):**
   * Acción `Restablecer clave` incorporada directamente en la columna de acciones para que RH o Administradores puedan atender solicitudes de reseteo con un solo clic.

4. **Acceso Rápido en Encabezado ([src/app/(app)/layout.tsx](file:///f:/TO_DO%20PROYECTO/pdp/src/app/(app)/layout.tsx)):**
   * Avatar y botón interactivo `[Nombre]` en la barra superior que enlaza directamente a `/perfil`.

5. **Pruebas Automatizadas ([tests/perfil-password-test.mjs](file:///f:/TO_DO%20PROYECTO/pdp/tests/perfil-password-test.mjs)):**
   * Verificación de acceso a `/perfil` con rol `EMPLEADO` (200 OK).
   * Verificación de hashing bcrypt y cambio exitoso de contraseña a nueva clave.
   * Verificación de inicio de sesión exitoso con la nueva credencial (HTTP 302).
   * Verificación de restablecimiento administrativo de contraseña por Admin/RH.
   * Verificación de inicio de sesión tras el restablecimiento y registro de auditoría (`CAMBIO_CONTRASENA` y `RESTABLECER_CONTRASENA`). 100% exitosas.

---

## Hito 12: Rediseño Visual a Tema Oscuro (Negro, Rojo y Matices de Gris) y Barra Lateral a la Izquierda (Sidebar)

### Requerimiento del Usuario:
* Cambiar el tema de la aplicación por uno con paleta de negro/rojo y con matices de gris.
* Mover los botones de navegación (Inicio, Empleados, Competencias, Evaluaciones, Objetivos, etc.) a la izquierda de la interfaz.

### Modificaciones Realizadas:

1. **Nueva Barra Lateral Izquierda ([src/components/AppSidebar.tsx](file:///f:/TO_DO%20PROYECTO/pdp/src/components/AppSidebar.tsx)):**
   * Creación del componente cliente `AppSidebar` situado en la columna izquierda fija/adherida (`w-64 xl:w-72 border-r border-zinc-800/80 bg-[#0c0c11]`).
   * Menú vertical completo con todos los accesos principales acompañados de íconos representativos ( Inicio, Empleados, Competencias, Evaluaciones, Objetivos, Oportunidades, Postulaciones, Planes, Importación, Auditoría).
   * Detección dinámica de ruta activa (`usePathname()`) con realce en rojo rubí degradado (`from-red-950/70 via-red-900/30`), borde indicador izquierdo (`border-l-3 border-red-500`) y punto resplandeciente.
   * Sección inferior con minitarjeta del usuario conectado, rol con badge estilizado, acceso directo a `Mi Perfil` y botón de `Salir` con acción de servidor segura.
   * Drawer responsivo para dispositivos móviles con botón hamburguesa y fondo con desenfoque.

2. **Esquema Global de Colores Negro / Rojo / Matices de Gris ([src/app/globals.css](file:///f:/TO_DO%20PROYECTO/pdp/src/app/globals.css)):**
   * Fondo general obsidiana profundo: `#09090b` (`--background`).
   * Tipografía de alto contraste blanco/marfil: `#f4f4f5` (`--foreground`), con grises secundarios `#a1a1aa`, `#71717a`.
   * Superficies de tarjetas en carbón oscuro (`#121217`) con bordes en matices de gris (`#272732`).
   * Acentos en rojo carmesí / rubí (`#dc2626`, `#ef4444`) para botones principales con sombra resplandeciente, inputs activos con anillo rojo e insignias clave.
   * Adaptación de tablas, campos de texto, selectores y leyendas en gráficas Recharts para visualización en modo oscuro.

3. **Reestructuración de Layout Principal ([src/app/(app)/layout.tsx](file:///f:/TO_DO%20PROYECTO/pdp/src/app/(app)/layout.tsx)):**
   * Disposición flexible horizontal (`flex-col lg:flex-row`) con la barra lateral ubicada a la izquierda y el contenedor de trabajo a la derecha.
   * Barra superior ligera de soporte con indicador de sistema activo, campana de notificaciones in-app y acceso a perfil.

4. **Pruebas Automatizadas ([tests/theme-and-sidebar-test.mjs](file:///f:/TO_DO%20PROYECTO/pdp/tests/theme-and-sidebar-test.mjs)):**
   * Verificación de renderizado de la barra lateral `<aside>` en la posición izquierda.
   * Verificación de presencia y enlaces con íconos para todos los botones de navegación.
   * Verificación de clases del tema oscuro (`app-dark-layout`, acentos `border-red-500` y `from-red-600`). 100% de tests aprobados.

---

## Resumen de Archivos Principales del Sistema

| Archivo | Rol / Contenido |
| :--- | :--- |
| `contexto.md` | Documento maestro de alcance, ciclo de vida, roles y arquitectura general |
| `historial.md` | Bitácora y control de cambios cronológico por versiones |
| `.env` | Variables de entorno (Base de datos, Secrets y ranuras IA 1 y 2) |
| `prisma/schema.prisma` | Modelo de datos (Usuario, Empleado, Competencia, Brecha, Recomendación, Plan, Actividad, Notificación, AuditLog, OrganizationalObjective, ObjectiveEvaluation) |
| `src/components/AppSidebar.tsx` | Barra lateral izquierda con botones de navegación, íconos, estado activo y drawer móvil |
| `src/app/(app)/layout.tsx` | Layout maestro con arquitectura de barra lateral izquierda y tema oscuro |
| `src/app/globals.css` | Sistema de estilos del tema Negro / Rojo / Matices de Gris (App Dark Theme) |
| `src/app/(app)/perfil/page.tsx` | Módulo de Perfil Personal, asignación laboral y cambio de contraseña (RF-028, RNF-001) |
| `src/app/(app)/importacion/page.tsx` | Panel de Carga Masiva de Nómina, Puestos y Competencias por CSV (RF-027, OE-18) |
| `src/app/api/templates/empleados/route.ts` | Endpoint de descarga de plantilla CSV oficial de empleados |
| `src/app/api/templates/competencias/route.ts` | Endpoint de descarga de plantilla CSV oficial de competencias |
| `src/app/(app)/objetivos/page.tsx` | Módulo de Objetivos Organizacionales y Cumplimiento de Desempeño (RF-007, OE-04) |
| `src/components/ObjetivoForm.tsx` | Formulario de definición de metas y objetivos estratégicos por RH/Admin |
| `src/components/EvaluacionForm.tsx` | Formulario integral con pestañas de Competencias (RF-006) y Objetivos (RF-007) |
| `src/app/(app)/evaluaciones/page.tsx` | Vista de evaluaciones con matrices de competencias y tarjetas de objetivos cumplidos |
| `src/lib/audit.ts` | Servicio de registro y auditoría inmutable de eventos críticos (RF-026) |
| `src/app/(app)/auditoria/page.tsx` | Panel de auditoría y trazabilidad con filtros y búsqueda (ADMIN/RH) |
| `src/lib/notifications.ts` | Motor y utilidades de emisión de notificaciones in-app |
| `src/components/HeaderNotifications.tsx` | Componente de campana con menú flotante de notificaciones |
| `src/app/(app)/dashboard/page.tsx` | Enrutador y recolector de métricas de servidor por rol |
| `src/components/dashboard/AdminRhDashboard.tsx` | Dashboard ejecutivo de métricas globales, cobertura y gráficas Recharts para Admin/RH |
| `src/components/dashboard/SupervisorDashboard.tsx` | Dashboard del supervisor con cola de entregables, avance de equipo y gráficas |
| `src/components/dashboard/EmployeeDashboard.tsx` | Dashboard del colaborador con seguimiento de plan, perfil competencial y entregas |
| `src/lib/ai.ts` | Motor de IA con prompt 70-20-10, failover de proveedores y plantilla estructurada |
| `src/app/actions.ts` | Server actions (Autenticación, Notificaciones, Auditoría, Objetivos, Importación CSV, Contraseñas, Entregables y Feedback) |
| `src/app/login/page.tsx` | Página de login con slideshow dinámico y tarjeta glassmorphism |
| `src/components/EmpleadoForm.tsx` | Formulario de alta de empleados con selector dinámico de competencias iniciales y niveles |
| `src/app/(app)/empleados/page.tsx` | Directorio de empleados con columna de insignias, reseteo de clave y botón de importación CSV |
| `src/app/(app)/competencias/page.tsx` | Catálogo de competencias con botón de importación masiva CSV |
| `src/components/PlanActivityCard.tsx` | Tarjeta interactiva de actividad para entregables del empleado y revisión del supervisor |
| `src/app/(app)/postulaciones/[id]/page.tsx` | Detalle de postulación, compatibilidad, brechas y Fase 4 con tarjetas de desglose |
| `src/app/(app)/planes/page.tsx` | Vista de seguimiento del plan de desarrollo con barra de progreso interactiva |
| `public/backgrounds/` | Carpeta de imágenes de fondo personalizables |

---

## Hito 13: Depuración Visual de la Tarjeta de Inicio de Sesión (Login)

### Requerimiento del Usuario:
* Eliminar los enlaces de texto "Forgot Password" y "Sign Up" que figuraban en la tarjeta de inicio de sesión.

### Modificaciones Realizadas:
1. **Limpieza en [src/components/LoginFormCard.tsx](file:///f:/TO_DO%20PROYECTO/pdp/src/components/LoginFormCard.tsx):**
   * Se retiró el contenedor de enlaces de pie (`Forgot Password?` y `Sign Up`), dejando la tarjeta centrada exclusivamente en los campos de usuario/contraseña y el botón principal de acceso (`LOGIN`), conservando la estética glassmorphism minimalista.
2. **Validación:**
   * Comprobación en tiempo de ejecución de la respuesta de `/login`: ausencia confirmada de ambos textos.
   * Compilación limpia con `npx tsc --noEmit` (0 errores).

---

## Hito 14: Leyenda Descriptiva al Pasar el Mouse sobre Competencias (Hover Tooltip In-Situ)

### Requerimiento del Usuario:
* Al entrar en la sección de empleados (`/empleados`), cuando alguien pase el cursor del mouse por encima de una competencia (ej. Python nivel 4 o habilidades blandas nivel 3), mostrar una pequeña leyenda explicativa de lo que significa dicho nivel.
* Requisito estricto: no debe abrir otra página, ni redirigir a ninguna otra parte, únicamente desplegar una tarjeta flotante descriptiva contextual al hacer hover.

### Modificaciones Realizadas:
1. **Componente Cliente de Tooltip ([src/components/CompetencyBadgeTooltip.tsx](file:///f:/TO_DO%20PROYECTO/pdp/src/components/CompetencyBadgeTooltip.tsx)):**
   * Creación de un componente ligero e interactivo basado en `createPortal` en `document.body` y coordenadas fijas calculadas por `getBoundingClientRect()`, garantizando que nunca quede cortado por `overflow-hidden` o tablas con scroll horizontal.
   * **Desglose Descriptivo por Nivel (1 a 5):**
     * **Especializado:** Textos contextuales para tecnologías clave (Python, SQL/Datos) y habilidades blandas (Liderazgo, Comunicación).
     * **Matriz Genérica:** Comportamientos técnicos (principiante, autónomo, referente, maestro) vs comportamientos de habilidades blandas (colaboración, influencia, resolución constructiva).
   * **Diseño Visual:**
     * Nombre de la competencia, insignia por tipo (*Técnica* en cian, *Habilidad Blanda* en púrpura), estrellas doradas de nivel (1 a 5).
     * Título del nivel (ej. *Nivel 4 — Experto / Referente en Python*).
     * Párrafo explicativo del alcance del colaborador en dicho nivel.
     * Descripción base del catálogo de competencias.
   * Sin enlaces (`<a>`), sin recargas de página, y con soporte táctil en dispositivos móviles.
2. **Integración en Páginas Clave:**
   * **Directorio de Empleados ([src/app/(app)/empleados/page.tsx](file:///f:/TO_DO%20PROYECTO/pdp/src/app/(app)/empleados/page.tsx)):** Cada insignia de competencia en la columna de la tabla ahora utiliza `CompetencyBadgeTooltip`.
   * **Mi Perfil ([src/app/(app)/perfil/page.tsx](file:///f:/TO_DO%20PROYECTO/pdp/src/app/(app)/perfil/page.tsx)):** La cuadrícula de competencias vigentes del colaborador también permite visualizar la leyenda descriptiva.
3. **Pruebas Automatizadas ([tests/competency-tooltip-test.mjs](file:///f:/TO_DO%20PROYECTO/pdp/tests/competency-tooltip-test.mjs)):**
   * Verificación de la renderización de competencias en `/empleados` (ej. Sergio Ponce con Python Nivel 4).
   * Verificación de que no existen enlaces externos ni redirecciones. 100% de tests aprobados.

---

## Hito 15: Selección Específica y Voluntaria de Competencias en Formulario de Empleado

### Requerimiento del Usuario:
* Al dar de alta un nuevo empleado en la sección de Empleados, poder agregar la competencia que el usuario seleccione libremente, corrigiendo el comportamiento anterior donde siempre se auto-asignaba por defecto "Comunicación (blanda)" como primera opción.

### Causa Raíz Identificada:
* En `EmpleadoForm.tsx`, la función `addRow` ejecutaba `competencies.find(...)`, seleccionando automáticamente la primera competencia en orden alfabético del catálogo (`Comunicación`), forzando su inserción en lugar de permitir una elección deliberada.

### Modificaciones Realizadas:
1. **Rediseño del Flujo de Asignación en [src/components/EmpleadoForm.tsx](file:///f:/TO_DO%20PROYECTO/pdp/src/components/EmpleadoForm.tsx):**
   * **Selector Directo Específico:** Menú desplegable con opción inicial `-- Elige qué competencia deseas agregar --` + selector de nivel de dominio (1 a 5) + botón `+ Agregar seleccionada`.
   * **Chips Rápidos Interactivos:** Botones con un solo clic para cada competencia disponible no agregada aún, con distintivo de tipo (*Técnica* en cian, *Blanda* en púrpura).
   * **Filas Manuales Sin Preselección Forzada:** Las filas añadidas inician vacías (`competencyId: ""`), permitiendo al usuario elegir del desplegable sin sesgos.
   * **Prevención de Duplicados:** Las competencias ya agregadas quedan deshabilitadas para evitar re-selecciones redundantes.
   * **Estilo Visual Oscuro Consistente:** Integración completa con el tema Negro / Rojo / Matices de Gris.
2. **Pruebas Automatizadas ([tests/empleado-form-competency-test.mjs](file:///f:/TO_DO%20PROYECTO/pdp/tests/empleado-form-competency-test.mjs)):**
   * Comprobación de eliminación de `firstUnused` automático.
   * Verificación de presencia del selector específico `compToAdd`, `handleAddSelected`, chips rápidos y filas vacías. 100% aprobado.
3. **Actualización del Documento Maestro:**
   * Actualizado [contexto.md](file:///f:/TO_DO%20PROYECTO/pdp/contexto.md) en Fase 1 y Sección 5.12.

---

## Hito 16: Vinculación de Oportunidades con Objetivos Organizacionales y Trazabilidad de Cumplimiento

### Requerimiento del Usuario:
* Aclarar y habilitar el enlace entre convocatorias / oportunidades nuevas y los objetivos organizacionales estratégicos.
* Explicar con precisión el funcionamiento y la forma en que se llena el porcentaje de "Cumplimiento Registrado" de las metas.

### Modificaciones Realizadas:
1. **Extensión del Modelo de Datos ([prisma/schema.prisma](file:///f:/TO_DO%20PROYECTO/pdp/prisma/schema.prisma)):**
   * Agregado el campo `objectiveId Int?` y la relación `objective OrganizationalObjective?` en el modelo `Opportunity`.
   * Agregada la relación inversa `opportunities Opportunity[]` en `OrganizationalObjective`.
   * Sincronizado esquema en base de datos SQLite y regenerado cliente tipado de Prisma.
2. **Formulario de Oportunidades ([src/components/OportunidadForm.tsx](file:///f:/TO_DO%20PROYECTO/pdp/src/components/OportunidadForm.tsx)):**
   * Selector desplegable para alinear voluntariamente la convocatoria con un objetivo organizacional activo (mostrando título, período y categoría).
   * Estilo consistente con el tema oscuro Negro / Rojo / Gris.
3. **Acciones y Herencia en Planes ([src/app/actions.ts](file:///f:/TO_DO%20PROYECTO/pdp/src/app/actions.ts)):**
   * Guardado de `objectiveId` en `createOpportunity` con registro en bitácora de auditoría.
   * Herencia automática de `strategicObjectiveId` en `createPlan`, enlazando el ciclo completo: *Objetivo Corporativo -> Convocatoria -> Postulación -> Plan de Desarrollo*.
4. **Visualización en Catálogo ([src/app/(app)/oportunidades/page.tsx](file:///f:/TO_DO%20PROYECTO/pdp/src/app/(app)/oportunidades/page.tsx)):**
   * Insignia destacada en cada tarjeta de oportunidad indicando el objetivo al que contribuye.
5. **Pruebas Automatizadas ([tests/opportunity-objective-link-test.mjs](file:///f:/TO_DO%20PROYECTO/pdp/tests/opportunity-objective-link-test.mjs)):**
   * Prueba completa de creación de oportunidad con objetivo, postulación y herencia en plan. 100% aprobado.

---

## Hito 17: Suavización de la Intensidad del Rojo / Carmesí
* **Requerimiento del Usuario:** Atenuar el rojo intenso hacia una gama más elegante y descansada para la vista.
* **Solución Implementada:**
  * En [src/app/globals.css](file:///f:/TO_DO%20PROYECTO/pdp/src/app/globals.css), se redefinieron las variables `--color-red-*` hacia una paleta borgoña / carmesí templado: `--color-red-600: #8c2534`, `--color-red-500: #ad4251`, `--color-red-700: #751c2a`.
  * Se actualizaron los degradados de botones de acción y halos activos de navegación lateral.

---

## Hito 18: Buscador y Filtros Avanzados en el Directorio de Empleados
* **Requerimiento del Usuario:** Incorporar un buscador por nombre de colaborador y filtros cruzados por departamento, puesto y competencias en `/empleados`.
* **Solución Implementada:**
  * Creación del componente cliente [src/components/EmpleadosDirectory.tsx](file:///f:/TO_DO%20PROYECTO/pdp/src/components/EmpleadosDirectory.tsx).
  * Búsqueda en vivo insensible a acentos (`normalizeText`) sobre nombre, apellidos y email.
  * Menús desplegables para filtrar por Departamento, Puesto y Competencias con contador dinámico y botón de reinicio de filtros.
  * Pruebas automatizadas en [tests/empleados-filters-test.mjs](file:///f:/TO_DO%20PROYECTO/pdp/tests/empleados-filters-test.mjs).

---

## Hito 19: Rediseño Ejecutivo y Acordeón Desplegable en Planes de Desarrollo
* **Requerimiento del Usuario:** Los planes en `/planes` aparecían todos expandidos con decenas de actividades desplegadas a la vez, resultando abrumador. Se solicitó mostrar solo la información más importante por defecto y una pestaña desplegable para ver las fases, entregables y retroalimentación a detalle.
* **Solución Implementada:**
  * Creación de [src/components/PlanesList.tsx](file:///f:/TO_DO%20PROYECTO/pdp/src/components/PlanesList.tsx) e integración en [src/app/(app)/planes/page.tsx](file:///f:/TO_DO%20PROYECTO/pdp/src/app/(app)/planes/page.tsx).
  * **Tarjeta Ejecutiva Colapsada por Defecto:** Muestra título, colaborador con iniciales y departamento, oportunidad, fecha meta, badge de estado, objetivo resumido, barra de avance y pastillas con desglose de actividades completadas, en revisión, en progreso y pendientes.
  * **Pestaña Desplegable:** Botón `[ Ver fases, entregables y retroalimentación ({total} actividades) ▼ ]` para abrir las actividades (`PlanActivityCard`), subir entregables, calificar y ver el hito de reevaluación.
  * Barra de herramientas superior con buscador en vivo, filtro por estado y botones de *Expandir todo* y *Colapsar todo*.
  * Pruebas automatizadas en [tests/planes-ui-test.mjs](file:///f:/TO_DO%20PROYECTO/pdp/tests/planes-ui-test.mjs).

---

## Hito 20: Armonización Cromática hacia la Paleta Vino, Negro y Rojo
* **Requerimiento del Usuario:** Eliminar los tonos verdes disonantes que aparecían en el hito de reevaluación y en las tarjetas de actividades completadas para mantener la armonía vino/negro/rojo.
* **Solución Implementada:**
  * En [src/components/PlanesList.tsx](file:///f:/TO_DO%20PROYECTO/pdp/src/components/PlanesList.tsx): Rediseño del banner de reevaluación con degradado vino oscuro, borde borgoña y botón carmesí; barra de progreso al 100% y pastillas de conteo unificadas a tonos vino y rosa cálido.
  * En [src/components/PlanActivityCard.tsx](file:///f:/TO_DO%20PROYECTO/pdp/src/components/PlanActivityCard.tsx): Contenedor oscuro con borde vino suave (`border-red-900/50 bg-[#141218]`), badge de completada en borgoña profundo y botón de aprobación en carmesí.
  * En [src/app/globals.css](file:///f:/TO_DO%20PROYECTO/pdp/src/app/globals.css): Reglas globales en `.app-dark-layout` para adaptar automáticamente clases residuales verdes (`emerald`, `green`) a la paleta vino corporativa.

---

## Hito 21: Optimización de Modelos GLM Coding Plan (Coding Pro) y Timeout de Razonamiento
* **Requerimiento del Usuario:** Consulta y soporte para agregar una nueva clave de GLM del Plan mensual GLM Coding Pro, e investigación de por qué anteriormente se emitía el origen de plantilla estructurada.
* **Diagnóstico y Solución:**
  * Los modelos insignia de GLM Coding Pro (`glm-4.5` y `glm-5.3`) generan cadenas de pensamiento profundo (`reasoning_content`) de ~2500 tokens que demoran entre 40 y 55 segundos.
  * El timeout previo de 45 segundos cortaba la llamada justo antes de terminar.
  * Se amplió el timeout a **90 segundos** y se configuró `max_tokens: 4096` en [src/lib/ai.ts](file:///f:/TO_DO%20PROYECTO/pdp/src/lib/ai.ts).
  * Se verificó la compatibilidad con los endpoints internacional (`https://api.z.ai/api/coding/paas/v4`) y doméstico (`https://open.bigmodel.cn/api/coding/paas/v4`).
  * Validación en tiempo real con 100% de éxito generando el plan directamente con la IA real (`Origen: ia`, `Modelo: glm-4.5`).

---

## Hito 22: Análisis de Paradigma de Programación (POO Híbrida)
* **Requerimiento del Usuario:** Consulta sobre si existe Programación Orientada a Objetos en el proyecto.
* **Diagnóstico Arquitectónico:**
  * El proyecto implementa una **arquitectura híbrida moderna (POO + Funcional Declarativo)**:
    1. **POO:** Mapeo Objeto-Relacional con Prisma ORM (`new PrismaClient()`, modelos de datos en memoria con métodos y relaciones), entidades tipadas (`Employee`, `DevelopmentPlan`, etc.), clases nativas (`Date`, `Set`, `Map`, `FormData`, `NextResponse`, `Error`) y principios de abstracción y encapsulamiento en módulos.
    2. **Funcional Declarativo:** Componentes funcionales en React 19, hooks de estado inmutables, Server Actions puras y principio de *"Composición sobre herencia"*.

---

## Hito 23: Selector de Rango con Calendario en la Misma Ventana para Período de Evaluación
* **Requerimiento del Usuario:** En el modal de "Definir nuevo objetivo organizacional", sustituir el campo de texto libre en "Período de Evaluación" por un calendario que se abra en la misma ventana para elegir la fecha de inicio y de fin interactivamente sin tener que teclearla.
* **Solución Implementada:**
  * Creación del componente interactivo [src/components/PeriodDateRangePicker.tsx](file:///f:/TO_DO%20PROYECTO/pdp/src/components/PeriodDateRangePicker.tsx):
    * Tarjeta activadora que muestra el período formateado, duración en días y botón desplegable.
    * Ventana flotante / Popover en la misma interfaz con navegación mensual interactiva (`` y ``) y cuadrícula visual de días.
    * Selección en 2 clics (Fecha de Inicio y Fecha de Fin) con resaltado visual del rango en degradado vino/carmesí.
    * Selectores directos numéricos de fecha (`type="date"`) para inicio y fin.
    * Botones de atajos rápidos corporativos: Q1, Q2, Q3, Q4, Semestre 1, Semestre 2 y Anual.
    * Campo oculto sincronizado que envía el formato estructurado a la Server Action `createObjective`.
  * Integración en [src/components/ObjetivoForm.tsx](file:///f:/TO_DO%20PROYECTO/pdp/src/components/ObjetivoForm.tsx) con actualización integral a la estética Vino, Negro y Grafito.

