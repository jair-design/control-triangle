---
code: CT-solution
type: knowledge-unit
title: "La solución — Webi Todo"
qualifiedName: "Módulo 01 · La solución"
prerequisites: [CT-M01-G04]
taxonomy: solution
key: webi-todo
solution: Webi Todo
initiative: n/a (solución independiente)
author: Manuel Lara
created: 2026-09-18
updated: 2026-09-21
status: drafting
language: es
---

# Webi Todo

> **⚠️ Importante — aclara toda palabra que no comprendas.** Al avanzar por este módulo, no pases
> por alto ningún término o tecnología que no entiendas. La dificultad para comprender un tema —o
> para aplicar una tecnología— siempre se origina en una **palabra malentendida** que quedó
> atrás: si sigues adelante después de un término que no comprendiste (técnico o del lenguaje
> común), lo más probable es que tampoco entiendas lo que viene después. Si en algún punto te
> quedas **en blanco** o sientes que no logras entender lo que estás leyendo, no fuerces el
> avance: **retrocede a buscar la palabra malentendida** y acláratela —con la metodología del
> [Módulo 01 (Comprender la solución)](code:CT-M01), usando la IA, o
> incluso con un diccionario para las palabras del lenguaje común—. Aclararla antes de continuar
> es lo que te devuelve la comprensión.

<!-- ku:objective code="solution-I01" title="Visión general" -->
<!-- ku:step kind="content" code="solution-I01-S01" delay="auto" -->

<!-- ku:message
**Al leer esta sección, asegúrate de haber aclarado y tener claros los siguientes términos:** Amazon Cognito, Express, Flujo Authorization Code, Hosted UI, microservicio, MongoDB, OpenID Connect (OIDC), PKCE, React, SPA, TypeScript y Vite. Si tienes dudas con alguno de ellos, acláralo con la metodología del [Módulo 01 — Comprender la solución](code:CT-M01) y vuelve a leer esta sección.
-->

## 1. Visión general

Webi Todo es una aplicación de gestión de tareas (tablero estilo kanban) que permite a un equipo organizar su trabajo en un flujo visual simple. La solución combina una SPA en React (con Vite) y un microservicio en Express + TypeScript, autenticados mediante Amazon Cognito como proveedor OpenID Connect. El usuario ingresa a través del Hosted UI de Cognito con usuario y contraseña —los usuarios son **precreados directamente en Cognito** por un administrador; la aplicación no gestiona registro— y una vez autenticado accede a un tablero con tres columnas (Pendiente, En progreso, Done) donde gestiona sus tareas.

Como solución, Webi Todo materializa la necesidad de negocio de gestionar tareas de forma visual y colaborativa en un conjunto concreto de decisiones y componentes implementables. Esto abarca: autenticación estándar y segura (Authorization Code + PKCE), mantenimiento de sesión en la SPA, un tablero interactivo con drag & drop y feedback visual, y un backend que valida el token antes de responder y persiste los datos en un servidor MongoDB. No existe base de datos de usuarios ni gestión de identidades propia: la responsabilidad de identidad recae por completo en Cognito.

El sistema es de usuario único a nivel de datos: no hay separación de información por compañía ni por usuario. La base de datos representa un único espacio de trabajo, de modo que cualquier usuario que se autentique accede exactamente a la misma información del tablero. Esto mantiene el alcance acotado a un espacio de trabajo compartido único.

<!-- /ku:step -->

<!-- /ku:objective -->

<!-- ku:objective code="solution-I02" title="Narrativa de la solución" -->
## 2. Narrativa de la solución

<!-- ku:step kind="content" code="solution-I02-S01" delay="auto" -->

### 2.1 Autenticación con Cognito

El punto de entrada de la aplicación es la autenticación. Cuando un usuario no autenticado abre la SPA, esta inicia el flujo OAuth2 Authorization Code con PKCE contra el Hosted UI de Cognito: genera un `code_verifier` y su `code_challenge`, y redirige al usuario al formulario de login que provee el propio Cognito. Los usuarios se autentican con **usuario y contraseña** contra el propio User Pool de Cognito. Los usuarios son **precreados directamente en Cognito** por un administrador (con su contraseña asignada); la aplicación no ofrece registro ni gestiona credenciales por su cuenta, solo consume el flujo de login que expone el Hosted UI.

