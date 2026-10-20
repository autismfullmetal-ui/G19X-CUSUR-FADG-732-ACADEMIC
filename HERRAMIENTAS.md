# Herramientas Utilizadas en el Desarrollo
## Plataforma de Desarrollo Profesional (PDP) — TODO Academy

Este documento lista las herramientas, tecnologías y asistentes de Inteligencia Artificial que se usaron para diseñar, construir, probar y documentar el proyecto.

---

## 1. Inteligencia Artificial

### 1.1 IA como asistente de desarrollo

| Herramienta | Proveedor | Uso en el proyecto |
| :--- | :--- | :--- |
| **Antigravity IDE** | Google | Entorno de desarrollo con agente de IA integrado: generación y refactorización de código, depuración, ejecución de comandos y redacción de documentación técnica. |
| **ChatGPT** | OpenAI | Consultas de diseño, resolución de dudas técnicas, apoyo en la redacción del PRD y revisión de lógica de negocio. |
| **GLM 5.3 Flash** | Zhipu AI (Z.AI) | Asistente de programación rápido para generación de fragmentos de código, explicaciones y pruebas de prompts. |

### 1.2 IA integrada en la aplicación (en tiempo de ejecución)

| Herramienta | Proveedor | Uso en el proyecto |
| :--- | :--- | :--- |
| **GLM Coding Plan / Coding Pro** (`glm-4.5` / `glm-5.3`) | Zhipu AI | Motor que genera las recomendaciones formativas bajo el modelo **70-20-10** (RF-014, RF-015). Implementado en [`src/lib/ai.ts`](src/lib/ai.ts) con doble ranura de *failover* y plantilla local de respaldo. |
| **Endpoint internacional** | Z.AI | `https://api.z.ai/api/coding/paas/v4` |
| **Endpoint doméstico** | BigModel | `https://open.bigmodel.cn/api/coding/paas/v4` |

> **Nota:** El código generado o sugerido por IA fue revisado, adaptado y validado manualmente mediante las pruebas en la carpeta `tests/`.

---

## 2. Stack Tecnológico

| Capa | Tecnología | Versión | Función |
| :--- | :--- | :--- | :--- |
| Framework | **Next.js** (App Router + Turbopack) | 16.3.5 | Renderizado híbrido (RSC + Client Components) y Server Actions |
| Librería UI | **React / React DOM** | 19.2.8 | Componentes funcionales y hooks |
| Lenguaje | **TypeScript** | 5 | Tipado estático de extremo a extremo |
| Base de datos | **SQLite** | — | Motor relacional local (`dev.db`) |
| ORM | **Prisma** (`prisma` + `@prisma/client`) | 6.19.3 | Esquema, migraciones y cliente tipado |
| Autenticación | **NextAuth.js / Auth.js** | 5.0.0-beta.32 | Sesiones por JWT con proveedor de credenciales |
| Seguridad | **bcryptjs** | 3.0.3 | Hash de contraseñas |
| Estilos | **Tailwind CSS** + `@tailwindcss/postcss` + CSS nativo | 4 | Tema oscuro Vino / Negro / Grafito y glassmorphism |
| Gráficas | **Recharts** | 3.10.1 | Dashboards interactivos por rol |

---

## 3. Herramientas de Desarrollo

| Herramienta | Uso |
| :--- | :--- |
| **Node.js + npm** | Entorno de ejecución y gestor de paquetes |
| **tsx** | Ejecución de scripts TypeScript (semilla `prisma/seed.ts`, verificación de IA) |
| **dotenv** | Carga de variables de entorno (`.env`) |
| **ESLint** + `eslint-config-next` | Análisis estático y estilo de código |
| **PostCSS** | Procesamiento de estilos para Tailwind CSS |
| **Git** | Control de versiones |
| **PowerShell (Windows)** | Terminal para ejecución de comandos |
| **Navegador web** | Pruebas visuales y funcionales de la interfaz |

---

## 4. Pruebas

| Herramienta | Uso |
| :--- | :--- |
| **Scripts Node.js (`.mjs`) con `fetch` nativo** | Pruebas E2E contra el servidor local (`http://localhost:3000`): login, planes, evaluaciones, importación CSV, auditoría, etc. |
| **`tests/verify-glm-recommendation.ts`** | Verificación de la conexión y respuesta del motor GLM |

---

## 5. Documentación y Planeación

| Herramienta | Uso |
| :--- | :--- |
| **Markdown** | `README.md`, `SETUP.md`, `contexto.md`, `historial.md`, `PRD.md` |
| **LibreOffice Writer / Word (.docx)** | Redacción del PRD (*Plataforma de Desarrollo Profesional - Integrado*) |
| **PDF** | Versión de distribución del PRD |
