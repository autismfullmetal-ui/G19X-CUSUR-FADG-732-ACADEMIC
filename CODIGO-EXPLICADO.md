# 📖 Código Explicado — Guía de TypeScript para el Proyecto PDP

> Desglose de los archivos clave con explicación de sintaxis línea por línea.
> Este documento NO cubre las 10,088 líneas — cubre los patrones que se repiten.
> Si entiendes estos patrones, puedes leer cualquier parte del código.

---

## PARTE 1: Sintaxis básica de TypeScript (los ladrillos)

Antes de leer el código del proyecto, domina estos conceptos. Se repiten TODO el tiempo.

### 1.1 — Variables

```typescript
const nombre = "Elena";        // Constante: no se puede reasignar
let contador = 0;              // Variable: sí se puede reasignar
var viejo = "no usar";         // Estilo antiguo, no se usa en este proyecto
```

**Regla de oro:** usa `const` por defecto. Solo usa `let` si necesitas cambiar el valor después.

### 1.2 — Tipos (TypeScript = JavaScript + tipos)

```typescript
const edad: number = 25;              // Número
const nombre: string = "Elena";       // Texto
const activo: boolean = true;         // Verdadero/Falso
const nada: null = null;              // Vacío intencional
const sinDefinir: undefined = undefined;  // Aún no tiene valor
```

Los dos puntos (`:`) indican el tipo. Si pones un texto donde va número, TypeScript te avisa ANTES de que corra el código.

### 1.3 — Funciones

```typescript
// Función normal
function sumar(a: number, b: number): number {
  return a + b;
}

// Función flecha (arrow function) — misma cosa, sintaxis más corta
const sumar2 = (a: number, b: number): number => a + b;
```

**Desglose de la firma:**
```typescript
function sumar(a: number, b: number): number
└──┬──┘└─┬─┘└───┬───────┘└───┬──────────┘
   │     │      │            └─ Tipo de lo que RETORNA
   │     │      └─ Parámetros con sus tipos
   │     └─ Nombre
   └─ Palabra clave
```

### 1.4 — `async` / `await` (operaciones que tardan)

```typescript
async function buscarEmpleado(id: number) {
  const empleado = await db.employee.findUnique({ where: { id } });
  return empleado;
}
```

- `async`: marca la función como asíncrona (hará operaciones que tardan)
- `await`: "espera aquí hasta que termine, sin congelar la app"
- Sin `await`, `buscarEmpleado` devuelve una PROMESA (un "IOU" del resultado futuro)
- Con `await`, devuelve directamente el valor

**Analogía:** Pides comida en un restaurante. `async` es que la cocina prepara tu pedido. `await` es esperar sentado hasta que llegue. Sin `await` sería irte con un "ticket" prometiendo que la comida llegará.

### 1.5 — Objetos y "shorthand"

```typescript
const nombre = "Elena";
const edad = 25;

// Objeto completo
const persona = { nombre: nombre, edad: edad };

// Shorthand: si la variable se llama igual que la propiedad
const persona2 = { nombre, edad };  // ¡Más corto, mismo resultado!
```

### 1.6 — Operadores importantes

```typescript
===           // Igualdad estricta (tipo Y valor)
!==           // Diferencia estricta
&&            // Y lógico (ambos deben cumplirse)
||            // O lógico
!             // Negación (!true === false)
??            // Nullish: usa el valor de la izquierda si NO es null/undefined
?.            // Optional chaining: accede sin error si no existe
...obj        // Spread: copia todas las propiedades
```

**Ejemplos reales del proyecto:**
```typescript
const status = formData.get("status") || "PENDIENTE";
// Si el campo es "" o null → usa "PENDIENTE"

const name = user?.name ?? "Anónimo";
// Si user existe, toma user.name. Si no existe O name es null → "Anónimo"

const nuevo = { ...antiguo, status: "NUEVO" };
// Copia antiguo, pero cambia status a "NUEVO"
```

### 1.7 — Truthy y Falsy

En TypeScript, estos valores se consideran "falsy" (se comportan como `false` en un if):

```
false, 0, "", null, undefined, NaN
```

