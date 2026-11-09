---
code: CT
name: Control Triangle
slug: control-triangle
---

# Control Triangle (`CT`)

Ficha del curso **Control Triangle** (Webi Demo Todo). El material vive en
`courses/control-triangle/` (del repo): `solution.md`, `README.md` y
`modules/<nn>/README.md` + `modules/<nn>/guiones/*.md`. Los resultados esperados
compilados están en `data/ct/` dentro de este skill.

El curso se recorre en **5 módulos**, en orden. Desde el Módulo 02, cada módulo
corresponde a un **slice** de la solución. Esta es la referencia para presentar los
módulos en el onboarding (resumen breve) y para ubicar al estudiante; **no** la vuelques
entera: usa solo lo que haga falta.

- **Módulo 01 — Comprender la solución.** Clarificar el vocabulario del documento de solución
  (vértice Conocimiento) antes de construir. Guiones (Word Cleaning): `01-wc-frontend`
  (frontend y stack de la SPA), `02-wc-autenticacion` (OAuth2/OIDC, PKCE, tokens),
  `03-wc-cognito` (Amazon Cognito y su infraestructura), `04-wc-backend` (microservicio,
  CRUD, MongoDB, Express).
- **Módulo 02 — Slice 01: Scaffolding.** Levantar el andamiaje ejecutable (SPA React+Vite+TS,
  backend Express+TS, proxy, tema base, MobX). Guiones: `01-proyectos-base` (monorepo frontend
  + backend conectados por el proxy de Vite), `02-frontend-base` (tema base, shell con branding
  e integración de MobX).
- **Módulo 03 — Slice 02: Login System.** Ciclo completo de autenticación. Guiones:
  `01-cognito` (desplegar Cognito desde el CLI), `02-login-spa` (flujo de login en la SPA con
  PKCE), `03-sesion` (renovación con refresh token, info de usuario y logout).
- **Módulo 04 — Slice 03: CRUD de tareas.** Gestión de tareas del tablero persistida en Mongo.
  Guiones: `01-tablero-visual` (tablero y tarjetas visuales), `02-integracion-base-datos`
  (MongoDB con Docker + Mongoose), `03-crud-operaciones` (crear, listar, editar, eliminar).
- **Módulo 05 — Slice 04: Drag & drop.** Perfeccionar la experiencia del tablero. Guion:
  `01-drag-and-drop` (arrastrar y soltar, reordenamiento y mejora de la experiencia). Cierra la
  solución.

Dentro de cada guion, los prompts se identifican con su código `CT-M##-G##-I##-P<LETRA>[-<SUB>]`.

## Mapeo módulo → slice

Desde el Módulo 02, cada módulo corresponde a un **slice** de la solución del curso
(`courses/control-triangle/solution.md`, Sección 8, Slices):

- **Módulo 01** → no es un slice: es la comprensión de la solución (Conocimiento).
- **Módulo 02** → **Slice 01 — Scaffolding**.
- **Módulo 03** → **Slice 02 — Login System**.
- **Módulo 04** → **Slice 03 — CRUD de tareas en el tablero Kanban**.
- **Módulo 05** → **Slice 04 — Drag & drop, reordenamiento y feedback**.

## Convenciones operativas (específicas de este curso)

### Recursos en la nube (AWS): convención de nombres

Cuando en el curso se creen recursos **directamente en la nube de AWS** (por ejemplo, un
User Pool de Cognito, su dominio, app clients, etc.), **nómbralos siempre con el prefijo
reconocible `webi-todo`** (p. ej. `webi-todo`, `webi-todo-spa`, `webi-todo-<algo>`). Esto
permite identificarlos como recursos del curso y **hacer limpieza después** sin ambigüedad,
sin afectar otros recursos de la cuenta.

- Aplica el prefijo a **todo** recurso creado directamente (no gestionado por IaC).
- Al limpiar, filtra por ese prefijo para eliminar solo lo del curso.
- Si un recurso no admite el nombre con prefijo, usa una etiqueta/tag equivalente
  (`Project=webi-todo`) para poder reconocerlo.

### Limpieza de recursos (Cognito)

El estudiante **puede pedir limpiar** los recursos de AWS creados durante el curso (por
ejemplo, el User Pool de Cognito, su dominio y el app client). Es una tarea válida. Cómo
proceder:

1. **Verifica el acceso a AWS** primero, con las credenciales del `.env` de `app/` (igual que
   en el guion de Cognito): toma las variables del `.env` y confirma la identidad de la cuenta
   (`aws sts get-caller-identity`), **sin exponer las credenciales**.
2. **Identifica los recursos del curso** filtrando por el prefijo **`webi-todo`** (p. ej.
   listar User Pools y quedarte con el que se llama `webi-todo`, su dominio `webi-todo-...` y
   su app client `webi-todo-spa`). Elimina **solo** lo que lleve ese prefijo, para no tocar
   otros recursos de la cuenta.
3. **Elimina con el AWS CLI** (misma superficie con la que se crearon, sin IaC): el **dominio**
   del Hosted UI, el **app client** y el **User Pool** (borrar el User Pool arrastra sus
   usuarios). El orden habitual es dominio → app client → User Pool.
4. **Confirma al terminar** qué se eliminó, de forma breve. Es una acción **destructiva**: si
   hay ambigüedad sobre qué borrar o aparecen recursos sin el prefijo, **confírmalo con el
   operador antes de eliminar**.

### Puertos de los servicios

Puertos fijos de este curso (para la regla de "verificar el puerto antes de arrancar" del
skill): **frontend `5173`**, **backend `3001`**, **MongoDB `27017`** (contenedor del
`docker-compose.yml`).
