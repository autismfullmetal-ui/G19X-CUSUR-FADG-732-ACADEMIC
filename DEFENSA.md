# 🎓 Guía de Defensa del Proyecto — Plataforma PDP

> Guía práctica para sustentar el proyecto ante un panel o evaluador.

---

## 1. Pitch de apertura (30 segundos)

> "Desarrollé una plataforma web para la gestión de planes de desarrollo profesional. El sistema permite evaluar competencias de los empleados, detectar brechas respecto a oportunidades internas, y generar —con ayuda de inteligencia artificial— planes de desarrollo personalizados que el colaborador ejecuta con entregables verificables. Todo cerrando el ciclo con una evaluación post-capacitación que determina si la brecha fue superada."

---

## 2. Números clave del proyecto

| Métrica | Valor |
|---------|-------|
| Líneas de código | ~10,000 |
| Componentes reutilizables | 19 |
| Páginas de la aplicación | 14 |
| Tests automatizados | 18 |
| Roles de usuario | 4 (Admin, RH, Supervisor, Empleado) |
| Entidades de base de datos | 17 |
| Modelos de IA integrados | GLM-4.5 (fallback: plantilla local) |

---

## 3. Arquitectura explicada en 1 minuto

**Capa de presentación (Frontend)**
- Next.js 16 con App Router → el framework decide si renderiza en servidor o cliente según cada página
- React 19 para la interactividad
- Tailwind CSS v4 para los estilos (tema oscuro vino/negro/rojo corporativo)

**Capa de negocio (Backend)**
- Server Actions de Next.js → toda la lógica de negocio vive en `actions.ts`
- No expongo una API REST separada → menos superficie de ataque
- Validación de roles en cada acción (`requireRole`)

**Capa de datos**
- Prisma ORM → me da tipado seguro entre base de datos y código TypeScript
- SQLite local → cero configuración para el MVP, fácil de migrar a PostgreSQL después

**Seguridad**
- Autenticación con Auth.js v5 (JWT firmado)
- Contraseñas con bcryptjs (hashing irreversible)
- RBAC estricto (4 roles, cada acción valida permisos)
- Auditoría inmutable de acciones críticas

**Inteligencia Artificial**
- API compatible con OpenAI (GLM-4.5 de Zhipu AI)
- Si la IA falla → fallback automático a plantillas locales (RNF-015)
- Timeout de 90 segundos para modelos con razonamiento profundo

---

## 4. Flujo principal (para explicar en la demo)

```
1. RH crea empleado + asigna competencias iniciales
2. Supervisor evalúa al empleado (nivel 1-5 por competencia)
3. RH publica oportunidad con requisitos ponderados
4. Empleado se postula → sistema calcula compatibilidad % y brechas
5. RH/Supervisor genera recomendación con IA
6. RH aprueba la recomendación
7. Se crea el plan con actividades (modelo 70-20-10)
8. Empleado ejecuta actividades y sube entregables (GitHub, Drive, etc.)
9. Supervisor revisa evidencia y aprueba o pide correcciones
10. Evaluación post-capacitación → si nivel ≥ requerido → brecha SUPERADA
```

---

## 5. Preguntas probables del panel y cómo responder

### P: "¿Por qué Next.js y no React puro o Django?"
> "Next.js me da Server Actions que reducen la superficie de ataque al no exponer APIs REST separadas. También renderiza en servidor lo que mejora el SEO y la velocidad inicial. React puro necesitaría un backend adicional; Django me daría todo en Python pero sin el tipado end-to-end que Prisma + TypeScript me regala."

### P: "¿Por qué SQLite y no PostgreSQL/MySQL?"
> "Para el MVP prioricé velocidad de desarrollo y cero configuración. SQLite vive en un archivo local, es perfectamente capaz para demo y pruebas. El ORM Prisma me permite migrar a PostgreSQL en producción cambiando una sola línea de configuración, sin tocar el código."

### P: "¿Cómo garantizas que un supervisor no evalúe a empleados ajenos?"
> "Tengo doble validación: en la pantalla, el formulario solo lista los colaboradores directos filtrando por `supervisorId`. En el servidor, la acción `createEvaluation` verifica en base de datos que el empleado efectivamente tenga a ese supervisor asignado antes de guardar. Si alguien manipula datos manualmente, el servidor lo rechaza."

### P: "¿Qué pasa si la IA falla o tarda mucho?"
> "Tengo resiliencia (RNF-015): un timeout de 90 segundos y un fallback automático a plantillas locales predefinidas. El usuario siempre obtiene una recomendación útil, aunque venga de la plantilla en lugar del modelo. El sistema registra la fuente (IA o plantilla) para trazabilidad."

### P: "¿Cómo se calcula la compatibilidad?"
> "Cada requisito de la oportunidad tiene un peso. Comparo el nivel actual del empleado contra el requerido por cada competencia. Si cumple, aporta su peso completo; si hay brecha, aporta proporcionalmente. La suma ponderada da un porcentaje global. Las competencias obligatorias se marcan aparte para que no sean compensadas por otras."

### P: "¿Cómo manejas la seguridad de contraseñas?"
> "Hashing irreversible con bcryptjs y factor de costo 10. Nunca guardo ni envío texto plano. La sesión usa JWT firmado con Auth.js v5. Además, hay validación de la contraseña actual antes de permitir un cambio, y los roles ADMIN/RH pueden restablecer credenciales."