Todo lo demás es "truthy". Por eso esto funciona:

```typescript
if (!employeeId) redirect("/error");  // Si es 0, null o undefined → redirige
```

### 1.8 — Arrays y funciones de array

```typescript
const numeros = [1, 2, 3, 4, 5];

// map: transforma cada elemento y devuelve un nuevo array
const dobles = numeros.map(n => n * 2);       // [2, 4, 6, 8, 10]

// filter: filtra elementos que cumplen una condición
const pares = numeros.filter(n => n % 2 === 0); // [2, 4]

// find: busca el PRIMER elemento que cumple
const primero = numeros.find(n => n > 3);      // 4

// forEach: ejecuta algo por cada elemento (no devuelve nada)
numeros.forEach(n => console.log(n));

// reduce: acumula en un solo valor
const suma = numeros.reduce((acc, n) => acc + n, 0);  // 15
```

En el proyecto se usan MUCHO para renderizar listas:

```tsx
{employees.map(emp => (
  <option key={emp.id} value={emp.id}>{emp.firstName}</option>
))}
```

### 1.9 — Desestructuración

```typescript
// Extraer propiedades de un objeto
const { firstName, lastName } = employee;
// Es lo mismo que:
// const firstName = employee.firstName;
// const lastName = employee.lastName;

// Extraer elementos de un array
const [primero, segundo] = [1, 2];
```

---

## PARTE 2: `src/lib/compatibility.ts` — Cálculo de compatibilidad

```typescript
export type GapInput = {
  competency: string;
  currentLevel: number;
  requiredLevel: number;
  mandatory: boolean;
};
```

**Línea por línea:**
- `export type` — Define un TIPO personalizado que otros archivos pueden importar
- `{ ... }` — Define la "forma" que tendrán los objetos de este tipo
- `competency: string` — La propiedad se llama `competency` y es texto
- `currentLevel: number` — Número
- `mandatory: boolean` — `true` o `false`

Este tipo describe "una brecha": qué competencia, nivel actual, nivel requerido y si es obligatoria.

---

```typescript
export function calculateCompatibility(
  employeeLevels: Record<number, number>,
  requirements: OpportunityRequirement[]
): number {
```

- `Record<number, number>` — Objeto cuyas claves son números y valores también números
  - Ejemplo: `{ 1: 3, 2: 4 }` significa "competencia 1 → nivel 3, competencia 2 → nivel 4"
- `OpportunityRequirement[]` — Array de requisitos de la oportunidad
- `): number` — La función devuelve un número (el porcentaje)

---

```typescript
  let totalWeight = 0;
  let earnedWeight = 0;
```

- `let` (no `const`) porque estas variables SÍ van a cambiar dentro del bucle
- `totalWeight`: la suma de todos los pesos posibles
- `earnedWeight`: cuánto peso ganó el empleado según sus niveles

---

```typescript
  for (const req of requirements) {
```

- `for...of` — Itera sobre cada elemento del array
- En cada vuelta, `req` es un requisito individual

---

```typescript
    const current = employeeLevels.get(req.competencyId) ?? 0;
```

- `employeeLevels.get(id)` — Busca el nivel del empleado para esa competencia
- `?? 0` — Si no encuentra nada (null/undefined), usa `0` en su lugar
- Es un "plan B": si el empleado nunca evaluó esa competencia, su nivel es 0

---

```typescript
    totalWeight += req.weight;
```

- `+=` — Suma y asigna (equivale a `totalWeight = totalWeight + req.weight`)
- Acumula el peso de este requisito al total

---

```typescript
    if (current >= req.requiredLevel) {
      earnedWeight += req.weight;
    } else {
      earnedWeight += (current / req.requiredLevel) * req.weight;
    }
```

**Lógica:**
- Si el empleado cumple o supera el nivel requerido → gana el peso COMPLETO
- Si hay brecha → gana una PROPORCIÓN (lo que tiene ÷ lo requerido × peso)

**Ejemplo:**
- Requisito: SQL nivel 4, peso 3
- Empleado tiene SQL nivel 2
- Gana: `(2 / 4) × 3 = 1.5` de los 3 puntos posibles
- Perdió 1.5 puntos → esa es la "brecha"

