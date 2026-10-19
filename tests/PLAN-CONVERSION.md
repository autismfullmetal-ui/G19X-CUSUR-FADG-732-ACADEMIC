# Plan de Conversión de Pruebas E2E (Fase 1 — Auditoría)

> Objetivo: hacer que cada prueba **falle con error claro** cuando algo no sale como se espera (hoy solo imprimen con console.log) y exponer `npm run seed` / `npm test`.
> Este documento es el inventario y checklist de conversión.

---

## 1. Inventario de pruebas

| # | Test | Tipo | Necesita servidor | Capacidad de fallar HOY |
|---|------|------|:---:|-------------------------|
| 1 | calc-test.mjs | Unitario (función pura) | No | 🟢 exit(1) global, sin mensaje granular |
| 2 | empleados-filters-test.mjs | Estático (lee código fuente) | No | 🟢 exit(1) agregado, no dice cuál falló |
| 3 | empleado-form-competency-test.mjs | Estático | No | 🟢 exit(1) agregado |
| 4 | planes-ui-test.mjs | E2E HTTP | Sí | 🟢 checks con nombre + exit(1) (mejor patrón actual) |
| 5 | competency-tooltip-test.mjs | BD + estático | Parcial | 🟢 agregado parcial (4 de 7 checks) |
| 6 | apply-test.mjs | E2E HTTP | Sí | 🟡 solo 1 guardia; resto console.log |
| 7 | rec-test.mjs | E2E HTTP | Sí | 🟡 2 guardias; resto console.log |
| 8 | login-test.mjs | E2E HTTP | Sí | 🔴 nunca falla |
| 9 | objetivos-desempeno-test.mjs | E2E HTTP | Sí | 🔴 solo excepciones |
| 10 | importacion-csv-test.mjs | E2E HTTP + BD | Sí | 🔴 solo excepciones |
| 11 | perfil-password-test.mjs | E2E HTTP + BD | Sí | 🔴 solo excepciones |
| 12 | auditoria-test.mjs | E2E HTTP | Sí | 🔴 solo excepciones |
| 13 | theme-and-sidebar-test.mjs | E2E HTTP | Sí | 🔴 solo excepciones |
| 14 | deliverables-and-evaluation-test.mjs | BD directa | No | 🔴 booleans impresos sin exit |
| 15 | opportunity-dates-test.mjs | BD directa | No | 🟡 1 throw; resto console.log |
| 16 | opportunity-objective-link-test.mjs | BD directa | No | 🔴 solo excepciones |
| 17 | verify-glm-recommendation.ts | Script manual (IA real) | No | — EXCLUIDO del runner: requiere API key y consume tokens |

## 2. Valores esperados (base para los asserts)

| Test | Verificación | Esperado |
|------|--------------|----------|
| calc | compatibilidad / brechas / obligatoria incumplida | 75 / 1 / false |
| login | POST callback → GET /dashboard | 302 → 200, HTML contiene "Elena Vega" |
| apply | postulación 1 / RN-001 duplicada / BD | 303 + /postulaciones/; error=duplicada; compat 75 y 2 brechas (Python, SQL) |
| rec | generación sin clave / aprobación | modelVersion "plantilla-local" (condicional, ver hallazgo 1); PROPUESTA → APROBADA; actividades > 0 |
| plan | creación, aprobación, auto-COMPLETADO | estados según flujo; actividades precargadas |
| fechas | vencida / no abierta / cierre con plan | isExpired true con deadline pasada; postulación con plan sigue ACTIVA |
| deliverables | entregable → ENTREGADA → COMPLETADA → plan COMPLETADO | deliverable, evidenceUrl, feedback, reviewedAt persistidos |
| objetivos | /objetivos por rol, filtro dept | ADMIN ve botón; EMPLEADO no; filtro ?dept=1 muestra "Sistemas" |
| importacion | plantillas, acceso, inserción | status 200; EMPLEADO ve "Acceso Restringido"; count+1 |
| perfil | cambio y restablecimiento de contraseña | login 302 con nueva clave y con la restaurada |
| auditoria | /auditoria por rol | ADMIN ve eventos; EMPLEADO ve "Acceso Restringido" |
| theme | /dashboard autenticado | app-dark-layout, aside, links de navegación |
| tooltip / filters / form-comp | patrones en código fuente | booleans agregados ya verificados; convertir a assert individual |

## 3. Hallazgos que condicionan el diseño

1. **rec-test es condicional a la API key:** espera `plantilla-local` solo cuando `AI_API_KEY` está vacía. Si hay clave, la IA devuelve su modelo (ej. "glm-4.5"). El assert será: origen === (API_KEY ? "ia" : "plantilla-local").
2. **Orden de dependencia:** plan-test y rec-test consumen la postulación que crea apply-test (la localizan con findFirst). Orden obligatorio del runner: calc → apply → login → plan → rec → resto.
3. **Limpieza:** fechas, objective-link y deliverables crean y borran sus propios datos; perfil restaura la contraseña. El runner igualmente ejecutará el seed al final para dejar datos demo limpios.
4. **calc-test importa un .ts:** requiere ejecutarse con Node ≥ 22 (type stripping) o tsx. El runner usará el mismo runtime para todo.

## 4. Cambios planificados (fases siguientes)

- **Fase 2:** `package.json`: `"seed": "tsx prisma/seed.ts"` y `"test": "node tests/run-all.mjs"`.
- **Fase 3:** `tests/run-all.mjs`: detecta/levanta el servidor en :3000, ejecuta las pruebas en orden, corriendo todas aunque haya fallos, suma veredicto (exit 0/1) y re-ejecuta el seed al final.
- **Fase 4:** convertir cada console.log de verificación en `assert` (node:assert/strict) con mensaje que indique qué se esperaba y qué llegó. verify-glm queda fuera del runner.
- **Fase 5:** probar rojo (romper algo a propósito) y verde; documentar en SETUP.md.

## 5. Checklist de conversión

- [ ] calc-test: granularizar a asserts individuales
- [ ] login-test: 4 asserts
- [ ] apply-test: 8 asserts + mantener guardia
- [ ] rec-test: 6 asserts + condicional API key
- [ ] plan-test: asserts de flujo
- [ ] fechas: asserts de lógica y continuidad
- [ ] deliverables: asserts de persistencia
- [ ] objetivos: asserts por rol y filtro
- [ ] importacion: asserts de plantillas, acceso e inserción
- [ ] perfil: asserts de cambio/restablecimiento
- [ ] auditoria: asserts por rol
- [ ] theme: asserts de tema y navegación
- [ ] planes-ui: migrar checks a assert individual
- [ ] tooltip/filters/form-comp: assert individual por patrón
- [ ] run-all.mjs: orquestador con veredicto
- [ ] package.json: scripts seed y test
- [ ] SETUP.md: documentar npm test
