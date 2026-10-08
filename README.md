# G19X-CUSUR-FADG-732-ACADEMIC: Proyecto Académico TODO Academy
## Plataforma de Desarrollo Profesional (PDP)

Sistema integral de gestión de talento, diagnóstico de competencias, convocatorias internas, evaluación de desempeño y generación asistida por IA de planes de desarrollo profesional (70-20-10).

---

## Características y Módulos Principales

| Módulo / Funcionalidad | Descripción | Referencia PRD |
| :--- | :--- | :--- |
| **Navegación Lateral y Tema Oscuro** | Barra lateral izquierda persistente (`AppSidebar`) con detección activa de ruta, drawer móvil y estética premium en **Negro Profundo, Vino Borgoña y Grafito** con armonización cromática. | UI/UX |
| **Directorio de Empleados** | Búsqueda dinámica en vivo, filtros combinados por departamento, puesto y competencias (`EmpleadosDirectory`), asignación de competencias iniciales al crear y reseteo administrativo de contraseñas. | RF-001, RF-028 |
| **Catálogo de Competencias** | Matriz de competencias técnicas y blandas con descripción interactiva por nivel (hover tooltip) y control de vigencia. | RF-005 |
| **Evaluaciones y Desempeño** | Evaluación diagnóstica y post-capacitación con pestañas integradas para calificar **Competencias (RF-006)** y **Cumplimiento de Objetivos Organizacionales (RF-007)**. | RF-006, RF-007, OE-04 |
| **Objetivos Organizacionales** | Registro y monitoreo de metas estratégicas, operativas, de innovación o calidad vinculadas a convocatorias y planes de capacitación. | RF-007, OE-04 |
| **Convocatorias y Oportunidades** | Publicación de vacantes y proyectos con requisitos ponderados, competencias obligatorias/deseables y validación estricta de fecha límite de postulación. | RF-010, RF-011 |
| **Postulaciones y Fase 4** | Cálculo algorítmico de compatibilidad ponderada %, detección automática de brechas formativas y desglose de Fase 4 con entrega de evidencias, enlaces y calificación. | RF-012, RF-020, RF-021 |
| **Recomendaciones con IA (70-20-10)** | Generación inteligente de actividades formativas basadas en el modelo 70-20-10 mediante **GLM Coding Plan / Coding Pro** (`glm-4.5` / `glm-5.3`) con doble ranura de failover y plantilla local. | RF-014, RF-015 |
| **Planes de Capacitación** | Vista ejecutiva compacta (`PlanesList`) con barra de avance, conteo de estados y acordeón interactivo desplegable para inspeccionar fases, evidencias y retroalimentación (`PlanActivityCard`). | RF-017, RF-018 |
| **Dashboards por Rol con Recharts** | Tableros ejecutivos con gráficas interactivas Recharts: Cobertura global para Admin/RH, cola de entregables para Supervisores y plan activo para Colaboradores. | RF-023, RF-024 |
| **Notificaciones In-App** | Campana interactiva en cabecera con contador de pendientes y alertas automáticas ante postulaciones, revisiones y calificaciones. | RF-025 |
| **Auditoría y Trazabilidad** | Registro inmutable de eventos críticos (creación, edición, evaluación, aprobación) con panel de filtrado y búsqueda exclusivo para Admin y RH. | RF-026, OE-17 |
| **Importación Masiva por CSV** | Descarga de plantillas modelo `.csv` y procesamiento en lote de empleados, puestos, áreas y competencias con creación de credenciales iniciales. | RF-027, OE-18 |
| **Mi Perfil y Seguridad** | Consulta individual de perfil laboral, competencias vigentes, cambio autónomo de contraseña con encriptación bcryptjs y reseteo por administradores. | RF-028, RNF-001 |

---

## Flujo de Trabajo Integral

```
   [1. Convocatoria Publicada] (Con fecha límite y requisitos ponderados)
              ↓
   [2. Postulación del Empleado] → Cálculo automático de Compatibilidad % y Brechas
              ↓
   [3. Recomendación Formativa] → Generación con IA (70-20-10) o Plantilla Local
              ↓
   [4. Aprobación y Creación del Plan] → RH o Supervisor aprueba recomendación y formaliza el plan
              ↓
   [5. Ejecución y Evidencias (Fase 4)] → Empleado envía enlaces a entregables
              ↓
   [6. Revisión y Calificación] → Supervisor califica evidencia con feedback in-app
              ↓
   [7. Evaluación Integral de Desempeño] → Cierre de brechas y cumplimiento de objetivos (RF-007)
```