### P: "¿Cómo sabes que tu código funciona?"
> "Tengo 18 scripts de pruebas automatizadas que cubren: login por rol, evaluaciones, planes, dashboards, notificaciones, importación CSV, permisos de supervisor y cierre de brechas. Además, TypeScript con `--noEmit` me da verificación de tipos estática en tiempo de compilación (0 errores)."

### P: "¿Qué es el modelo 70-20-10?"
> "Es una metodología de desarrollo profesional: 70% aprendizaje mediante experiencia práctica, 20% mediante interacción social (mentoría, feedback), y 10% mediante formación formal (cursos). El plan generado por IA estructura las actividades siguiendo esta distribución."

### P: "¿Qué partes del PRD quedaron fuera del alcance?"
> "Documenté explícitamente lo que NO incluí: nómina, asistencia, vacaciones, LMS completo, evaluación psicológica, decisiones automatizadas de RH, aplicación móvil nativa. Esto es clave para un MVP: delimitar el alcance para entregar valor real sin sobrecargar el proyecto."

---

## 6. Guion de demostración (5-7 minutos)

### Paso 1 — Login como Empleado (30 seg)
- Iniciar sesión con `empleado@demo.mx` / `Demo1234!`
- Mostrar dashboard del empleado: sus competencias y estado de planes
- Ir a "Oportunidades" → mostrar la lista
- Ir a "Mis postulaciones" → mostrar compatibilidad y brechas

### Paso 2 — Cambiar a Supervisor (1 min)
- Cerrar sesión, iniciar con `supervisor@demo.mx`
- Mostrar dashboard: solo ve a su equipo (Elena Vega)
- Ir a "Evaluaciones" → mostrar que solo puede evaluar a sus subordinados
- Revisar un plan con entregables pendientes → dejar feedback

### Paso 3 — Cambiar a RH (2 min)
- Cerrar sesión, iniciar con `rh@demo.mx`
- Mostrar dashboard global con métricas
- Ir a "Postulaciones" → seleccionar la de Elena
- Clic en "Generar recomendación" → mostrar que viene de IA real
- Clic en "Aprobar" → notificación generada

### Paso 4 — Plan de desarrollo (1.5 min)
- Ir a "Planes" → mostrar el plan creado
- Expandir actividades: mostrar entregables con URLs
- Marcar una actividad como completada

### Paso 5 — Cierre de brecha (1 min)
- Volver como Supervisor → evaluar post-capacitación a Elena
- Asignar nivel 4 en Python (antes tenía 2)
- Mostrar que la brecha cambia a "SUPERADA"

---

## 7. Conceptos técnicos que deberías dominar

| Concepto | Explicación en 1 frase |
|----------|----------------------|
| **Server Actions** | Funciones que corren en el servidor y se llaman directamente desde componentes React, sin exponer endpoints HTTP. |
| **ORM (Prisma)** | Traduce objetos TypeScript a consultas SQL, dándome autocompletado y seguridad de tipos. |
| **RBAC** | Role-Based Access Control: cada acción valida el rol del usuario antes de ejecutarse. |
| **bcrypt** | Algoritmo de hashing adaptativo: es lento a propósito, lo que hace inviable descifrar contraseñas por fuerza bruta. |
| **JWT** | JSON Web Token: token firmado que contiene la identidad del usuario y se envía en cada petición. |
| **Fallback** | Plan B automático: si la IA falla, el sistema usa plantillas locales sin interrumpir al usuario. |
| **70-20-10** | Modelo de desarrollo: 70% experiencia práctica, 20% interacción social, 10% formación formal. |
| **MVP** | Producto Mínimo Viable: versión con funcionalidades esenciales para validar el concepto. |

---

## 8. Posibles críticas del panel y cómo responder

### Crítica: "Es solo un CRUD con IA encima"
> "El valor no está en cada componente individual, sino en el flujo integrado: evaluar → detectar brechas → recomendar → ejecutar → reevaluar → cerrar. Ese ciclo continuo es lo que ningún CRUD suelto ofrece."

### Crítica: "¿Qué pasa si la IA genera una recomendación incorrecta o sesgada?"
> "La IA nunca decide por sí sola: toda recomendación pasa por revisión humana antes de convertirse en plan. El PRD (RF-015, RN-009) establece explícitamente que la IA asiste pero no decide. Además, guardo la versión del modelo para trazabilidad."

### Crítica: "¿Por qué no usaste una arquitectura de microservicios?"
> "Para un MVP de una persona, los microservicios son sobre-ingeniería: más complejidad operativa sin beneficio tangible. Prefiero un monolito modular bien organizado que pueda escalar después si el negocio lo justifica."

### Crítica: "¿Cómo manejas la concurrencia si dos personas editan lo mismo?"
> "Prisma con SQLite maneja el aislamiento a nivel de transacción. Para el MVP no implementé bloqueo optimista, pero es un refinamiento directo si el sistema crece a múltiples usuarios simultáneos."

---

## 9. Tips para el día de la defensa

1. **Practica el pitch en voz alta** hasta que salga natural
2. **Ten la app corriendo antes de empezar** (no hagas la demo en vivo si la red falla: ten capturas de respaldo)
3. **Domina el flujo de 10 pasos** — es tu columna vertebral
4. **Si no sabes algo, admítelo**: "Es una buena observación, no lo implementé en el MVP pero lo consideraría en una siguiente iteración"
5. **Usa los números**: 10,000 líneas, 18 tests, 4 roles — dan credibilidad
6. **Conecta cada decisión con el PRD**: "Lo hice así porque el PRD establece en RF-XXX que..."

---

*Documento de apoyo para la defensa. No forma parte del código de producción.*
