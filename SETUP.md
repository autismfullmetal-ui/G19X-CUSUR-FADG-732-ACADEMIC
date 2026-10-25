# Guía de Instalación y Puesta en Marcha

Esta guía proporciona el paso a paso detallado para inicializar, configurar y ejecutar la **Plataforma de Desarrollo Profesional (PDP)** en un entorno de desarrollo local.

---

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado en tu sistema:

* **Node.js 20 o superior** (Recomendado Node.js 22 LTS) → [nodejs.org](https://nodejs.org)
* **npm 10 o superior** (Incluido con Node.js)
* **Git** (para clonar el repositorio) → [git-scm.com](https://git-scm.com)

Para verificar las versiones instaladas, ejecuta en tu terminal:

```bash
node -v
npm -v
```

---

## Paso a Paso de Instalación

### 1. Clonar el Repositorio

Abre una terminal, clona el repositorio y entra a la carpeta creada:

```bash
git clone https://github.com/autismfullmetal-ui/G19X-CUSUR-FADG-732-ACADEMIC.git
cd G19X-CUSUR-FADG-732-ACADEMIC
```

*(Si ya tienes el proyecto descargado, solo abre una terminal en la carpeta raíz del repositorio).*

---

### 2. Instalar Dependencias

Ejecuta el gestor de paquetes para descargar todas las dependencias del proyecto (Next.js 16, React 19, Prisma ORM 6, Tailwind CSS v4, Recharts, bcryptjs, etc.):

```bash
npm install
```

---

### 3. Configurar Variables de Entorno (`.env`)

Copia la plantilla `.env.example` para crear tu archivo `.env` local:

```bash
cp .env.example .env
```

La plantilla contiene estas variables; coloca tus claves en `AI_API_KEY` (y opcionalmente `AI_API_KEY_2`):

```env
# Conexión de base de datos local SQLite
DATABASE_URL="file:./dev.db"

# Clave secreta para cifrado de sesiones y JWT (Auth.js)
AUTH_SECRET="cambia-esta-clave"

# Proveedor 1 (Principal): GLM Coding Plan
# Endpoint alterno internacional: https://api.z.ai/api/coding/paas/v4
AI_BASE_URL="https://open.bigmodel.cn/api/coding/paas/v4"
AI_API_KEY=""
AI_MODEL="glm-4.5"

# Proveedor 2 (Respaldo automático si el 1 falla o se queda sin cuota)
# Compatible con: OpenRouter, OpenAI, DeepSeek, Groq u otra key de GLM.
AI_BASE_URL_2="https://api.z.ai/api/coding/paas/v4"
AI_API_KEY_2=""
AI_MODEL_2="GLM-5.3"
```

> **Nota sobre IA:** Si no configuras claves de API en `.env`, el sistema activa automáticamente el **motor de plantillas formativas locales**, permitiendo probar la generación y aprobación de planes sin costo alguno ni interrupciones.

---

### 4. Inicializar la Base de Datos

La aplicación utiliza SQLite (`prisma/dev.db`), por lo que no necesitas instalar ningún servidor de base de datos externo.

1. **Crear las tablas en la base de datos:**
   ```bash
   npx prisma db push
   ```
   *(Alternativa sin Prisma CLI: `node prisma/apply-init.mjs`, que ejecuta `prisma/init.sql`. Si modificas `schema.prisma`, regenera ese archivo con `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script`.)*

2. **Generar el cliente tipado de Prisma:**
   ```bash
   npx prisma generate
   ```

3. **Cargar los datos iniciales y usuarios de demostración (Seed):**
   ```bash
   npx tsx prisma/seed.ts
   ```

El script de semilla creará automáticamente:
* 4 usuarios listos para iniciar sesión (ADMIN, RH, SUPERVISOR, EMPLEADO).
* Nómina inicial de empleados con puestos y departamentos.
* Catálogo de competencias técnicas y blandas con descripciones de nivel 1 a 5.
* Metas y objetivos organizacionales vigentes (RF-007).
* Evaluaciones de desempeño de demostración.
* Convocatorias publicadas con requisitos ponderados y fechas límite (RF-011).

---

### 5. Iniciar el Servidor de Desarrollo

Inicia la aplicación en modo desarrollo con soporte para Turbopack:

```bash
npm run dev
```

La consola indicará que el servidor está listo:
```
  ▲ Next.js 16.0.0
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000
```

Abre tu navegador en: **[http://localhost:3000](http://localhost:3000)**

---

## Credenciales para Pruebas

Todas las cuentas de prueba comparten la misma contraseña de acceso: **`Demo1234!`**

| Correo Electrónico | Contraseña | Rol Asignado | Vista Predeterminada |
| :--- | :---: | :---: | :--- |
| `admin@demo.mx` | `Demo1234!` | **ADMIN** | Dashboard Ejecutivo + Auditoría + Configuración |
| `rh@demo.mx` | `Demo1234!` | **RH** | Gestión de Talento, Evaluaciones, Aprobación de Planes e Importación CSV |
| `supervisor@demo.mx` | `Demo1234!` | **SUPERVISOR** | Monitoreo de Equipo y Calificación de Entregables |
| `empleado@demo.mx` | `Demo1234!` | **EMPLEADO** | Convocatorias, Postulaciones y Plan Personal |

---

## Recorridos de Prueba Recomendados

### Flujo 1: Nueva Barra Lateral Izquierda y Tema Oscuro
1. Inicia sesión con cualquier usuario.
2. Observa la barra de navegación vertical fija a la izquierda (`AppSidebar`) con su paleta de **Negro Profundo, Rojo Carmesí y Matices de Gris Grafito**.
3. Navega entre las distintas secciones y comprueba cómo el botón del módulo activo se ilumina con un indicador lateral rojo y gradiente carmesí.

### Flujo 2: Postulación y Entrega de Evidencias (Fase 4)
1. Inicia sesión como `empleado@demo.mx`.
2. Dirígete a **Oportunidades** y postúlate a una vacante disponible.
3. Entra a **Postulaciones** para visualizar el porcentaje de compatibilidad y las brechas detectadas.
4. Cierra sesión y entra como `rh@demo.mx` o `supervisor@demo.mx`.
5. Ve a **Postulaciones**, abre la postulación y haz clic en **Generar Recomendación (IA)**.
6. Aprueba la recomendación y crea el plan formal de desarrollo.
7. Vuelve a entrar como `empleado@demo.mx`, ve a **Planes** y envía el enlace de evidencia de una actividad (`Fase 4`).
8. Entra como `supervisor@demo.mx` y califica la evidencia agregando retroalimentación.

### Flujo 3: Evaluación Integral de Desempeño y Metas (RF-007)
1. Inicia sesión como `rh@demo.mx`.
2. Dirígete a **Objetivos** para revisar las metas estratégicas de la empresa o registrar una nueva.
3. Ve a **Evaluaciones** y haz clic en **Nueva Evaluación**.
4. Completa la pestaña 1 (Matriz de Competencias) y luego la pestaña 2 (**Cumplimiento de Objetivos Organizacionales**).
5. Guarda y verifica cómo se integran ambas dimensiones en el historial del colaborador.

### Flujo 4: Carga Masiva por CSV (RF-027)
1. Inicia sesión como `rh@demo.mx` o `admin@demo.mx`.
2. Dirígete a **Importación** en la barra lateral.
3. Descarga la plantilla oficial de nómina (`/api/templates/empleados`) o de competencias (`/api/templates/competencias`).
4. Sube el archivo CSV y observa la creación automatizada de áreas, puestos y usuarios con contraseñas seguras.

### Flujo 5: Mi Perfil y Seguridad (RF-028, RNF-001)
1. Haz clic en la tarjeta de usuario en la base de la barra lateral y selecciona **Mi Perfil**.
2. Consulta tus competencias vigentes y datos de asignación laboral.
3. Utiliza el formulario de **Cambiar Contraseña** para actualizar tu clave validando la credencial actual.

---

## Ejecución de Pruebas Automatizadas

El proyecto cuenta con scripts de prueba automatizados en `tests/`. Varios de ellos hacen peticiones a `http://localhost:3000`, así que mantén `npm run dev` corriendo en otra terminal mientras los ejecutas.

```bash
# Validar compilación de TypeScript (0 errores)
# Nota: en un clon nuevo ejecuta primero `npm run dev` (o `npx next typegen`)
# para que Next.js genere los tipos globales como `LayoutProps`.
npx tsc --noEmit

# Probar la barra lateral y el tema oscuro
node tests/theme-and-sidebar-test.mjs

# Probar fechas de oportunidades y vigencia (RF-011)
node tests/opportunity-dates-test.mjs

# Probar el vínculo Objetivo -> Convocatoria -> Plan
node tests/opportunity-objective-link-test.mjs

# Probar entregables de Fase 4, revisión y evaluación post-capacitación (RF-020, RF-021)
node tests/deliverables-and-evaluation-test.mjs

# Probar bitácora de auditoría y su restricción por rol (RF-026)
node tests/auditoria-test.mjs

# Probar objetivos organizacionales y desempeño (RF-007)
node tests/objetivos-desempeno-test.mjs

# Probar carga e importación masiva por CSV (RF-027)
node tests/importacion-csv-test.mjs

# Probar perfil personal y cambio de contraseñas (RF-028)
node tests/perfil-password-test.mjs
```

---

## Preguntas Frecuentes y Solución de Problemas

### 1. Error: "Cannot find module '@prisma/client'" o tipos de Prisma desactualizados
Ejecuta la regeneración del cliente:
```bash
npx prisma generate
```

### 2. La base de datos está vacía o faltan tablas (ej. "The table `main.Notification` does not exist")
Sincroniza el esquema y vuelve a ejecutar la semilla:
```bash
npx prisma db push
npx tsx prisma/seed.ts
```

### 3. El puerto 3000 se encuentra en uso
Puedes iniciar Next.js en un puerto alternativo:
```bash
npm run dev -- -p 3001
```

### 4. ¿Cómo detener el servidor de desarrollo?
En la terminal donde se encuentra en ejecución `npm run dev`, presiona la combinación de teclas:
```
Ctrl + C
```

---

## Pruebas automatizadas

El proyecto incluye 18 pruebas E2E orquestadas. `npm test` levanta el servidor si no esta corriendo, ejecuta todas las pruebas en orden de dependencia, muestra el veredicto final y restaura los datos demo (seed) al terminar.

```bash
npm test    # veredicto: 18/18 -> exit 0 (exito); cualquier fallo -> exit 1
npm run seed  # solo restaurar los datos demo
```

> Nota: las pruebas mutan la base de datos durante la corrida; el seed final la deja lista para demo. Si tienes la IA configurada (AI_API_KEY), la prueba de recomendaciones usara la IA real; sin clave, usa plantillas locales (RNF-015).
