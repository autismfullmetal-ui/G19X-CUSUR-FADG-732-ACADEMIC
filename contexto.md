# Contexto Integral del Proyecto: Plataforma PDP

**Plataforma de Gestión y Planes de Desarrollo Profesional Individual (PDI / PDP)**  
*Documento consolidado de requerimientos, arquitectura, reglas de negocio, ciclo de vida del talento y módulos del sistema.*

---

## 1. Visión General y Propósito del Sistema

La **Plataforma PDP** es un sistema web integral diseñado para alinear las aspiraciones y el crecimiento profesional de los colaboradores con las necesidades estratégicas de la organización. Su propósito central es:

1. **Detectar brechas de competencias** entre el perfil real de un empleado y los requisitos de un puesto o proyecto.
2. **Generar recomendaciones de desarrollo específicas y de alto impacto** potenciadas por Inteligencia Artificial y respaldadas por metodologías formativas rigurosas (modelo 70-20-10).
3. **Gestionar la ejecución activa del plan de desarrollo**, permitiendo a los empleados registrar entregables y evidencias verificables (código, enlaces, proyectos, documentación).
4. **Habilitar la evaluación y retroalimentación continua** por parte de supervisores y Recursos Humanos.
5. **Cerrar formalmente las brechas** a través de evaluaciones post-capacitación objetivas.

---

## 2. Roles de Usuario y Ámbitos de Responsabilidad

El sistema opera bajo un control de acceso basado en roles (RBAC) con 4 perfiles claramente definidos:

### 2.1. Empleado (Colaborador)
* **Perfil:** Consulta de sus datos laborales, puesto actual, departamento y matriz de competencias vigente.
* **Evaluaciones:** Visualización de su historial de evaluaciones iniciales y reevaluaciones.
* **Oportunidades:** Exploración de vacantes internas disponibles (puestos o proyectos) y postulación a aquellas de su interés.
* **Compatibilidad y Brechas:** Consulta del porcentaje de compatibilidad calculado y el desglose de brechas por nivel.
* **Plan de Desarrollo Activo:**
  * Visualización de sus actividades formativas ordenadas por fases cronológicas.
  * Cambio de estado de actividades (`Iniciar actividad` -> `EN_PROGRESO`).
  * **Envío de entregables y evidencias:** Formulario interactivo para describir el trabajo realizado y adjuntar URLs a repositorios (GitHub), documentos (Drive) o demos.
  * Consulta de la retroalimentación formal y calificaciones dejadas por su evaluador.

### 2.2. Supervisor
* **Ámbito de Supervisión:** Consulta y monitoreo de los colaboradores asignados a su cargo.
* **Evaluación de Competencias:** Realización de evaluaciones diagnósticas iniciales y post-capacitación (calificación del 1 al 5 con observaciones por competencia).
* **Seguimiento de Planes:** Monitoreo del progreso de los planes de desarrollo de sus colaboradores en tiempo real.
* **Revisión de Entregables:**
  * Inspección de evidencias enviadas por los empleados.
  * Registro de retroalimentación cualitativa (`feedback`).
  * Determinación del resultado: **Aprobar actividad (`COMPLETADA`)** o **Solicitar correcciones (`EN_PROGRESO` con observaciones)**.
* **Revisión de Recomendaciones de IA:** Aprobación o ajuste de las propuestas formativas en Fase 4.

### 2.3. Recursos Humanos (RRHH / Gestor de Talento)
* **Gestión de Catálogos:** Administración de empleados, departamentos, puestos, catálogo de competencias (técnicas y blandas) y niveles de dominio (1 a 5).
* **Convocatorias y Oportunidades:** Creación, edición, publicación y cierre de oportunidades con definición de:
  * Número de vacantes disponibles.
  * Fechas de apertura y fecha límite máxima de postulación.
  * Requisitos de competencias con ponderación y obligatoriedad.
* **Gestión de Postulaciones:** Revisión de postulantes, ordenados por compatibilidad.
* **Recomendaciones de IA:** Generación y regeneración de planes de desarrollo individual asistidos por IA.
* **Aprobación de Planes:** Autorización formal de planes para que pasen a estado activo (`APROBADO`).
* **Supervisión Global:** Reportes de avance, estadísticas de talento y trazabilidad histórica.