Tras un login exitoso, Cognito redirige de vuelta a la SPA con un `authorization code`, que la aplicación intercambia (junto con el `code_verifier`) por el conjunto de tokens: **ID token, access token y refresh token**. La sesión del usuario (los tokens y la información derivada de ellos, como su nombre) se administra en un **store de MobX**, que persiste los tokens en **localStorage**. Esa persistencia es la que permite que, al recargar o navegar, la aplicación reconozca que el usuario ya tiene una sesión activa sin repetir el flujo de login. Cuando el access token se vence, la SPA usa el **refresh token** para obtener tokens nuevos de forma transparente, sin exigir un nuevo login manual, mientras el refresh token siga siendo válido.

La sesión ofrece siempre la acción de cerrar sesión (logout). El logout elimina los tokens de localStorage y **redirige al endpoint de logout de Cognito** para cerrar también la sesión en el proveedor, de forma que no quede "pegada" al último login. El objetivo explícito es que cada logout obligue a volver a autenticarse en el siguiente ciclo: no debe reutilizarse silenciosamente la última autenticación. Con esto se cierra completamente el ciclo autenticar → usar → salir → volver a autenticar.

> **Nota técnica**: El User Pool de Cognito se asume preexistente y configurado por el desarrollador, con los usuarios ya creados (ver Sección 3, Fuera de alcance, y Sección 6, Supuestos).

<!-- /ku:step -->

<!-- ku:step kind="content" code="solution-I02-S02" delay="auto" -->

<!-- ku:message
**Al leer esta sección, asegúrate de haber aclarado y tener claro el siguiente término:** logout de Cognito. Si tienes dudas, acláralo con la metodología del [Módulo 01 — Comprender la solución](code:CT-M01) y vuelve a leer esta sección.
-->

### 2.2 Shell autenticada y branding

Una vez autenticado, el usuario llega a una única pantalla que aloja toda la funcionalidad. El diseño es simple y está encabezado por un header persistente con el branding de la aplicación: un ícono y el nombre **Webi Todo**. En el mismo header se muestra la información del usuario logueado (por ejemplo, su nombre) y se ofrece la acción de cerrar sesión, que dispara el flujo de logout descrito en 2.1.

Este shell autenticado es el contenedor de la experiencia: por debajo del header se renderiza el tablero de tareas. No hay navegación entre múltiples vistas; la aplicación es esencialmente una sola pantalla funcional protegida por autenticación.

<!-- /ku:step -->

<!-- ku:step kind="content" code="solution-I02-S03" delay="auto" -->

<!-- ku:message
**Al leer esta sección, asegúrate de haber aclarado y tener claro el siguiente término:** CRUD. Si tienes dudas, acláralo con la metodología del [Módulo 01 — Comprender la solución](code:CT-M01) y vuelve a leer esta sección.
-->

### 2.3 Tablero y gestión de tareas

El cuerpo de la pantalla es un tablero con tres columnas que representan los estados de una tarea: **Pendiente**, **En progreso** y **Done**. Cada columna ofrece un botón "+" para agregar una nueva tarea; al crear una tarea desde una columna específica, esta nace con el estado correspondiente a esa columna.

Una tarea se compone de un título, una descripción y, opcionalmente, una fecha de vencimiento. Al crear o editar una tarea, el usuario captura estos campos y la tarjeta resultante aparece en la columna de su estado; asimismo, puede eliminar una tarjeta existente. Es decir, el tablero soporta las operaciones básicas de un CRUD sobre las tareas (crear, consultar, editar y eliminar). El tablero refleja en todo momento el conjunto de tareas existentes, agrupadas por estado, recuperadas desde el backend.

<!-- /ku:step -->

<!-- ku:step kind="content" code="solution-I02-S04" delay="auto" -->

### 2.4 Reordenamiento por drag & drop y feedback

La interacción principal del tablero es el arrastre de tarjetas (drag & drop). El usuario puede tomar una tarjeta y moverla de una columna a otra, cambiando así su estado. Además, puede soltarla en cualquier posición dentro de la columna destino: al inicio, al final o entre tarjetas existentes. Esto implica que el orden de las tarjetas dentro de cada columna es significativo y forma parte del estado que se persiste.

Cada movimiento efectivo va acompañado de feedback visual para el usuario —por ejemplo, una animación que confirma que la tarjeta "cayó" en su nueva posición y que el movimiento se aplicó. Esta retroalimentación es parte central de la experiencia de usuario esperada del tablero, no un detalle opcional.

<!-- /ku:step -->