---

```typescript
  const compatibility = totalWeight > 0
    ? Math.round((earnedWeight / totalWeight) * 100)
    : 0;

  return compatibility;
}
```

- `condición ? valorSi : valorNo` — Operador ternario (if en una línea)
- Si el total es mayor a 0 → calcula el porcentaje (0-100)
- Si no hay requisitos → 0% (evita dividir entre cero)
- `Math.round()` — Redondea al entero más cercano (para no dar "83.33333%")

---

## PARTE 3: `src/lib/ai.ts` — Integración con IA (extracto clave)

```typescript
const BASE_URL = process.env.AI_BASE_URL ?? "https://api.openai.com/v1";
const API_KEY = process.env.AI_API_KEY ?? "";
const MODEL = process.env.AI_MODEL ?? "gpt-4o-mini";
```

- `process.env.X` — Lee variables de entorno (del archivo `.env`)
- `?? "valor"` — Si la variable no existe, usa el valor por defecto
- Esto permite cambiar de proveedor sin tocar código: solo editas `.env`

---

```typescript
export function aiConfigured(): boolean {
  return API_KEY.trim().length > 0;
}
```

- `.trim()` — Quita espacios en blanco al inicio y final
- `.length > 0` — Si después de quitar espacios quedan caracteres, hay clave
- Función simple: "¿Hay una API key configurada?"

---

```typescript
export async function generateAiRecommendation(input: {
  employee: string;
  opportunity: string;
  gaps: GapInput[];
}): Promise<AiRecommendation> {
```

- `input: { ... }` — Recibe un objeto con esas propiedades (desestructuración implícita)
- `): Promise<AiRecommendation>` — Al ser `async`, devuelve una **Promesa** que resolverá en un `AiRecommendation`
- La `Promise<T>` es el tipo de "un valor que llegará más adelante"

---

```typescript
  if (!aiConfigured()) return templateRecommendation(input);
```

- Si no hay clave API → usa la plantilla local inmediatamente
- Esto es el **fallback** (RNF-015): el sistema nunca falla por falta de IA

---

```typescript
  const system =
    "Eres un asistente de desarrollo profesional de recursos humanos. " +
    "Generas planes de desarrollo personalizados a partir de brechas de competencias. " +
    "Responde ÚNICAMENTE con un objeto JSON válido...";
```

- El `+` entre strings los **concatena** (une) en un solo texto largo
- Este es el "mensaje de sistema" que le dice a la IA cómo comportarse
- El prompt pide JSON estructurado para poder procesarlo después

---

```typescript
  const user = [
    `Empleado: ${input.employee}`,
    `Oportunidad: ${input.opportunity}`,
    "Brechas detectadas (competencia: nivel actual -> requerido):",
    ...input.gaps.map(
      (g) =>
        `- ${g.competency}: ${g.currentLevel} -> ${g.requiredLevel}${
          g.mandatory ? " (obligatoria)" : ""
        }`
    ),
  ].join("\n");
```

**Desglose (¡importante, hay varias cosas aquí!):**

1. **Template literals** — Los backticks (`` ` ``) permiten interpolar variables:
   - `` `Empleado: ${input.employee}` `` → "Empleado: Elena Vega"
   - `${...}` inserta el valor de la variable dentro del texto

2. **Spread con map** — `...input.gaps.map(...)`
   - `input.gaps.map(...)` transforma cada brecha en una línea de texto
   - El `...` (spread) "expande" ese array de textos dentro del array principal
   - Resultado: un solo array con el título + las brechas como elementoso

3. **Ternario dentro de template** — `g.mandatory ? " (obligatoria)" : ""`
   - Si la brecha es obligatoria → agrega " (obligatoria)"
   - Si no → agrega nada ("")
   - La `${}` también acepta expresiones, no solo variables

4. **`.join("\n")`** — Une todos los elementos del array en un solo string, separados por saltos de línea

**Resultado final (un solo string):**
```
Empleado: Elena Vega
Oportunidad: Líder de proyecto de datos
Brechas detectadas (competencia: nivel actual -> requerido):
- Python: 2 -> 4
- SQL: 3 -> 4 (obligatoria)
```

---

```typescript
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.4,
      max_tokens: 4096,
    }),
    signal: AbortSignal.timeout(90000),
  });