---

## Matriz de Roles y Permisos

| Módulo / Acción | ADMIN | RH | SUPERVISOR | EMPLEADO |
| :--- | :---: | :---: | :---: | :---: |
| **Ver Dashboard Especializado** | Sí (Global) | Sí (Global) | Sí (Equipo) | Sí (Personal) |
| **Gestión de Empleados y Nómina** | Sí | Sí | No | No |
| **Catálogo de Competencias** | Sí | Sí | No | No |
| **Definir Objetivos Organizacionales** | Sí | Sí | No | No |
| **Realizar Evaluaciones de Desempeño (inicial y post-capacitación)** | Sí | No (solo consulta) | Sí | No |
| **Crear y Publicar Oportunidades** | Sí | Sí | No | No |
| **Postularse a Convocatorias** | No | No | No | Sí |
| **Generar y Aprobar Recomendaciones** | Sí | Sí | Sí | No |
| **Aprobar Planes y Calificar Entregables**| Sí | Sí | Sí | No |
| **Enviar Evidencias y Completar Plan** | No | No | No | Sí |
| **Carga Masiva por CSV** | Sí | Sí | No | No |
| **Panel de Auditoría Inmutable** | Sí | Sí | No | No |
| **Mi Perfil y Cambio de Contraseña** | Sí | Sí | Sí | Sí |

---

## Stack Tecnológico

| Capa | Tecnología | Función |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (App Router + Turbopack) | Arquitectura híbrida (RSC + Client Components) y Server Actions |
| **Lenguaje** | TypeScript 5 | Tipado estático de extremo a extremo y contratos seguros |
| **Base de Datos** | SQLite (`dev.db`) | Motor relacional local optimizado y de alta portabilidad |
| **ORM** | Prisma ORM 6 | Modelado de esquema relacional, migraciones y cliente tipado |
| **Autenticación** | NextAuth.js v5 (Auth.js) | Manejo de sesiones seguras por JWT con encriptación bcryptjs |
| **Estilos y UI** | Tailwind CSS v4 + Vanilla CSS | Sistema de diseño en tema oscuro (Vino/Negro/Grafito) y glassmorphism |
| **Visualización** | Recharts 2 | Gráficas interactivas de barras, progreso y analíticas de talento |
| **Inteligencia Artificial** | Zhipu AI GLM Coding Plan (GLM-4.5 / GLM-5.3) | Inferencia y razonamiento para planes formativos 70-20-10 con failover |

---

## Paradigma Arquitectónico: Enfoque Híbrido

El sistema implementa una arquitectura híbrida moderna que combina lo mejor de ambos mundos:
* **Programación Basada en Objetos (POO):**
  * Mapeo Objeto-Relacional (**ORM**) con Prisma: la base de datos se manipula como colecciones de instancias en memoria con métodos nativos (`db.employee.findMany()`, `db.developmentPlan.create()`).
  * Modelado del dominio con interfaces y tipos fuertemente acoplados a la lógica del negocio (`Employee`, `Competency`, `DevelopmentPlan`, `Application`).
  * Instanciación y uso intensivo de clases estándar (`PrismaClient`, `Date`, `Set`, `Map`, `FormData`, `NextResponse`, `Error`, `AbortController`).
  * Abstracción y encapsulamiento en librerías desacopladas en `src/lib/`.
* **Programación Funcional y React Declarativo:**
  * Componentes funcionales puros con hooks de estado inmutable (`useState`, `useMemo`, `useCallback`).
  * Mutaciones atómicas del servidor mediante *Server Actions* puras y procesamiento de listas mediante funciones de orden superior (`.map()`, `.filter()`, `.reduce()`).
  * Principio de *"Composición sobre herencia"* para construir interfaces ricas y modulares.

---

## Estructura del Proyecto