<!-- ku:step kind="content" code="solution-I02-S05" delay="auto" -->

<!-- ku:message
**Al leer esta sección, asegúrate de haber aclarado y tener claros los siguientes términos:** access token, Amazon Cognito, Express, microservicio, modelo de persistencia, MongoDB, SPA y TypeScript. Si tienes dudas con alguno de ellos, acláralo con la metodología del [Módulo 01 — Comprender la solución](code:CT-M01) y vuelve a leer esta sección.
-->

### 2.5 Microservicio, persistencia y seguridad

Detrás de la SPA opera un microservicio en Express + TypeScript que expone las operaciones del tablero (crear, consultar, editar, eliminar y actualizar estado/posición de tareas). El microservicio interactúa con un servidor **MongoDB**. El modelo de datos representa el tablero y sus tareas —incluyendo estado y orden dentro de la columna— de forma que todos los cambios que el usuario realiza en la SPA persisten en Mongo y se recuperan desde Mongo al cargar la aplicación.

Toda respuesta del microservicio está protegida por validación de token. La SPA envía en cada petición el access token emitido por Cognito, y el backend lo valida antes de responder con cualquier información. Si el token es inválido o está ausente, la petición se rechaza. Es un nivel de seguridad básico pero suficiente para garantizar que el backend no confía ciegamente en el cliente y solo responde a peticiones autenticadas.

<!-- /ku:step -->

<!-- ku:step kind="content" code="solution-I02-S06" delay="auto" -->

<!-- ku:message
**Al leer esta sección, asegúrate de haber aclarado y tener claros los siguientes términos:** CORS, microservicio, React, SPA y Vite (y proxy de Vite). Si tienes dudas con alguno de ellos, acláralo con la metodología del [Módulo 01 — Comprender la solución](code:CT-M01) y vuelve a leer esta sección.
-->

### 2.6 Tooling e integración frontend

La SPA se construye con React sobre **Vite** como herramienta de build y servidor de desarrollo. Para la integración con el microservicio, el backend se expone a través del **proxy de Vite**: las llamadas desde el frontend se enrutan mediante el dev server hacia el microservicio, evitando la configuración de CORS y simplificando la ejecución e integración. De esta forma, frontend y backend se ejecutan de manera coordinada con mínima fricción.

<!-- /ku:step -->

<!-- /ku:objective -->

<!-- ku:objective code="solution-I03" title="Fuera de alcance" -->
<!-- ku:step kind="content" code="solution-I03-S01" delay="auto" -->

<!-- ku:message
**Al leer esta sección, asegúrate de haber aclarado y tener claros los siguientes términos:** Amazon Cognito, App client y cliente público, callback URLs y logout URLs, Hosted UI, scopes y User Pool. Si tienes dudas con alguno de ellos, acláralo con la metodología del [Módulo 01 — Comprender la solución](code:CT-M01) y vuelve a leer esta sección.
-->

## 3. Fuera de alcance

- **Despliegue e infraestructura**: El despliegue y la puesta en marcha de la infraestructura quedan fuera del alcance; la solución no los automatiza ni los gestiona.
- **Cognito preexistente**: La solución asume un User Pool de Cognito ya existente y configurado (dominio del Hosted UI, app client, callback/logout URLs, scopes), con los **usuarios precreados**. No se provee por defecto; es responsabilidad del desarrollador tenerlo listo antes de implementar el resto.
- **Base de datos de usuarios / gestión de identidades**: No se almacena ni administra información de usuarios; la identidad es responsabilidad exclusiva de Cognito. La aplicación no crea usuarios: se precrean directamente en Cognito.
- **Separación de datos por usuario**: No se requiere. Todos los usuarios autenticados comparten exactamente la misma información del tablero (espacio de trabajo único).

<!-- /ku:step -->

<!-- /ku:objective -->

<!-- ku:objective code="solution-I04" title="Contexto técnico" -->
<!-- ku:step kind="content" code="solution-I04-S01" delay="auto" -->

<!-- ku:message
**Al leer esta sección, asegúrate de haber aclarado y tener claros los siguientes términos:** Amazon Cognito, App client y cliente público, CORS, Express, Flujo Authorization Code, Hosted UI, ID token y access token, localStorage, logout de Cognito, microservicio, modelo de persistencia, MongoDB, OAuth2, OpenID Connect (OIDC), PKCE, React, refresh token, SPA, store y MobX, TypeScript, User Pool y Vite (y proxy de Vite). Si tienes dudas con alguno de ellos, acláralo con la metodología del [Módulo 01 — Comprender la solución](code:CT-M01) y vuelve a leer esta sección.
-->