```

- `fetch(url, opciones)` — Función nativa de Node.js/JavaScript para hacer peticiones HTTP
- `method: "POST"` — Enviamos datos (GET solo lee)
- `headers` — Metadatos de la petición:
  - `content-type: application/json` — "Lo que envío es JSON"
  - `authorization: Bearer <key>` — "Soy un usuario autorizado con esta clave"
- `body: JSON.stringify({...})` — Convierte el objeto JavaScript a texto JSON para enviarlo
- `AbortSignal.timeout(90000)` — "Si tarda más de 90 segundos, cancela automáticamente" (RNF-015)
- `temperature: 0.4` — Creatividad de la IA (0=determinista, 1=muy creativa). 0.4 = algo variado pero confiable

---

```typescript
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
```

- `res.ok` — `true` si el código HTTP es 200-299 (éxito)
- `throw new Error(...)` — Lanza un error que interrumpe el flujo normal
- El `catch` que está más abajo lo atrapará y usará la plantilla

---

```typescript
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
```

- `res.json()` — Convierte la respuesta JSON a objeto JavaScript
- `as { ... }` — **Type assertion**: le dice a TypeScript "confía en mí, esto tiene esta forma"
- Los `?` en `choices?:` indican que la propiedad PUEDE no existir (undefined)

---

```typescript
  const content = data.choices?.[0]?.message?.content ?? "";
```

- `?.` (optional chaining) — Si lo anterior existe, accede; si no, devuelve `undefined` SIN lanzar error
- `?? ""` — Si al final quedó undefined, usa cadena vacía

**Cadena de seguridad:** `data?.choices?.[0]?.message?.content`
- Si `data` no tiene `choices` → undefined (no error)
- Si `choices` está vacío → undefined (no error)
- Si el primer choice no tiene `message` → undefined
- Es la forma segura de profundizar en un objeto que puede ser incompleto

---

```typescript
  const parsed = JSON.parse(content) as {
    recomendacion?: string;
    actividades?: { descripcion?: string; orden?: number }[];
  };
```

- `JSON.parse(texto)` — Convierte un string JSON a objeto JavaScript (lo inverso de `stringify`)
- Si la IA respondió texto inválido (no JSON), `parse` lanza error → el `catch` lo atrapa → fallback

---

```typescript
  const activities: ActivitySuggestion[] = (parsed.actividades ?? [])
    .filter((a) => a.descripcion)
    .map((a, i) => ({
      descripcion: String(a.descripcion),
      orden: a.orden ?? i + 1,
    }));
```

1. `parsed.actividades ?? []` — Si no hay actividades, usa array vacío
2. `.filter(a => a.descripcion)` — Solo deja las que SÍ tienen descripción
3. `.map((a, i) => ({...}))` — Transforma cada una a un objeto limpio:
   - `String(a.descripcion)` — Asegura que sea texto
   - `a.orden ?? i + 1` — Si la IA no dio orden, usa la posición (1, 2, 3...)

---

```typescript
  } catch {
    return templateRecommendation(input);
  }