```
pdp/
├── prisma/
│   ├── schema.prisma              # Modelo relacional de datos completo
│   ├── init.sql                   # DDL de inicialización de tablas SQLite
│   ├── apply-init.mjs             # Script de inicialización de BD
│   └── seed.ts                    # Semilla de datos demostrativos
├── public/
│   └── backgrounds/               # Fondos cinemáticos para el login
├── src/
│   ├── app/
│   │   ├── (app)/                 # Rutas protegidas dentro del layout común
│   │   │   ├── layout.tsx         # Layout maestro con AppSidebar y tema oscuro
│   │   │   ├── dashboard/         # Tableros especializados con Recharts por rol
│   │   │   ├── empleados/         # Directorio de nómina con buscador y filtros
│   │   │   ├── competencias/      # Catálogo de competencias con tooltips y CSV
│   │   │   ├── evaluaciones/      # Registro de evaluaciones (Competencias + Metas)
│   │   │   ├── objetivos/         # Gestión de objetivos organizacionales (RF-007)
│   │   │   ├── oportunidades/     # Convocatorias con requisitos y fecha límite
│   │   │   ├── postulaciones/     # Matriz de postulaciones y vista de Fase 4
│   │   │   ├── planes/            # Vista ejecutiva con acordeón y entregas
│   │   │   ├── importacion/       # Módulo de carga masiva CSV con plantillas
│   │   │   ├── auditoria/         # Bitácora inmutable de auditoría (RF-026)
│   │   │   └── perfil/            # Perfil de usuario y cambio de contraseña
│   │   ├── api/
│   │   │   └── templates/         # Endpoints para descarga de plantillas CSV
│   │   ├── login/                 # Pantalla de login glassmorphism con carrusel
│   │   ├── actions.ts             # Server Actions (Lógica de negocio y mutaciones)
│   │   └── globals.css            # Tokens de estilo, tema Vino/Negro/Grafito
│   ├── components/                # Formularios y componentes modulares
│   │   ├── AppSidebar.tsx         # Barra de navegación lateral fija a la izquierda
│   │   ├── EmpleadosDirectory.tsx # Directorio con buscador y filtros dinámicos
│   │   ├── PlanesList.tsx         # Resumen ejecutivo con acordeón de planes
│   │   ├── PlanActivityCard.tsx   # Tarjeta interactiva de entregables con feedback
│   │   ├── CompetencyBadgeTooltip.tsx # Tooltip explicativo de niveles de competencia
│   │   ├── HeaderNotifications.tsx# Campana interactiva de notificaciones in-app
│   │   ├── ObjetivoForm.tsx       # Formulario modal de objetivos estratégicos
│   │   ├── EvaluacionForm.tsx     # Formulario de evaluación en 2 pestañas
│   │   └── dashboard/             # Componentes de métricas Recharts por rol
│   ├── lib/
│   │   ├── ai.ts                  # Motor de IA con prompt 70-20-10 y failover
│   │   ├── audit.ts               # Servicio de registro de auditoría inmutable
│   │   ├── notifications.ts       # Gestor y disparador de notificaciones in-app
│   │   ├── compatibility.ts       # Motor de cálculo de compatibilidad y brechas
│   │   ├── auth.ts                # Configuración de credenciales Auth.js
│   │   └── db.ts                  # Instancia singleton de PrismaClient
├── tests/                         # Suite de pruebas automatizadas E2E
├── .env                           # Variables de entorno locales
├── .env.example                   # Plantilla de variables de entorno
├── contexto.md                    # Documento maestro conceptual y de arquitectura
├── historial.md                   # Bitácora detallada de cambios e hitos
├── README.md                      # Resumen ejecutivo de la plataforma
└── SETUP.md                       # Guía paso a paso de instalación y puesta en marcha
```

---

## Credenciales de Demostración

Todas las cuentas vienen preconfiguradas con la contraseña universal: **`Demo1234!`**

| Correo Electrónico | Rol | Función en el Sistema |
| :--- | :---: | :--- |
| `admin@demo.mx` | **ADMIN** | Control total del sistema, auditoría y configuración |
| `rh@demo.mx` | **RH** | Gestión de talento, vacantes, consulta de evaluaciones e importación CSV |
| `supervisor@demo.mx` | **SUPERVISOR** | Monitoreo de equipo, revisión de entregables y evaluaciones |
| `empleado@demo.mx` | **EMPLEADO** | Postulación a vacantes, envío de evidencias y seguimiento de plan |

---

## Puesta en Marcha

Para consultar las instrucciones detalladas de instalación, comandos de migración de base de datos y configuración del motor de IA, consulta la **[Guía de Instalación (SETUP.md)](SETUP.md)**.