## 4. Contexto técnico

**Stack tecnológico**
- **Frontend**: SPA en React con TypeScript, construida y servida con Vite (build + dev server). Gestión de estado con **MobX** (store de sesión y de tablero).
- **Backend**: Microservicio en Express + TypeScript.
- **Base de datos**: Servidor MongoDB.
- **Identidad**: Amazon Cognito como proveedor OpenID Connect, vía Hosted UI.

**Autenticación**
- Flujo OAuth2 **Authorization Code + PKCE** (cliente público / SPA), con `code_challenge`/`code_verifier` para una implementación segura y estándar.
- Hosted UI de Cognito con autenticación de **usuario y contraseña** contra el User Pool; los usuarios se **crean directamente en Cognito** (la app no ofrece registro).
- Sesión administrada en un **store de MobX** que persiste los tokens (**ID token, access token y refresh token**) en **localStorage**; al vencerse el access token, se renueva con el **refresh token** de forma transparente.
- **Logout contra el endpoint de logout de Cognito** para invalidar la sesión del proveedor y forzar re-autenticación en el siguiente ciclo.

**Seguridad del backend**
- La autenticación de la SPA devuelve el conjunto de tokens (ID token y access token).
- El microservicio autoriza sus llamadas con el **access token** (estándar OAuth2/OIDC para autorizar API), que valida en cada petición antes de responder.

**Integración y ejecución**
- El backend se expone a través del **proxy de Vite**, evitando CORS y simplificando la invocación desde el frontend.
- SPA, microservicio y servidor MongoDB desplegados y ejecutados de forma coordinada.

**Modelo de datos**
- Modela el tablero y sus tareas con estado (Pendiente / En progreso / Done) y **orden** dentro de cada columna.
- Persistencia y recuperación íntegra desde MongoDB.

**Precondiciones**
- User Pool de Cognito preexistente y correctamente configurado (ver Sección 6, Supuestos).

<!-- /ku:step -->

<!-- /ku:objective -->

<!-- ku:objective code="solution-I05" title="Criterios de aceptación" -->
<!-- ku:step kind="content" code="solution-I05-S01" delay="auto" -->

<!-- ku:message
**Al leer esta sección, asegúrate de haber aclarado y tener claros los siguientes términos:** Amazon Cognito, CORS, Express, Flujo Authorization Code, Hosted UI, ID token y access token, localStorage, logout de Cognito, microservicio, MongoDB, PKCE, refresh token, SPA, store y MobX, TypeScript, User Pool y Vite (y proxy de Vite). Si tienes dudas con alguno de ellos, acláralo con la metodología del [Módulo 01 — Comprender la solución](code:CT-M01) y vuelve a leer esta sección.
-->

## 5. Criterios de aceptación

### Autenticación con Cognito (2.1)
- Un usuario no autenticado que abre la SPA es redirigido al Hosted UI de Cognito.
- El login se realiza con usuario y contraseña contra el User Pool de Cognito (usuarios precreados).
- El flujo usa Authorization Code + PKCE (se genera `code_verifier`/`code_challenge` y se intercambia el `code` por tokens).
- Tras autenticarse, la SPA almacena el ID token, el access token y el refresh token en localStorage (vía el store de MobX) y reconoce al usuario como autenticado al recargar/navegar.
- Cuando el access token se vence, la sesión se renueva usando el refresh token sin requerir un nuevo login manual (mientras el refresh token sea válido).
- El logout elimina los tokens de localStorage y cierra la sesión en Cognito a través de su endpoint de logout.
- Después de un logout, el siguiente acceso obliga a autenticarse nuevamente (no se reutiliza la última sesión).

### Shell autenticada y branding (2.2)
- El header muestra el ícono y el nombre "Webi Todo".
- El header muestra la información del usuario logueado.
- El header ofrece la acción de cerrar sesión, que dispara el flujo de logout.
- La aplicación autenticada renderiza el tablero como vista principal única.

### Tablero y gestión de tareas (2.3)
- El tablero muestra tres columnas: Pendiente, En progreso y Done.
- Cada columna tiene un botón "+" para agregar una tarea.
- Una tarea creada desde una columna nace con el estado de esa columna.
- Una tarea permite capturar título, descripción y fecha de vencimiento (opcional).
- Se puede editar una tarjeta existente (título, descripción, estado, fecha de vencimiento).
- Se puede eliminar una tarjeta existente.
- El tablero muestra las tareas agrupadas por estado, recuperadas desde el backend.