```

- `catch` — Si CUALQUIER cosa falló arriba (timeout, HTTP error, JSON inválido...)
- → Usa la plantilla local como respaldo
- El usuario siempre obtiene una recomendación útil

---

## PARTE 4: `src/lib/auth.ts` — Autenticación (extracto)

```typescript
async authorize(credentials) {
  const user = await db.user.findUnique({
    where: { email: credentials.email as string },
  });
  if (!user) return null;

  const valid = await bcrypt.compare(
    credentials.password as string,
    user.passwordHash
  );
  if (!valid) return null;

  return { id: user.id, email: user.email, name: user.name, role: user.role };
},
```

**Línea por línea:**

1. `authorize(credentials)` — Función que Auth.js llama cuando alguien intenta iniciar sesión
2. `credentials.email as string` — `as string` es type assertion: Auth.js lo define como `unknown`, yo sé que es string
3. `findUnique({ where: { email } })` — Busca el usuario en la BD por su email
4. `if (!user) return null` — Si no existe → login fallido (null = credenciales inválidas)
5. `bcrypt.compare(password, hash)` — Compara la contraseña en texto plano con el hash guardado
   - Internamente hashea la contraseña ingresada y compara con el hash almacenado
   - Devuelve `true` si coinciden
   - **NO descifra** el hash — es irreversible por diseño (seguridad)
6. `return { id, email, name, role }` — Si todo bien, Auth.js crea un JWT con estos datos

---

```typescript
callbacks: {
  jwt({ token, user }) {
    if (user) {
      token.id = user.id;
      token.role = user.role;
    }
    return token;
  },
  session({ session, token }) {
    session.user.id = token.id;
    session.user.role = token.role;
    return session;
  },
},
```

**¿Por qué dos callbacks?**

1. `jwt` — Se ejecuta AL INICIAR SESIÓN. Agrega `id` y `role` al token (que se firma y cifra)
2. `session` — Se ejecuta EN CADA PETICIÓN. Copia del token a la sesión que las acciones pueden leer

**Sin estos callbacks, `session.user.role` sería `undefined`** porque Auth.js por defecto solo guarda `email` y `name` en la sesión.

---

## PARTE 5: `src/app/actions.ts` — Lógica de negocio (extracto)

```typescript
export async function createEmployee(formData: FormData) {
  const session = await requireRole([ROLES.ADMIN, ROLES.RH]);
```

- `export async function` — Función asíncrona exportada (Server Action)
- `formData: FormData` — Next.js serializa el formulario del cliente y lo entrega aquí
- `requireRole([...])` — Valida sesión + rol. Si no tiene, lanza error y no continúa

---

```typescript
  const firstName = str(formData.get("firstName"));
  const lastName = str(formData.get("lastName"));
  const email = str(formData.get("email")).toLowerCase().trim();
  const status = str(formData.get("status")) || "ACTIVO";
  const departmentId = num(formData.get("departmentId"));
  const positionId = num(formData.get("positionId"));
  const supervisorId = num(formData.get("supervisorId")) || null;
```

- `str(...)` — Función propia: convierte a texto limpio
- `.toLowerCase()` — Convierte a minúsculas ("Elena@Mail.COM" → "elena@mail.com")
- `.trim()` — Quita espacios sobrantes
- `|| "ACTIVO"` — Si no se eligió status, usa "ACTIVO" por defecto
- `|| null` — Si no hay supervisor asignado, guarda `null` (no 0)

---

```typescript
  const user = await db.user.create({
    data: {
      email,
      passwordHash: bcrypt.hashSync("Demo1234!", 10),
      name: `${firstName} ${lastName}`,
      role: "EMPLEADO",
    },
  });
```

- `db.user.create` — Inserta una nueva fila en la tabla User
- `bcrypt.hashSync("Demo1234!", 10)` — Hashea la contraseña:
  - `"Demo1234!"` — La contraseña en texto plano
  - `10` — Factor de costo (más alto = más lento = más seguro)
  - `hashSync` — Versión síncrona (bloquea hasta terminar)
- `name: \`${firstName} ${lastName}\`` — Template literal: "Elena Vega"

**¿Por qué se crea un User?** Para que el empleado pueda iniciar sesión. Se crea automáticamente con rol EMPLEADO y contraseña temporal.

---

```typescript
  const employee = await db.employee.create({
    data: {
      firstName,
      lastName,
      email,
      status,
      departmentId,
      positionId,
      supervisorId,
      userId: user.id,
    },
  });
```

- Ahora se crea el EMPLEADO (tabla Employee), enlazado al User recién creado
- `userId: user.id` — La conexión entre ambas entidades
- `shorthand`: `firstName` es lo mismo que `firstName: firstName`

---

```typescript
  // Competencias iniciales seleccionadas por RH (RF-006, RF-036)
  const selected = str(formData.get("competencies")) || "[]";
  const competencyList: { id: number; level: number }[] = JSON.parse(selected);
```

- El formulario envía las competencias como JSON en un solo campo
- `|| "[]"` — Si no vino nada, usa array vacío (como texto)
- `JSON.parse(selected)` — Convierte ese texto a un array de objetos
- `: { id: number; level: number }[]` — Tipo explícito: array de objetos con id y level

---

```typescript
  const evaluatorId = session?.user?.id ? Number(session.user.id) : null;
  if (evaluatorId) {
    const evaluation = await db.evaluation.create({
      data: {
        employeeId: employee.id,
        evaluatorId,
        type: "INICIAL",
        status: "FINALIZADA",
        comment: "Evaluación diagnóstica inicial registrada al dar de alta al empleado por RH.",
        finalizedAt: new Date(),
      },
    });
```

- `session?.user?.id` — Optional chaining: accede sin error si la sesión existe
- `? ... : null` — Si existe el id, lo convierte a número; si no, null
- `if (evaluatorId)` — Solo crea la evaluación si hay un evaluador válido
- Se crea automáticamente una evaluación INICIAL con las competencias seleccionadas por RH

---

```typescript
  revalidatePath("/empleados");
  redirect("/empleados?ok=" + employee.id);
}
```

- `revalidatePath("/empleados")` — Le dice a Next.js: "la página /empleados cambió, refresca la caché"
- `redirect(...)` — Manda al usuario de vuelta con un parámetro de éxito (`?ok=id`)
- La página de empleados lee ese parámetro para mostrar "Empleado creado con éxito"

---

## PARTE 6: Un componente React (extracto de EvaluacionForm)

```tsx
"use client";

import { useState } from "react";
```

- `"use client"` — Directiva de Next.js: este componente se ejecuta en el NAVEGADOR (no en el servidor)
- `import { useState } from "react"` — Importa el hook `useState` de la librería React

---

```typescript
const [employeeId, setEmployeeId] = useState("");
```

- `useState("")` — Hook que crea una variable de estado con valor inicial `""`
- Devuelve un array con 2 elementos:
  - `employeeId` — El valor actual
  - `setEmployeeId` — Función para cambiarlo
- `[a, b] = ...` — **Desestructuración de array**: asigna cada elemento a una variable

**Cada vez que llamas `setEmployeeId("5")`, React re-renderiza el componente con el nuevo valor.**

---

```tsx
<select onChange={(e) => setEmployeeId(e.target.value)}>
  {employees.map((emp) => (
    <option key={emp.id} value={emp.id}>
      {emp.firstName} {emp.lastName}
    </option>
  ))}
</select>
```

- `onChange={(e) => setEmployeeId(e.target.value)}` — Cuando cambie la selección, guarda el valor
  - `e` es el evento del DOM
  - `e.target.value` es el valor seleccionado
- `{employees.map(...)}` — Dentro de JSX, las `{}` ejecutan JavaScript
  - `.map()` transforma cada empleado en un `<option>`
  - `key={emp.id}` — React necesita una key única para optimizar el renderizado

---

```typescript
  async function handleSubmit() {
    const fd = new FormData();
    fd.set("employeeId", employeeId);
    fd.set("type", "INICIAL");

    scores.forEach((level, compId) => {
      fd.append("competencies", JSON.stringify({ id: compId, level }));
    });

    await action(fd);
  }
```

- `new FormData()` — Crea un objeto para enviar datos como si fuera un formulario HTML
- `fd.set("employeeId", employeeId)` — Agrega un campo
- `fd.append("competencies", ...)` — Agrega (permite duplicados)
- `JSON.stringify({...})` — Convierte el objeto a texto JSON
- `await action(fd)` — Llama a la Server Action (`createEvaluation`) en el servidor
- Next.js se encarga de serializar, enviar y ejecutar — sin crear un endpoint manual

---

## PARTE 7: Prisma — Modelo de datos (extracto de schema.prisma)

```prisma
model Employee {
  id            Int       @id @default(autoincrement())
  firstName     String
  lastName      String
  email         String    @unique
  status        String    @default("ACTIVO")
  createdAt     DateTime  @default(now())
  departmentId  Int
  department    Department @relation(fields: [departmentId], references: [id])
  supervisorId  Int?
  supervisor    Employee?  @relation("Supervision", fields: [supervisorId], references: [id])
  subordinates  Employee[] @relation("Supervision")
  userId        Int?       @unique
  user          User?      @relation(fields: [userId], references: [id])
}
```

**Desglose de la sintaxis Prisma:**

| Sintaxis | Significado |
|----------|-------------|
| `model Employee` | Define una tabla llamada `Employee` |
| `id Int @id` | Clave primaria |
| `@default(autoincrement())` | Auto-incrementa (1, 2, 3...) |
| `String` | Tipo texto |
| `@unique` | No puede repetirse (índice único) |
| `@default("ACTIVO")` | Si no se especifica, usa "ACTIVO" |
| `DateTime @default(now())` | Fecha, por defecto la hora actual |
| `departmentId Int` | Columna que guarda el ID del departamento |
| `@relation(fields: [...], references: [...])` | Define la relación (clave foránea) |
| `supervisorId Int?` | El `?` significa "opcional" (puede ser null) |
| `@relation("Supervision")` | Relación con NOMBRE (auto-relación) |
| `subordinates Employee[]` | Lista de subordinados (lado inverso de la relación) |

**Concepto clave — Relación a sí mismo:**
Un `Employee` puede ser supervisor de otros `Employee`s:
```javascript
// Sergio (supervisor)
employee.supervisorId = null
employee.subordinates = [Elena, ...]

// Elena (subordinada)
employee.supervisorId = sergio.id
employee.subordinates = []
```

**Concepto clave — User vs Employee:**
```javascript
// User: quien inicia sesión (autenticación)
// Employee: quien trabaja en la empresa (negocio)
// Están conectados por userId (opcional)
// No todos los User son empleados (p.ej. un Admin)
```

---

## PARTE 8: Preguntas de práctica sobre el código

**P: ¿Qué significa `const`?**
> Constante: una variable que no se puede reasignar. Es la forma preferida en el proyecto.

**P: ¿Qué hace `await`?**
> Espera el resultado de una operación asíncrona (como consultar la base de datos) antes de continuar con la siguiente línea.

**P: ¿Qué es un Server Action?**
> Una función que vive en el servidor y se llama directamente desde un componente de cliente. Next.js se encarga de la comunicación automáticamente, sin necesidad de crear endpoints REST manuales.

**P: ¿Por qué bcrypt y no MD5 o SHA-256?**
> bcrypt es "lento a propósito" — se diseñó para que cada intento tarde ~100ms, lo que hace inviable la fuerza bruta. MD5 y SHA son rápidos y están rotos para contraseñas.

**P: ¿Qué hace `?? 0`?**
> Si el valor de la izquierda es `null` o `undefined`, usa `0`. Es un "plan B" para valores ausentes.

**P: ¿Qué significa el `?` en `supervisorId Int?`?**
> El campo es opcional — puede guardar `null`. Un empleado puede no tener supervisor asignado.

**P: ¿Qué hace `revalidatePath`?**
> Le dice a Next.js que los datos de esa ruta cambiaron y debe refrescar la caché para mostrar datos actualizados.

---

## 🎯 Resumen: los 10 patrones que dominan el proyecto

1. **`const` + `async`/`await`** — Toda operación con BD es asíncrona
2. **`db.modelo.operación()`** — Prisma: `findUnique`, `findMany`, `create`, `update`
3. **`requireRole([...])`** — Verificación de permisos en cada acción
4. **`formData.get("campo")`** — Lectura de datos del formulario
5. **`?.` y `??`** — Acceso seguro a datos que pueden faltar
6. **`.map()`, `.filter()`, `.join()`** — Transformación de arrays para renderizar
7. **Template literals** — `` `Texto ${variable}` `` para construir strings
8. **`useState`** — Estado local en componentes de cliente
9. **`try/catch` con fallback** — Resiliencia (IA → plantilla local)
10. **`revalidatePath` + `redirect`** — Actualizar caché y navegar después de una acción

Si entiendes estos 10 patrones, puedes leer y explicar el 90% del código del proyecto.