### 2.4. Administrador del Sistema
* Configuración técnica, gestión de cuentas de usuario, asignación de roles, gestión de parámetros de entorno y mantenimiento de la plataforma.

---

## 3. Ciclo de Vida del Talento en la Plataforma

El flujo completo del empleado a través de la plataforma consta de 8 fases conectadas:

```
[1. Evaluación Inicial] ──> [2. Oportunidades y Vacantes] ──> [3. Postulación y Brechas]
                                                                        │
[6. Ejecución y Entregables] <── [5. Creación del Plan] <── [4. Recomendación IA (Fase 4)]
          │
          ▼
[7. Revisión del Supervisor] ──> [8. Evaluación Post-Capacitación] ──> [Brecha SUPERADA]
```

### Fase 1: Perfil y Evaluación Inicial de Competencias
* **Alta por RH con Selección Personalizada:** Al registrar a un nuevo empleado, Recursos Humanos o Admin puede elegir de forma específica y voluntaria qué competencias asignarle (sin preselección obligada de ninguna en particular) y con qué nivel inicial (1 al 5), usando el selector desplegable o los chips rápidos. El sistema registra tanto su perfil vigente en `EmployeeCompetency` como una evaluación diagnóstica de tipo `INICIAL` para auditoría y trazabilidad.
* **Evaluación posterior:** Si un empleado fue creado sin competencias, el supervisor (o Admin) puede evaluarlo en cualquier momento desde el módulo de Evaluaciones en competencias clave (escala 1 a 5).
* Se establece el perfil base del colaborador en la tabla `EmployeeCompetency`.

### Fase 2: Configuración de Oportunidades
* RRHH o Administrador publica una oportunidad (puesto o proyecto) especificando:
  * Título, descripción y tipo (`PUESTO`, `PROYECTO`, `DESARROLLO`).
  * **Objetivo Organizacional vinculado:** Alineación opcional con una meta estratégica activa (ej. metas de innovación, calidad o eficiencia).
  * Cantidad de vacantes disponibles.
  * Calendario: fecha de apertura y fecha límite para aplicar.
  * Competencias requeridas con nivel objetivo (1..5), peso relativo y si es obligatoria.

### Fase 3: Postulación y Análisis Automático de Compatibilidad
* El empleado se postula dentro de las fechas válidas y mientras existan vacantes.
* El sistema calcula automáticamente la **compatibilidad (0 a 100%)** comparando los niveles del empleado con los requeridos:
  $$\text{Compatibilidad} = \frac{\sum (\min(\text{nivelActual}, \text{nivelRequerido}) \times \text{peso})}{\sum (\text{nivelRequerido} \times \text{peso})} \times 100$$
* Si el nivel actual es inferior al requerido, se abre un registro de **Brecha (`Gap`)** con estado inicial `ABIERTA`.

### Fase 4: Recomendación de Desarrollo (Asistida por IA)
* Se invoca al motor de IA para diseñar un plan a medida enfocado en cerrar las brechas detectadas.
* La recomendación queda en estado `PROPUESTA` hasta que un supervisor o RRHH la valide y apruebe (`APROBADA`).

### Fase 5: Creación y Estructuración del Plan de Desarrollo
* A partir de la recomendación aprobada, se genera el `DevelopmentPlan` (estado `PROPUESTO` -> `APROBADO`).
* Las actividades se crean en `PlanActivity` heredando automáticamente el **entregable esperado** definido por la IA.
* Se vincula la fecha objetivo de finalización tomando como referencia la fecha límite de la oportunidad.

### Fase 6: Ejecución Activa y Envío de Evidencias
* El empleado visualiza su plan en **/planes**.
* Para cada actividad:
  1. La marca `EN_PROGRESO` al comenzar a trabajar en ella.
  2. Al concluir, hace clic en `Enviar entregable` e ingresa:
     * Resumen de la solución o trabajo ejecutado.
     * Enlace web directo a la evidencia (GitHub, Figma, Google Drive, demo desplegada).
  3. El estado de la actividad pasa a `ENTREGADA` y se registra la fecha de envío (`submittedAt`).

### Fase 7: Revisión, Calificación y Retroalimentación
* El supervisor accede a la actividad, examina la evidencia en el enlace externo y redacta su retroalimentación.
* Puede decidir:
  * **Aprobar entrega:** Estado `COMPLETADA`, registrando `reviewedAt` y comentarios de felicitación o mejora.
  * **Solicitar ajustes:** Retorna a `EN_PROGRESO` con retroalimentación detallada de lo que debe corregirse.