### Reordenamiento por drag & drop y feedback (2.4)
- El usuario puede arrastrar una tarjeta de una columna a otra, cambiando su estado.
- El usuario puede soltar una tarjeta en cualquier posición de la columna destino (inicio, final o intermedio).
- El orden de las tarjetas dentro de cada columna se conserva y persiste.
- Cada movimiento efectivo muestra feedback visual (animación de confirmación).

### Microservicio, persistencia y seguridad (2.5)
- El microservicio (Express + TypeScript) expone operaciones para crear, consultar, editar, eliminar y actualizar tareas (estado y posición).
- Los cambios realizados en la SPA persisten en MongoDB y se recuperan desde MongoDB.
- El microservicio valida el token de Cognito antes de responder.
- Una petición sin token o con token inválido es rechazada.

### Tooling e integración frontend (2.6)
- La SPA se construye y sirve con Vite.
- Las peticiones al backend se enrutan a través del proxy de Vite sin necesidad de configurar CORS.

<!-- /ku:step -->

<!-- /ku:objective -->

<!-- ku:objective code="solution-I06" title="Riesgos y supuestos" -->
<!-- ku:step kind="content" code="solution-I06-S01" delay="auto" -->

<!-- ku:message
**Al leer esta sección, asegúrate de haber aclarado y tener claros los siguientes términos:** Amazon Cognito, App client y cliente público, callback URLs y logout URLs, Hosted UI, logout de Cognito, microservicio, MongoDB, scopes, SPA y User Pool. Si tienes dudas con alguno de ellos, acláralo con la metodología del [Módulo 01 — Comprender la solución](code:CT-M01) y vuelve a leer esta sección.
-->

## 6. Riesgos y supuestos

### Supuestos

- **User Pool de Cognito preexistente**: Existe y está configurado un User Pool con Hosted UI, app client (cliente público SPA), y las callback/logout URLs y scopes necesarios.
- **Usuarios precreados**: Los usuarios existen en el User Pool, creados por un administrador con su contraseña asignada. La aplicación no ofrece registro.
- **Servidor MongoDB disponible**: Existe una instancia de MongoDB accesible para el microservicio.
- **Usuario único a nivel de datos**: No se requiere aislamiento de datos; todos los usuarios ven la misma información.
- **Componentes desplegables en conjunto**: SPA, microservicio y servidor MongoDB pueden desplegarse y ejecutarse de forma coordinada.

### Riesgos

- **Configuración de Cognito**: La solución depende de una configuración externa correcta. Mitigado documentándola como precondición explícita y verificándola antes de implementar.
- **Logout e invalidación de sesión en Cognito**: Cerrar correctamente la sesión del proveedor (endpoint de logout, callback/logout URLs) puede tener sutilezas. Mitigado validando el ciclo completo login → logout → re-login como criterio de aceptación.
- **Orden en drag & drop**: Persistir posiciones arbitrarias (inserciones intermedias) requiere una estrategia de ordenamiento estable en el modelo de datos. Mitigado modelando explícitamente el orden dentro de cada columna.

<!-- /ku:step -->

<!-- /ku:objective -->

<!-- ku:objective code="solution-I07" title="Slices" -->
<!-- ku:step kind="content" code="solution-I07-S01" delay="auto" -->

<!-- ku:message
**Al leer esta sección, asegúrate de haber aclarado y tener claros los siguientes términos:** CORS, endpoint, Express, microservicio, React, SPA, store y MobX, TypeScript y Vite (y proxy de Vite). Si tienes dudas con alguno de ellos, acláralo con la metodología del [Módulo 01 — Comprender la solución](code:CT-M01) y vuelve a leer esta sección.
-->

## 7. Slices
> *Unidades mínimas desplegables derivadas de la Narrativa de la Solución (Sección 2).*
### Índice

| # | Slice | Objetivo | Estimación manual | Estimación con IA | Estado |
|---|-------|----------|------|------|--------|
| 01 | [Scaffolding](#slice-01-scaffolding-proyecto-microservicio-proxy-tema-base-shell-branding) | Andamiaje ejecutable con base visual, shell y branding | 1-2d | 0.5-1 h | definido |
| 02 | [Login System](#slice-02-login-system) | Ciclo completo de autenticación + info de usuario y logout en el header | 2-3d | 1-2 h | definido |
| 03 | [CRUD de tareas en el tablero Kanban](#slice-03-crud-de-tareas-en-el-tablero-kanban) | Gestión completa de tareas (UI + endpoints + Mongo + validación de token) | 3-4d | 2-3 h | definido |
| 04 | [Drag & drop, reordenamiento y feedback](#slice-04-drag-drop-reordenamiento-y-feedback) | Perfeccionamiento de la UX del tablero | 2-3d | 1-2 h | definido |
| | | **Total** | **~8-12d** | **~4-8 h** | |

### Slice 01: Scaffolding (proyecto + microservicio + proxy + tema base + shell/branding)

| Campo | Contenido |
|-------|-----------|
| **Objetivo** | Levantar el andamiaje completo y ejecutable de la solución: SPA React+Vite+TS que arranca con su shell básico y branding "Webi Todo", el store base de estado (MobX) integrado en la app, un microservicio Express+TS estructurado, el proxy de Vite enrutando al backend sin CORS, y un tema base que da fundamento visual al resto de slices |
| **Flujo** | `npm create vite` (React+TS) → app arranca con shell básico (header con branding "Webi Todo" + layout de una sola pantalla) → tema base aplicado → store de MobX inicializado y provisto a la app (raíz de estado para slices posteriores) → microservicio Express+TS con endpoint de salud → proxy de Vite apunta al microservicio → llamada de prueba desde la SPA llega al backend |
| **Cobertura** | • 2.6: SPA con Vite (build + dev server) y proxy hacia el microservicio, sin CORS<br>• 2.5 (parcial): esqueleto del microservicio Express + TypeScript (sin lógica de tareas ni validación de token)<br>• 2.2 (parcial): header con branding "Webi Todo" (ícono + nombre) y shell de una sola pantalla que alojará el tablero<br>• *Base arquitectural*: store de estado (MobX) inicializado, listo para alojar sesión (Slice 02) y tablero (Slice 03+)<br>• *Scope añadido*: tema base (no pedido por la narrativa) |
| **Contexto** | Vite como build + dev server; Express + TS; proxy de Vite evita CORS; store de MobX como base de gestión de estado de la SPA; tema base + shell/branding como fundamento visual para materializar la UI de slices posteriores (info de usuario, tablero, tarjetas) |
| **Estimación manual** | 1-2d |
| **Estimación con IA** | 0.5-1 h |
| **Dependencias** | — |
| **Fuera de alcance** | Autenticación e info de usuario/logout en el header (Slice 02); validación de token (Slice 03); modelo/CRUD de tareas (Slice 03); UI del tablero (Slice 03+) |
| **Notas** | El tema base y el shell/branding básico son extensión de alcance intencional (curso demo) para tener consistencia visual desde el inicio. El shell nace sin las piezas de auth; esas llegan en el Slice 02. |

**Criterios de aceptación**:
- [ ] `npm run dev` levanta la SPA React+TS y arranca con el shell básico visible.
- [ ] El header muestra el branding "Webi Todo" (ícono + nombre).
- [ ] El tema base está definido y aplicado (tokens/estilos base disponibles para el resto de la app).
- [ ] El store de MobX está inicializado y provisto a la app (raíz de estado disponible para el resto de slices).
- [ ] El microservicio Express+TS arranca y expone un endpoint de salud (p. ej. `/health`).
- [ ] Una petición desde la SPA se enruta por el proxy de Vite al microservicio sin configurar CORS.

<!-- /ku:step -->

<!-- ku:step kind="content" code="solution-I07-S02" delay="auto" -->

<!-- ku:message
**Al leer esta sección, asegúrate de haber aclarado y tener claros los siguientes términos:** Amazon Cognito, Flujo Authorization Code, Hosted UI, ID token y access token, localStorage, logout de Cognito, OAuth2, PKCE, refresh token, SPA, store y MobX, y User Pool. Si tienes dudas con alguno de ellos, acláralo con la metodología del [Módulo 01 — Comprender la solución](code:CT-M01) y vuelve a leer esta sección.
-->

### Slice 02: Login System

| Campo | Contenido |
|-------|-----------|
| **Objetivo** | Entregar el ciclo completo de autenticación: el usuario entra con usuario y contraseña vía Hosted UI de Cognito (Authorization Code + PKCE), la SPA administra la sesión en un store de MobX (tokens persistidos en localStorage, renovación con refresh token), muestra la info del usuario autenticado en el header y puede cerrar sesión forzando re-autenticación |
| **Flujo** | (Precondición: Cognito configurado, usuarios precreados) Usuario no autenticado → SPA genera `code_verifier`/`code_challenge` → redirige al Hosted UI de Cognito → login con usuario y contraseña → Cognito devuelve `authorization code` → SPA intercambia code + verifier por tokens (ID + access + refresh) → guarda los tokens en el store de MobX (persistido en localStorage) → reconoce sesión (persiste al recargar) → al vencer el access token, renueva con el refresh token → muestra info del usuario en el header → logout limpia el store/localStorage + cierra la sesión en Cognito (endpoint de logout) → siguiente acceso re-autentica |
| **Cobertura** | • 2.1: login PKCE, intercambio de code, sesión en store de MobX (tokens en localStorage), renovación con refresh token<br>• 2.1: logout + cierre de sesión en Cognito<br>• 2.2 (parcial): mostrar la info del usuario logueado en el header + acción de logout en el header |
| **Contexto** | OAuth2 Authorization Code + PKCE (cliente público/SPA); Hosted UI de Cognito con autenticación de usuario y contraseña (usuarios creados directamente en Cognito); tokens (ID + access + refresh) administrados en un store de MobX y persistidos en localStorage, con renovación vía refresh token al vencerse el access token; logout contra el endpoint de logout de Cognito para invalidar la sesión del proveedor; Cognito asumido preexistente y configurado (Supuestos) |
| **Estimación manual** | 2-3d |
| **Estimación con IA** | 1-2 h |
| **Dependencias** | 01 |
| **Fuera de alcance** | Validación del token en el backend (Slice 03); branding "Webi Todo" y layout del shell (Slice 01); tablero y CRUD (Slice 03+) |
| **Notas** | Verificar el ciclo completo login → logout → re-login (riesgo señalado en Sección 6). La configuración de Cognito queda como precondición fuera del slice. |

**Criterios de aceptación**:
- [ ] Un usuario no autenticado que abre la SPA es redirigido al Hosted UI de Cognito.
- [ ] El login se realiza con usuario y contraseña contra el User Pool de Cognito (usuarios precreados).
- [ ] El flujo usa Authorization Code + PKCE (se genera `code_verifier`/`code_challenge` y se intercambia el `code` por tokens).
- [ ] La SPA administra la sesión en un store de MobX, almacena el ID token, el access token y el refresh token en localStorage y reconoce la sesión al recargar/navegar.
- [ ] Cuando el access token se vence, la sesión se renueva usando el refresh token sin requerir login manual.
- [ ] El header muestra la información del usuario autenticado y ofrece la acción de logout.
- [ ] El logout limpia los tokens de localStorage y cierra la sesión en Cognito a través de su endpoint de logout.
- [ ] Tras el logout, el siguiente acceso obliga a re-autenticarse.

<!-- /ku:step -->

<!-- ku:step kind="content" code="solution-I07-S03" delay="auto" -->

<!-- ku:message
**Al leer esta sección, asegúrate de haber aclarado y tener claros los siguientes términos:** Amazon Cognito, CRUD, endpoint, Express, ID token y access token, microservicio, MongoDB, store y MobX, TypeScript y Vite (y proxy de Vite). Si tienes dudas con alguno de ellos, acláralo con la metodología del [Módulo 01 — Comprender la solución](code:CT-M01) y vuelve a leer esta sección.
-->

### Slice 03: CRUD de tareas en el tablero Kanban

| Campo | Contenido |
|-------|-----------|
| **Objetivo** | Entregar la gestión completa de tareas desde el tablero: el usuario ve las tres columnas con sus tarjetas, crea tareas por columna, edita sus detalles y las elimina, con todo persistido en MongoDB a través de endpoints del microservicio protegidos por validación de token |
| **Flujo** | Tablero renderiza 3 columnas (Pendiente/En progreso/Done) con tareas recuperadas del backend → botón "+" por columna abre formulario de creación → al crear, la tarea nace con el estado de esa columna y se coloca al final de la cola → editar tarjeta permite modificar título, descripción, estado y fecha de vencimiento → eliminar tarjeta la quita → cada operación llama a un endpoint del microservicio (validado con access token) que persiste/recupera en MongoDB |
| **Cobertura** | • 2.3: tres columnas, botón "+" por columna, alta con el estado de la columna, campos título/descripción/fecha de vencimiento (+ estado en edición), tablero agrupado por estado desde el backend<br>• 2.5: endpoints Express+TS para crear/consultar/editar/eliminar, persistencia en MongoDB con modelo de estado y orden (append al final), validación de access token en cada endpoint |
| **Contexto** | Express + TS; MongoDB; modelo de tarea con estado y campo de orden (creación = final de la columna); estado del tablero (tareas por columna) administrado en el store de MobX; cada endpoint valida el access token de Cognito antes de responder; peticiones enrutadas por el proxy de Vite |
| **Estimación manual** | 3-4d |
| **Estimación con IA** | 2-3 h |
| **Dependencias** | 01, 02 |
| **Fuera de alcance** | Drag & drop, reordenamiento arbitrario dentro/entre columnas y feedback visual (Slice 04) |
| **Notas** | El modelo ya incluye el campo de orden (semántica "append al final") para que el Slice 04 solo agregue posicionamiento arbitrario. Cambiar el estado vía formulario de edición es válido; el cambio por arrastre es del Slice 04. Slice grande (límite superior de 3 días); podría partirse backend/UI si se requiere. |

**Criterios de aceptación**:
- [ ] El tablero muestra tres columnas: Pendiente, En progreso y Done.
- [ ] Cada columna tiene un botón "+" que abre un formulario de creación.
- [ ] Una tarea creada desde una columna nace con el estado de esa columna y aparece al final de la cola de esa columna.
- [ ] El formulario permite capturar título, descripción y fecha de vencimiento (opcional).
- [ ] Se puede editar una tarjeta existente (título, descripción, estado, fecha de vencimiento).
- [ ] Se puede eliminar una tarjeta existente.
- [ ] El tablero muestra las tareas agrupadas por estado, recuperadas desde el backend.
- [ ] El microservicio expone endpoints para crear, consultar, editar y eliminar, y los cambios persisten en MongoDB.
- [ ] Cada endpoint valida el access token de Cognito; una petición sin token o con token inválido es rechazada.

<!-- /ku:step -->

<!-- ku:step kind="content" code="solution-I07-S04" delay="auto" -->

<!-- ku:message
**Al leer esta sección, asegúrate de haber aclarado y tener claros los siguientes términos:** endpoint y modelo de persistencia. Si tienes dudas con alguno de ellos, acláralo con la metodología del [Módulo 01 — Comprender la solución](code:CT-M01) y vuelve a leer esta sección.
-->

### Slice 04: Drag & drop, reordenamiento y feedback

| Campo | Contenido |
|-------|-----------|
| **Objetivo** | Perfeccionar la experiencia del tablero: el usuario arrastra tarjetas entre columnas (cambiando su estado) y dentro de una columna a cualquier posición, con el orden persistido y feedback visual que confirma cada movimiento |
| **Flujo** | Usuario toma una tarjeta → la arrastra a otra columna (cambia estado) o a otra posición dentro de la misma columna (inicio/final/intermedia) → al soltar, se aplica el cambio de estado/posición → se persiste el nuevo orden vía endpoint → animación/feedback confirma que la tarjeta "cayó" en su lugar |
| **Cobertura** | • 2.4: arrastre entre columnas (cambio de estado), soltar en cualquier posición de la columna destino, orden significativo que se conserva y persiste, feedback visual de cada movimiento |
| **Contexto** | Reutiliza el modelo de orden del Slice 03, extendiéndolo a posiciones arbitrarias (inserciones intermedias) con estrategia de ordenamiento estable; persistencia del estado + posición vía endpoints validados |
| **Estimación manual** | 2-3d |
| **Estimación con IA** | 1-2 h |
| **Dependencias** | 03 |
| **Fuera de alcance** | — |
| **Notas** | Riesgo señalado en Sección 6: persistir posiciones arbitrarias requiere ordenamiento estable en el modelo. El feedback visual es parte central de la UX esperada, no opcional. |

**Criterios de aceptación**:
- [ ] El usuario puede arrastrar una tarjeta de una columna a otra, cambiando su estado.
- [ ] El usuario puede soltar una tarjeta en cualquier posición de la columna destino (inicio, final o intermedio).
- [ ] El orden de las tarjetas dentro de cada columna se conserva y persiste en el backend.
- [ ] Cada movimiento efectivo muestra feedback visual (animación de confirmación).

<!-- /ku:step -->

<!-- /ku:objective -->