* Cuando todas las actividades se completan, el plan se marca automáticamente como `COMPLETADO`.

### Fase 8: Reevaluación Post-Capacitación y Cierre de Brechas
* Una vez completado el plan formativo, se realiza una evaluación formal de tipo `POST_CAPACITACION`.
* **Regla de Cierre Automático:** Si el nuevo nivel obtenido por el empleado es igual o superior al nivel requerido por la oportunidad (`nuevoNivel >= requiredLevel`), el sistema actualiza de inmediato el estado de la brecha (`Gap.status`) a **`SUPERADA`**.

### Regla Especial de Continuidad:
* Si una oportunidad vence o se cierra administrativamente (`CERRADA`), **los planes de desarrollo de los colaboradores que ya estaban en marcha continúan 100% activos y vigentes**, garantizando que el colaborador no pierda su progreso formativo.

---

## 4. Arquitectura del Motor de Inteligencia Artificial

### 4.1. Proveedor Principal y Endpoint
* **Motor:** Zhipu AI GLM Coding Plan / Coding Pro (`glm-4.5`, `glm-5.3`).
* **Endpoints Oficiales Soportados:**
  * Doméstico (BigModel): `https://open.bigmodel.cn/api/coding/paas/v4/chat/completions`
  * Internacional (Z.AI): `https://api.z.ai/api/coding/paas/v4/chat/completions`
* **Formato:** Compatible con el estándar de OpenAI (`messages`, `response_format: { type: "json_object" }`).
* **Modelos de Razonamiento y Timeout Optimizado:** Los modelos de GLM Coding Pro generan cadenas de razonamiento profundo (`reasoning_content`) antes de emitir la respuesta final estructurada. El timeout de red se calibró en **90 segundos** con `max_tokens: 4096` en [`src/lib/ai.ts`](file:///f:/TO_DO%20PROYECTO/pdp/src/lib/ai.ts) para garantizar que las peticiones complejas se completen al 100% sin abortar prematuramente.

### 4.2. Estructura de Desglose Obligatorio (Metodología 70-20-10)
Está estrictamente prohibido generar actividades genéricas (como *"Curso de Python"* o *"Taller de liderazgo"*). Cada actividad generada por la IA debe contener 5 dimensiones técnicas:
1. **`fase`**: Período cronológico estimado y distribución en el tiempo (ej. *Fase 1: Fundamentos y Arquitectura [Semanas 1-4]*).
2. **`titulo`**: Nombre técnico y profesional de la actividad.
3. **`descripcion`**: Metodología y pasos concretos que debe ejecutar el colaborador.
4. **`herramientas`**: Tecnologías, librerías, marcos de trabajo o estándares específicos (ej. *FastAPI, PostgreSQL 16, Alembic, Docker, pytest-cov, SonarLint*).
5. **`entregable`**: Producto tangible y verificable que el colaborador debe entregar (ej. *Repositorio privado en GitHub con API REST y cobertura >75%*).
6. **`criterio`**: Pauta objetiva con la que el supervisor o evaluador aprobará la actividad.

### 4.3. Sistema de Conmutación Inteligente (Multi-Provider Failover)
Para asegurar alta disponibilidad y resiliencia ante límites de cuota (como el error `HTTP 429: límite de 5 horas alcanzado en GLM`):
* **Ranura 1 (`AI_API_KEY`):** Proveedor principal (GLM Coding Plan con `glm-4.5` o `glm-5.3`).
* **Ranura 2 (`AI_API_KEY_2`):** Proveedor secundario / respaldo (segunda clave de GLM Coding Pro, OpenRouter, OpenAI o DeepSeek).
* **Mecanismo:** Si el Proveedor 1 falla por cuota, error de red o timeout, el sistema pasa **automáticamente y sin interrupción** a consultar al Proveedor 2.
* **Plantilla de Alta Precisión:** Si ambos proveedores fallan o no hay conectividad, entra en acción `templateRecommendation`, que genera el mismo desglose riguroso por competencias sin degradar la experiencia de usuario.
* **Transparencia:** La interfaz muestra insignias claras informando el origen exacto (`IA GLM` vs `Plantilla estructurada con motivo del fallo`).

---

## 5. Diseño de Interfaz y Experiencia de Usuario (UI/UX)

### 5.1. Pantalla de Inicio de Sesión (Login)
* **Alineación:** Dispuesta de manera asimétrica en el lateral izquierdo (`justify-start`), dejando visible el paisaje de fondo.
* **Estilo Glassmorphism:** Tarjeta flotante con cristal esmerilado translúcido (`backdrop-blur-2xl`, `bg-black/40`, borde `border-white/20` y sombras profundas).
* **Campos:** Entradas con forma de píldora (`rounded-full`), fondo translúcido y texto blanco de alto contraste (`.glass-input`).
* **Botón de Acción:** Formato píldora con gradiente en tono vino/borgoña (`#7a1c3d`) con resplandor.
* **Fondos Dinámicos (Slideshow):** Carrusel con transiciones suaves de desvanecimiento (cross-fade) cada 8 segundos con imágenes cinemáticas almacenadas en `public/backgrounds/` (`bg1.jpg`, `bg2.jpg`, `bg3.jpg`) y controles manuales interactivos.

### 5.2. Tarjetas de Desglose en Postulaciones (Fase 4)
* Visualización en tarjetas con bloques diferenciados por color:
  * Azul: Fase y Cronograma.
  * Blanco/Gris: Herramientas y Metodología.
  * Lila: Entregable y Evidencia Requerida.
  * Verde Esmeralda: Criterio de Aprobación del Evaluador.

### 5.3. Interfaz Interactiva de Planes (`PlanActivityCard`)
* Gestión visual del ciclo de vida de la actividad:
  * Estados con código de color: `PENDIENTE` (gris), `EN_PROGRESO` (azul), `ENTREGADA` (púrpura), `COMPLETADA` (verde).
  * Panel de evidencia con enlaces externos y fecha de envío.
  * Cuadro destacado con la retroalimentación del evaluador.

### 5.4. Notificaciones In-App (RF-025)
* Campana interactiva en el header con badge animado de conteo de no leídas (`9+`).
* Menú desplegable con código de colores por tipo de evento (`INFO`, `SUCCESS`, `WARNING`, `ACTION_REQUIRED`).
* Disparadores automáticos en: postulaciones, aprobación de planes, envío de entregables y calificaciones de supervisores.

### 5.5. Dashboards Especializados por Rol con Gráficas (RF-023, RF-024)
* **Admin/RH:** KPIs de cobertura de evaluaciones, tasa de cierre de brechas y adopción de planes, con gráficos Recharts de competencias demandadas, distribución de estados y brechas organizacionales.
* **Supervisor:** Bandeja de entregables urgentes por calificar con enlaces a evidencias, indicadores de equipo, progreso promedio y gráficos de avance por colaborador.
* **Empleado:** Seguimiento porcentual del plan activo, competencias vigentes en escala 1 a 5, entregas pendientes con botón directo y recomendaciones de convocatorias.

### 5.6. Módulo de Auditoría y Trazabilidad (RF-026, OE-17)
* Registro inmutable de operaciones críticas: altas/bajas de empleados, catálogo de competencias, evaluaciones diagnósticas y post-capacitación, creación y cierre de oportunidades, postulaciones, y aprobaciones/calificaciones de planes.
* Interfaz con filtrado por entidad, acción, búsqueda de texto libre y métricas en tiempo real. Exclusivo para roles `ADMIN` y `RH`.

### 5.7. Objetivos Organizacionales y Evaluación de Desempeño (RF-007, OE-04)
* Registro de metas estratégicas, de innovación, calidad y operativas vinculadas a departamentos o transversales a la organización.
* **Cálculo del "Cumplimiento Registrado":**
  * Se alimenta a través del módulo de **Evaluaciones** (`/evaluaciones` -> `+ Nueva evaluación`), en la pestaña **2. Objetivos de Desempeño (RF-007)**.
  * El evaluador (Supervisor o Admin; RH solo consulta) registra el **Valor Alcanzado** real frente a la **Meta Cuantitativa** (ej. meta 100%, alcanzado 92%).
  * El sistema calcula individualmente:
    $$\text{Tasa de Cumplimiento} = \left(\frac{\text{Valor Alcanzado}}{\text{Meta Objetivo}}\right) \times 100$$
  * En la vista de **/objetivos**, la barra de progreso de cada meta promedia automáticamente todas las evaluaciones realizadas por los supervisores:
    $$\text{Cumplimiento Registrado Promedio} = \frac{\sum \text{Cumplimiento individual}}{\text{Total de evaluaciones}}$$
  * Además, las convocatorias u oportunidades creadas pueden vincularse formalmente a un objetivo organizacional, permitiendo que los planes de desarrollo formativos hereden dicha alineación estratégica.
* **Selector de Período con Calendario de Rango (`PeriodDateRangePicker.tsx`):**
  * Al definir un nuevo objetivo organizacional, el campo *"Período de Evaluación"* despliega un calendario interactivo en la misma ventana (popover) para seleccionar la fecha de inicio y de fin mediante 2 clics o selectores directos, evitando la digitación manual.
  * Incluye atajos rápidos para trimestres (Q1 a Q4), semestres (S1 y S2) y períodos anuales completos, calculando la duración en días y formateando el rango de forma estructurada.

### 5.8. Carga e Importación Masiva por CSV / Plantilla (RF-027, OE-18)
* Descarga de plantillas modelo `.csv` oficiales para nómina y catálogo de competencias.
* Procesamiento automatizado con creación inteligente de áreas, puestos y usuarios con contraseñas seguras iniciales (`Demo1234!`), omisión de duplicados y registro en auditoría.

### 5.9. Mi Perfil y Gestión de Contraseñas (RF-028, RNF-001)
* Panel de consulta individual con rol, departamento, puesto, supervisor y competencias vigentes.
* Cambio autónomo de contraseña con validación de credencial actual y hashing bcryptjs (RNF-001).
* Restablecimiento administrativo de credenciales para colaboradores que hayan extraviado su acceso.

### 5.10. Navegación Lateral (Sidebar Izquierdo) y Tema Oscuro Vino, Negro y Grafito
* **Barra de Navegación Lateral (`AppSidebar.tsx`):**
  * Todos los botones principales de navegación (*Inicio, Empleados, Competencias, Evaluaciones, Objetivos, Convocatorias, Postulaciones, Planes, Importación, Auditoría, Mi Perfil*) se concentran en una barra lateral izquierda fija de 64/72 cols (`w-64 xl:w-72`) con scroll independiente.
  * Detección dinámica de ruta activa (`usePathname()`) con realce en rojo carmesí suave (`border-l-4 border-[#ad4251] bg-[#8c2534]/15 text-red-200`) e íconos distintivos por módulo.
  * Tarjeta inferior de identidad con avatar del usuario autenticado, insignia de rol (`ADMIN`, `RH`, `SUPERVISOR`, `COLABORADOR`) y acceso rápido a *Mi Perfil* y *Cerrar Sesión*.
  * Soporte adaptativo para dispositivos móviles mediante botón hamburguesa y panel desplegable superpuesto con backdrop blur.
* **Paleta Cromática de Alto Impacto (Vino Borgoña / Negro Profundo / Grafito):**
  * **Fondos Base:** Negro profundo (`#09090b` en canvas general y `#0c0c11` en sidebar).
  * **Superficies y Tarjetas:** Matices de gris carbón (`#121217` y `#181820`), bordes sutiles en gris grafito (`#272732`) y sombras suaves.
  * **Acentos Principales:** Rojo carmesí y borgoña refinado (`#8c2534`, `#ad4251`, `#751c2a`) para botones principales, badges de alerta, barras de progreso y bordes interactivos.
  * **Armonización Cromática:** Se eliminaron los tonos verdes disonantes; badges de completitud, barras de avance al 100% e hitos de reevaluación se calibraron a la gama vino oscuro y rosa cálido, respaldados por reglas globales en [`src/app/globals.css`](file:///f:/TO_DO%20PROYECTO/pdp/src/app/globals.css).
  * **Tipografía y Textos:** Blanco roto (`#f4f4f5`) para títulos y encabezados de alta legibilidad, gris plata (`#a1a1aa`) para descripciones y metadatos secundarios.
  * **Tablas e Inputs:** Fondos oscuros (`#121217`), encabezados en gris oscuro con bordes atenuados y estados focus con resplandor en rojo suave (`ring-[#ad4251]/20`).

### 5.11. Leyendas Descriptivas de Competencias por Hover (`CompetencyBadgeTooltip.tsx`)
* Al posicionar el cursor sobre cualquier insignia de competencia en el directorio de empleados o en el perfil personal, se despliega una tarjeta flotante (*popover/tooltip*) sin redirigir ni abrir otras páginas.
* Explica de forma concisa qué significa el nivel asignado (1 a 5) en esa habilidad específica:
  * **Habilidades Técnicas:** Desde conocimiento básico bajo supervisión (Nivel 1) hasta arquitecto corporativo y referente de innovación (Nivel 5), con ejemplos específicos para tecnologías como Python o bases de datos relacionales SQL.
  * **Habilidades Blandas:** Desde colaboración cotidiana asistida (Nivel 1) hasta liderazgo transformacional y modelado cultural estratégico (Nivel 5).
* Renderizado flotante desacoplado del scroll de la tabla mediante *React Portal* en `document.body`, garantizando máxima visibilidad e interactividad táctil en móviles.

### 5.12. Asignación Selectiva de Competencias en Alta de Empleados (`EmpleadoForm.tsx`)
* El formulario de registro de empleados permite seleccionar explícitamente qué competencias (técnicas o blandas) se asignan al colaborador sin forzar selecciones predeterminadas ni auto-asignar la primera del catálogo.
* **Mecanismos de Selección Intuitiva:**
  * **Selector Directo con Nivel:** Menú desplegable para elegir la competencia deseada con su nivel objetivo (1 a 5) y botón `+ Agregar seleccionada`.
  * **Chips Rápidos Disponibles:** Botones de un solo clic con las competencias no asignadas aún, identificando su tipo (*Técnica* en cian / *Blanda* en púrpura).
  * **Control de Duplicados:** Opciones ya agregadas quedan deshabilitadas para garantizar consistencia en la matriz de competencias.
  * **Filas Editables:** Lista dinámica con selector individual de nivel, tipo de competencia y botón de remoción instantánea.

### 5.13. Buscador y Filtros Avanzados de Empleados (`EmpleadosDirectory.tsx`)
* **Búsqueda Dinámica Multicriterio:** Caja de búsqueda en vivo con filtrado insensible a mayúsculas y acentos que examina simultáneamente nombre, apellidos y correo electrónico.
* **Filtros por Facetas:** Desplegables de selección para filtrar por **Departamento**, **Puesto Laboral** y **Competencias Específicas**.
* **Contador y Resumen:** Barra de estado que reporta en tiempo real cuántos colaboradores coinciden con los filtros aplicados y botón rápido de restablecimiento.

### 5.14. Resumen Ejecutivo y Acordeón Desplegable en Planes (`PlanesList.tsx`)
* **Vista Compacta por Defecto:** Para evitar el scroll excesivo y vistas abrumadoras, cada plan de desarrollo se presenta colapsado con su información ejecutiva esencial: título, colaborador, departamento, oportunidad vinculada, fecha meta, badge de estado, objetivo resumido, barra de avance porcentual y desglose numérico de actividades.
* **Acordeón Desplegable:** Pestaña `[ Ver fases, entregables y retroalimentación ]` que permite al usuario inspeccionar únicamente el plan deseado, desplegando las tarjetas de actividades individuales (`PlanActivityCard`), enlaces de evidencia, retroalimentación del supervisor y el banner de hito de reevaluación.
* **Herramientas Globales:** Buscador integrado por colaborador, plan u oportunidad, filtro por estado (`EN_PROGRESO`, `APROBADO`, `COMPLETADO`, `PROPUESTO`) y controles rápidos de *"Expandir todo"* y *"Colapsar todo"*.

---

## 6. Stack Tecnológico y Paradigmas de Programación

### 6.1. Tabla de Tecnologías

| Capa | Tecnología | Función |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (App Router + Turbopack) | Renderizado híbrido (RSC + Client Components) y Server Actions |
| **Lenguaje** | TypeScript 5 | Tipado estático y contratos de datos seguros |
| **Base de Datos** | SQLite (`dev.db`) | Motor relacional local ligero y portátil |
| **ORM** | Prisma ORM 6 | Modelado de esquemas, migraciones y tipado automático de consultas |
| **Autenticación** | NextAuth.js v5 (Auth.js) | Manejo de sesiones seguras por JWT con encriptación bcryptjs |
| **Cifrado** | bcryptjs | Hashing criptográfico irreversible de contraseñas (costo 10) |
| **Estilos** | Tailwind CSS v4 + Vanilla CSS | Sistema de diseño en tema oscuro (Vino/Negro/Grafito) y glassmorphism |
| **Visualización** | Recharts 2 | Gráficas interactivas de barras, pastel y progreso organizacional |
| **IA** | Zhipu AI GLM Coding Plan (GLM-4.5 / GLM-5.3) | Inferencia y razonamiento para planes formativos 70-20-10 |

### 6.2. Paradigma Arquitectónico: Enfoque Híbrido (POO + Funcional Declarativo)
El sistema está construido combinando los dos grandes paradigmas de la ingeniería de software moderna:
1. **Programación Basada en Objetos (POO):**
   * **Mapeo Objeto-Relacional (ORM):** Instanciación de `PrismaClient` donde las tablas de la base de datos se manipulan como colecciones de objetos en memoria con atributos y métodos (`db.employee.findMany()`, `db.developmentPlan.create()`).
   * **Modelado del Dominio:** Entidades estructuradas mediante interfaces y tipos en TypeScript (`Employee`, `Competency`, `DevelopmentPlan`, `Application`), encapsulando su estado y relaciones.
   * **Instancias y Clases Estándar:** Uso activo de clases nativas mediante constructores `new` (`Date`, `Set`, `Map`, `FormData`, `NextResponse`, `Error`, `AbortController`).
   * **Abstracción y Encapsulamiento:** Servicios desacoplados en `src/lib/` que ocultan la complejidad de APIs externas, auditoría y base de datos tras interfaces limpias.
2. **Programación Funcional y React Declarativo:**
   * Componentes funcionales puros y hooks de estado inmutable (`useState`, `useMemo`, `useCallback`).
   * Server Actions como funciones asíncronas puras sin efectos secundarios en memoria.
   * Procesamiento de datos mediante funciones de orden superior (`.map()`, `.filter()`, `.reduce()`).
   * Principio de *"Composición sobre herencia"* para componer interfaces modulares.

---

## 7. Modelo Relacional de Datos (Prisma Schema)

El sistema opera sobre un esquema SQLite relacional fuertemente tipado mediante Prisma ORM:

| Entidad | Descripción y Relaciones |
| :--- | :--- |
| **`User`** | Cuentas de acceso con credenciales hasheadas (`passwordHash`), roles (`ADMIN`, `RH`, `SUPERVISOR`, `EMPLEADO`) y auditoría. |
| **`Employee`** | Registro de nómina laboral vinculado opcionalmente a un `User`, un `Department`, un `Position` y un `supervisorId` (auto-relación recursiva). |
| **`Department`** | Áreas funcionales de la empresa (Ingeniería, Finanzas, Operaciones, etc.) y contenedor de objetivos departamentales. |
| **`Position`** | Puestos o cargos formales dentro de la organización. |
| **`Competency`** | Catálogo de competencias con tipo (`TECNICA` / `BLANDA`), estado (`ACTIVA` / `INACTIVA`) y descripción. |
| **`EmployeeCompetency`** | Perfil competencial vigente del empleado con nivel asignado (escala 1 a 5) y fecha de actualización (RF-036). |
| **`Evaluation`** | Procesos de evaluación formal (`INICIAL` o `POST_CAPACITACION`) con estado (`BORRADOR` o `FINALIZADA`). |
| **`EvaluationScore`** | Puntuación por competencia (1 a 5) y observaciones en una evaluación específica. |
| **`OrganizationalObjective`** | Metas estratégicas, operativas, calidad o innovación ligadas a la organización o departamentos (RF-007, OE-04). |
| **`ObjectiveEvaluation`** | Calificación del grado de cumplimiento porcentual (0 a 100%) y comentarios por objetivo en una evaluación (RF-007). |
| **`Opportunity`** | Convocatorias internas publicadas con tipo, vacantes, fechas límite de vigencia y estado (`PUBLICADA`, `CERRADA`). |
| **`OpportunityRequirement`** | Requisitos de competencias requeridas por oportunidad con nivel objetivo (1..5), peso ponderado y obligatoriedad. |
| **`Application`** | Postulación de un colaborador a una oportunidad con compatibilidad porcentual calculada y fecha de aplicación. |
| **`Gap`** | Brecha detectada cuando el nivel del empleado es inferior al requerido por la oportunidad (`ABIERTA` -> `SUPERADA`). |
| **`Recommendation`** | Propuesta formativa generada por IA (70-20-10) o plantilla estructurada con estado (`PROPUESTA` -> `APROBADA`). |
| **`DevelopmentPlan`** | Plan de desarrollo formal individual asignado a un colaborador (`PROPUESTO`, `APROBADO`, `EN_PROGRESO`, `COMPLETADO`). |
| **`PlanActivity`** | Actividades formativas con entregables esperados, enlaces web a evidencias, retroalimentación del supervisor y estados. |
| **`Notification`** | Alertas y notificaciones in-app del sistema con tipo, estado de lectura y fecha. |
| **`AuditLog`** | Bitácora inmutable de eventos críticos para trazabilidad y cumplimiento normativo (RF-026, OE-17). |

---

## 8. Seguridad, Cifrado y Políticas de Acceso

* **Autenticación Segura (RNF-001):**
  * Hashing criptográfico irreversible de contraseñas mediante **`bcryptjs`** con factor de costo 10.
  * Tokens de sesión firmados y cifrados mediante JWT con Auth.js v5.
  * Módulo de cambio autónomo de contraseña con validación obligatoria de credencial actual.
  * Capacidad de restablecimiento administrativo de credenciales para roles `ADMIN` y `RH`.
* **Control de Acceso Basado en Roles (RBAC):**
  * Middleware y Server Actions protegidos mediante `requireSession()` y verificación de roles autorizados.
  * Separación estricta entre acciones ejecutivas (`ADMIN` / `RH`), operativas de equipo (`SUPERVISOR`) y personales (`EMPLEADO`).
* **Auditoría Inmutable (RF-026, OE-17):**
  * Toda mutación crítica (altas, modificaciones, evaluaciones, aprobaciones de planes, importaciones masivas) queda registrada en `AuditLog` con sello de tiempo, ID de usuario ejecutor, IP/detalles y entidad afectada.
* **Sanitización de Datos e Importaciones Masivas (RF-027):**
  * Análisis de archivos CSV con validación de cabeceras oficiales, omisión segura de duplicados y asignación de contraseñas provisionales cifradas.

---

## 9. Estado de Culminación del Proyecto y Cierre de Sesión

| Bloque / Dimensión | Alcance PRD | Estado | Verificación |
| :--- | :--- | :---: | :--- |
| **Bloque 1** | Convocatorias con fechas límite, requisitos ponderados y postulaciones (RF-010, RF-011, RF-012) | **100% Completo** | `tests/opportunity-dates-test.mjs` (Aprobado) |
| **Bloque 2** | Fase 4 de Postulaciones: Entregables con URLs de evidencia, revisión y feedback (RF-020, RF-021) | **100% Completo** | `tests/fase4-activities-test.mjs` (Aprobado) |
| **Bloque 3** | Dashboards por rol con Recharts y Notificaciones in-app en tiempo real (RF-023, RF-024, RF-025) | **100% Completo** | `tests/dashboards-and-notifications-test.mjs` (Aprobado) |
| **Bloque 4** | Objetivos Organizacionales y Evaluación Integral de Desempeño (RF-007, OE-04) | **100% Completo** | `tests/objetivos-desempeno-test.mjs` (Aprobado) |
| **Bloque 5** | Carga e Importación Masiva por CSV con plantillas modelo oficiales (RF-027, OE-18) | **100% Completo** | `tests/importacion-csv-test.mjs` (Aprobado) |
| **Bloque 6** | Mi Perfil, consulta laboral y gestión de contraseñas con bcrypt (RF-028, RNF-001) | **100% Completo** | `tests/perfil-password-test.mjs` (Aprobado) |
| **UI/UX & Estética** | Navegación lateral izquierda (`AppSidebar`), Tema Oscuro Negro/Rojo/Gris, login depurado y tooltips por hover | **100% Completo** | `tests/theme-and-sidebar-test.mjs` y `tests/competency-tooltip-test.mjs` (Aprobados) |
| **Compilación** | Tipado estático TypeScript 5 sin errores (`npx tsc --noEmit`) | **0 Errores** | Exited with code 0 |
| **Documentación** | `README.md`, `SETUP.md`, `contexto.md` e `historial.md` | **Completamente Sincronizados** | Verificado en raíz y en `pdp/` |

> **Cierre de Sesión:** El sistema se encuentra en estado estable, probado de extremo a extremo, documentado y listo para despliegue o demostración ejecutiva.

