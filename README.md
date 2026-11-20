# GameHub IPVG

Plataforma web para organizar los torneos internos de videojuegos y eSports del Instituto Profesional Virginio Gómez (sede Chillán). Evaluación final de *Lenguaje de Programación Web II* (2026).

**Integrantes:** Javier Suarez (`javier-suarez-cloud`) y Fabián Díaz (`Talisk1`).

## Resumen

**Problema que resuelve y arquitectura.** Antes todo se coordinaba de forma informal, lo que hacía difícil controlar cupos, evitar inscripciones duplicadas, llevar resultados oficiales y mantener un ranking claro. El sistema ordena el flujo completo: registro de usuarios, creación de equipos, inscripción a torneos, programación de partidos, registro de resultados y cálculo del ranking solo a partir de resultados oficiales (3 puntos por victoria, 1 por empate; sin empates en eliminación).

* **Frontend (`frontend/`):** SPA en Vue 3 + Vite (puerto `5173`), Vue Router con guardia de sesión, vistas, componentes reutilizables (`TorneoCard`, `PartidoCard`) y llamadas a la API con `fetch()` enviando el JWT en `Authorization: Bearer`.
* **Backend (`backend/`):** API REST en NestJS 11 (puerto `3000`, Swagger en `/api`) dividida en módulos (`auth`, `usuarios`, `equipos`, `torneos`, `inscripciones`, `partidos`, `resultados`) con controller, service, DTO y entidad, más `ValidationPipe` global, CORS y `AuthGuard` / `RolesGuard` (`@Roles('admin')`).
* **Base de datos:** MySQL 8 con TypeORM 0.3 (`gamehub_db`) y `synchronize: true` en desarrollo.

**Modelo de datos, roles y reglas.** Las entidades principales son `Usuario`, `Equipo` (capitán `ManyToOne` e integrantes `ManyToMany` en `equipo_integrantes`), `Torneo` (`liga` o `eliminacion`, fechas, cupo y estado), `Inscripcion` (única por torneo y equipo con `@Unique`), `Partido` y `Resultado` (`OneToOne` con `Partido`, ganador o `null` en empate). El ranking se calcula en el servicio (`resultados.service.ts`), no se guarda en tabla. Los permisos distinguen entre visitante, estudiante, capitán de equipo y administrador, validándose en el backend (`401` sin sesión válida, `403` sin rol/permiso, `404` si no existe el recurso, `409` en duplicados y `400` en reglas de negocio como cupo lleno, inscripción fuera de plazo, empate en eliminación o partido entre el mismo equipo / equipo no inscrito).

**Organización.** Trabajamos entre el 16 y el 20 de noviembre de 2026 con ramas por tarea (`javier/...`, `fabian/...`) desde `main`, Pull Requests con revisión mutua, merge commit y tablero Kanban en GitHub. Javier se encargó principalmente de la base del backend, autenticación, torneos, inscripciones, Swagger, seed y README; Fabián de la base del frontend, equipos, partidos, resultados/ranking y pruebas. Probamos de forma manual los flujos de login, permisos, filtros, errores de validación/negocio, persistencia al reiniciar la API y caída del backend; las pruebas automáticas con Jest (`npm test` en `backend/`) están a cargo de Fabián.

El detalle de cada punto pedido por la evaluación está a continuación.

---

## 1. Problema que resuelve

Hoy las inscripciones, equipos, enfrentamientos y resultados de los torneos internos se coordinan de manera informal. Eso dificulta controlar los cupos, evitar inscripciones duplicadas, registrar resultados oficiales y mantener un ranking al día.

GameHub permite que los estudiantes se registren, formen equipos y se inscriban en torneos, y que el administrador cree torneos, gestione inscripciones, programe partidos y registre resultados. El ranking se calcula solo a partir de los resultados oficiales.

## 2. Integrantes

| Integrante | GitHub |
|---|---|
| Javier Suarez | [javier-suarez-cloud](https://github.com/javier-suarez-cloud) |
| Fabián Díaz | [Talisk1](https://github.com/Talisk1) |

## 3. Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | Vue 3 + Vite, Vue Router, `fetch()` |
| Backend | NestJS 11, class-validator, JWT (`jsonwebtoken`), `bcryptjs` |
| Base de datos | MySQL 8 con TypeORM 0.3 |
| Documentación | Swagger (`@nestjs/swagger`) en `/api` |
| Pruebas | Pruebas manuales documentadas y Jest (backend) |
| Proceso | Git, GitHub (ramas, Pull Requests), Kanban en GitHub Projects |

## 4. Arquitectura

```
Navegador (Vue 3, puerto 5173)
   │  HTTP + JSON con fetch() · token en el encabezado Authorization: Bearer
   ▼
API REST (NestJS, puerto 3000) · Swagger en /api
   │  Controller → Service (reglas de negocio) → Repository de TypeORM
   ▼
MySQL (base gamehub_db)
```

- **Frontend (`frontend/`)**: SPA con vistas por pantalla (`views/`), componentes reutilizables (`components/`, por ejemplo `TorneoCard` y `PartidoCard` con props y emit), router con rutas dinámicas y guardia de sesión (`router/index.js`) y servicios (`services/api.js` para la API, `services/sesion.js` para el token).
- **Backend (`backend/`)**: un módulo por recurso (`auth`, `usuarios`, `equipos`, `torneos`, `inscripciones`, `partidos`, `resultados`), cada uno con controller, service, DTO y entidad. `main.ts` activa el `ValidationPipe` global, CORS y Swagger.

## 5. Modelo de datos y relaciones

| Entidad | Campos principales | Relaciones |
|---|---|---|
| Usuario | nombre, alias, correo (único), password (encriptada, `select: false`), rol, activo | Integrante de muchos equipos |
| Equipo | nombre (único), juegoPreferido, estado | Capitán: ManyToOne Usuario · Integrantes: ManyToMany Usuario (tabla `equipo_integrantes`) |
| Torneo | nombre, videojuego, modalidad (`liga` o `eliminacion`), fechaInicio, cierreInscripcion, cupoMaximo, estado | OneToMany inscripciones y partidos |
| Inscripcion | fecha, estado (`aceptada` o `rechazada`) | ManyToOne Torneo y ManyToOne Equipo · `@Unique(torneo, equipo)` |
| Partido | fechaHora, ronda, estado (`programado` o `jugado`) | ManyToOne Torneo · equipoLocal y equipoVisitante: ManyToOne Equipo |
| Resultado | puntajeLocal, puntajeVisitante | OneToOne Partido · ganador: ManyToOne Equipo (`null` = empate) · registradoPor: ManyToOne Usuario |

Relaciones pedidas por el enunciado: Usuario → Equipo, Equipo ↔ Torneo mediante Inscripcion, y Torneo → Partido → Resultado. El ranking no se guarda en ninguna tabla: se calcula con los resultados oficiales.

## 6. Roles y permisos

| Acción | Visitante | Estudiante | Capitán del equipo | Administrador |
|---|:-:|:-:|:-:|:-:|
| Ver torneos, equipos, partidos y ranking | ✅ | ✅ | ✅ | ✅ |
| Registrarse, iniciar sesión, editar su perfil | ✅ | ✅ | ✅ | ✅ |
| Crear un equipo (queda como capitán) | | ✅ | ✅ | ✅ |
| Editar o eliminar un equipo, sumar o quitar integrantes | | | ✅ | ✅ |
| Inscribir o cancelar la inscripción de su equipo | | | ✅ | ✅ |
| Crear, editar y eliminar torneos | | | | ✅ |
| Aceptar o rechazar inscripciones | | | | ✅ |
| Programar partidos y registrar resultados | | | | ✅ |
| Ver la lista de usuarios | | | | ✅ |

El backend lo controla con `AuthGuard` (token JWT, responde 401) y `RolesGuard` + `@Roles('admin')` (responde 403). En equipos e inscripciones, el service revisa además que el usuario sea el capitán. El frontend oculta botones y protege rutas, pero la seguridad real está en el backend.

## 7. Instalación y ejecución

Requisitos: Node.js 22 o superior, MySQL 8 encendido.

### Backend

```bash
cd backend
npm install
cp .env.example .env        # en PowerShell: Copy-Item .env.example .env
# editar .env: contraseña de MySQL y JWT_SECRET
npm run seed                # opcional: carga datos de prueba (borra los datos actuales)
npm start                   # API en http://localhost:3000 · Swagger en http://localhost:3000/api
```

### Frontend

```bash
cd frontend
npm install
npm run dev                 # app en http://localhost:5173
```

### Usuarios de prueba (después de `npm run seed`)

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | admin@ipvg.cl | Admin123 |
| Estudiante (capitán de Los Pumas) | javier@ipvg.cl | Estudiante123 |
| Estudiante (capitán de Halcones IPVG) | fabian@ipvg.cl | Estudiante123 |

El seed carga 7 usuarios, 5 equipos, 3 torneos (uno en liga abierto, uno de eliminación en curso y uno sin inscritos), 6 inscripciones (una rechazada), 4 partidos y 3 resultados (uno empatado).

## 8. Configuración de MySQL

```sql
CREATE DATABASE gamehub_db;
```

No hay que crear tablas a mano: TypeORM las crea al arrancar con `synchronize: true` (solo para desarrollo). La conexión está en `backend/src/app.module.ts` y toma los datos del `.env`.

### Consultas SQL de verificación (resultado real con el seed)

```sql
-- Cantidad de registros por tabla
SELECT (SELECT COUNT(*) FROM usuario) usuarios, (SELECT COUNT(*) FROM equipo) equipos,
       (SELECT COUNT(*) FROM torneo) torneos, (SELECT COUNT(*) FROM inscripcion) inscripciones,
       (SELECT COUNT(*) FROM partido) partidos, (SELECT COUNT(*) FROM resultado) resultados;
-- 7 | 5 | 3 | 6 | 4 | 3

-- Equipos inscritos por torneo
SELECT t.nombre AS torneo, e.nombre AS equipo, i.estado
FROM inscripcion i JOIN torneo t ON t.id = i.torneoId JOIN equipo e ON e.id = i.equipoId
ORDER BY t.id, e.nombre;
-- Copa FIFA IPVG 2026: Halcones IPVG, Los Pumas, Ñuble Esports (aceptadas)
-- Liga LoL Primavera: Dragones del Sur, Nexus Chillán (aceptadas), Ñuble Esports (rechazada)

-- Partidos con su resultado y ganador (NULL = empate o aún no se juega)
SELECT p.id, l.nombre AS local, v.nombre AS visitante, r.puntajeLocal, r.puntajeVisitante, g.nombre AS ganador
FROM partido p JOIN equipo l ON l.id = p.equipoLocalId JOIN equipo v ON v.id = p.equipoVisitanteId
LEFT JOIN resultado r ON r.partidoId = p.id LEFT JOIN equipo g ON g.id = r.ganadorId ORDER BY p.id;
-- 1 Los Pumas 2-1 Halcones IPVG → Los Pumas · 2 Halcones IPVG 1-1 Ñuble Esports → NULL (empate)
-- 3 Los Pumas vs Ñuble Esports → sin resultado · 4 Dragones del Sur 2-0 Nexus Chillán → Dragones del Sur

-- Las contraseñas se guardan encriptadas con bcrypt
SELECT correo, rol, LEFT(password, 7) AS inicio_hash FROM usuario LIMIT 3;
-- admin@ipvg.cl admin $2b$10$ · javier@ipvg.cl estudiante $2b$10$ · ...
```

## 9. Variables de entorno (`backend/.env.example`)

| Variable | Ejemplo | Para qué sirve |
|---|---|---|
| `DB_HOST` | `localhost` | Servidor de MySQL |
| `DB_PORT` | `3306` | Puerto de MySQL |
| `DB_USER` | `root` | Usuario de MySQL |
| `DB_PASSWORD` | (vacío en el ejemplo) | Contraseña de MySQL |
| `DB_NAME` | `gamehub_db` | Base de datos del proyecto |
| `JWT_SECRET` | (vacío en el ejemplo) | Clave para firmar los tokens |
| `PORT` | `3000` | Puerto de la API |

El archivo `.env` real está en `.gitignore` y nunca se sube al repositorio.

## 10. Principales endpoints

| Método y ruta | Acceso | Descripción |
|---|---|---|
| `POST /auth/registro` | Público | Crea una cuenta de estudiante |
| `POST /auth/login` | Público | Devuelve el token JWT (2 horas) |
| `GET` / `PATCH /auth/perfil` | Con sesión | Ver y editar nombre y alias |
| `GET /usuarios` | Admin | Lista de usuarios |
| `GET /equipos?buscar=` | Público | Listado con búsqueda por nombre |
| `GET /equipos/:id` | Público | Detalle con capitán e integrantes |
| `POST /equipos` | Con sesión | Crear equipo (queda de capitán) |
| `PATCH` / `DELETE /equipos/:id` | Capitán o admin | Editar o eliminar |
| `POST` / `DELETE /equipos/:id/integrantes` | Capitán o admin | Sumar o quitar integrantes |
| `GET /torneos?buscar=&videojuego=&estado=&modalidad=` | Público | Listado con filtros combinables |
| `GET /torneos/:id` | Público | Detalle |
| `POST` / `PATCH` / `DELETE /torneos` | Admin | Crear, editar, eliminar |
| `GET /inscripciones?torneoId=` | Público | Inscritos de un torneo |
| `POST /inscripciones` | Capitán o admin | Inscribir equipo (reglas de negocio) |
| `PATCH /inscripciones/:id` | Admin | Aceptar o rechazar |
| `DELETE /inscripciones/:id` | Capitán o admin | Cancelar inscripción |
| `GET /partidos?torneoId=&estado=` | Público | Calendario con filtros |
| `GET /partidos/:id` | Público | Detalle con su resultado |
| `POST` / `PATCH` / `DELETE /partidos` | Admin | Programar, reprogramar, eliminar |
| `GET /resultados?torneoId=` | Público | Resultados oficiales |
| `POST` / `PATCH` / `DELETE /resultados` | Admin | Registrar, corregir o anular resultado |
| `GET /ranking?torneoId=` | Público | Tabla de posiciones calculada |

### Reglas de negocio implementadas

| Regla | Dónde | Respuesta si no se cumple |
|---|---|---|
| Un equipo no se inscribe dos veces en el mismo torneo | `inscripciones.service.ts` + `@Unique` | 409 |
| No se supera el cupo máximo del torneo | `inscripciones.service.ts` (`validarCupo`) | 400 |
| No se inscribe con el período cerrado | `inscripciones.service.ts` | 400 |
| Un partido enfrenta a dos equipos distintos inscritos en el mismo torneo | `partidos.service.ts` | 400 |
| Un resultado solo se registra para un partido existente, una sola vez | `resultados.service.ts` | 404 / 409 |
| En eliminación no hay empate; en liga sí | `resultados.service.ts` (`calcularGanador`) | 400 |
| El ranking se calcula con los resultados (victoria 3, empate 1) | `resultados.service.ts` (`ranking`) | — |
| Operaciones protegidas requieren sesión y rol | `AuthGuard`, `RolesGuard` | 401 / 403 |
| Recurso inexistente | services (`NotFoundException`) | 404 |

## 11. Swagger

Con la API encendida, abrir **http://localhost:3000/api**.

- Los endpoints están agrupados por recurso: Autenticación, Usuarios, Equipos, Torneos, Inscripciones, Partidos, Resultados y Ranking.
- Cada operación muestra el método HTTP, la ruta y los datos que recibe (los DTO se documentan con el plugin de Swagger configurado en `nest-cli.json`).
- Las rutas con candado requieren token. Para probarlas: ejecutar `POST /auth/login`, copiar el `token`, presionar **Authorize**, pegar el token y usar **Try it out**.

## 12. Metodología Kanban y distribución del trabajo

Tablero: [GameHub Kanban](https://github.com/users/javier-suarez-cloud/projects/2) con las columnas **Pendiente → En proceso → Terminado**. Cada tarea es un issue con responsable, y se cierra sola al integrar su Pull Request (`Closes #N`).

| Issue | Tarea | Responsable | Pull Request |
|---|---|---|---|
| #1 | Backend base: NestJS, MySQL, `.env.example`, 6 entidades | Javier | #12 |
| #2 | Frontend base: Vue, Vue Router, menú, servicio de API | Fabián | #13 |
| #3 | Autenticación: registro, login JWT, guards y roles (back y front) | Javier | #14, #16 |
| #4 | Torneos: CRUD con búsqueda y filtros (back y front) | Javier | #16, #17 |
| #5 | Inscripciones y reglas de negocio (back y front) | Javier | #17 |
| #6 | Equipos: capitán e integrantes (back y front) | Fabián | #15 |
| #7 | Partidos entre equipos inscritos (back y front) | Fabián | #18 |
| #8 | Resultados oficiales y ranking calculado (back y front) | Fabián | #18 |
| #9 | Swagger y datos de prueba (seed) | Javier | PR del día 5 |
| #10 | Pruebas automáticas y manuales | Fabián | PR del día 5 |
| #11 | README, bitácora y declaración de IA | Ambos | PR del día 5 |

**Flujo de trabajo:** cada tarea en su propia rama (`javier/...`, `fabian/...`) creada desde `main` actualizado → commits → Pull Request hacia `main` → revisión y aprobación del compañero → merge con *Create a merge commit* (para conservar el historial de cada integrante). Nadie trabajó directo en `main`.

### Bitácora

| Día | Avance |
|---|---|
| Lun 16-nov | Planificación: repositorio, Kanban e issues. Base del backend (Javier) y del frontend (Fabián) |
| Mar 17-nov | Autenticación con JWT, guards y roles (Javier) |
| Mié 18-nov | Login, registro, perfil y rutas protegidas en Vue + torneos backend (Javier). Equipos completo (Fabián). Se unificó el diseño con el de las actividades del curso |
| Jue 19-nov | Torneos en Vue + inscripciones con reglas (Javier). La revisión de Fabián detectó la validación de `torneoId` |
| Vie 20-nov | Partidos, resultados y ranking (Fabián). Swagger, seed y README (Javier). Pruebas automáticas (Fabián) |

## 13. Aportes de cada integrante

| Javier Suarez | Fabián Díaz |
|---|---|
| Proyecto NestJS, conexión MySQL y las 6 entidades | Proyecto Vue, Vue Router, menú y `api.js` |
| Autenticación: registro, login, perfil, `AuthGuard`, `@Roles` y `RolesGuard` | Equipos: CRUD, capitán, integrantes y permisos (back y front) |
| Login, registro, perfil y guardia de rutas en Vue; diseño común | Partidos: programación entre equipos inscritos (back y front) |
| Torneos (back y front) con filtros y el componente `TorneoCard` | Resultados oficiales y ranking calculado (back y front), componente `PartidoCard` |
| Inscripciones con todas sus reglas de negocio | Pruebas automáticas con Jest y pruebas manuales |
| Swagger, seed y README | Revisión de los PR de Javier (observación de `torneoId` en el #17) |

## 14. Pruebas realizadas

### Pruebas manuales

| Prueba | Resultado esperado | Resultado |
|---|---|---|
| Login con datos correctos / contraseña incorrecta | 200 con token / 401 "Correo o contraseña incorrectos" | ✅ |
| Registro con correo repetido | 409 | ✅ |
| Registro enviando `rol: "admin"` | 400 (campo no permitido) | ✅ |
| Ruta protegida sin token / con token de estudiante en ruta de admin | 401 / 403 | ✅ |
| Crear torneo con datos inválidos o cierre después del inicio | 400 con mensajes | ✅ |
| Búsqueda y filtros combinados de torneos | Solo los que cumplen todos los filtros | ✅ |
| Torneo, equipo o partido con id inexistente | 404 y mensaje en pantalla | ✅ |
| Inscripción duplicada / cupo completo / plazo cerrado / equipo inactivo | 409 / 400 / 400 / 400 | ✅ |
| Partido con el mismo equipo / con equipo no inscrito | 400 / 400 | ✅ |
| Resultado duplicado / empate en torneo de eliminación | 409 / 400 | ✅ |
| Ranking después de registrar resultados | Puntos calculados (3 victoria, 1 empate) | ✅ |
| Persistencia: reiniciar la API y volver a consultar | Los datos siguen en MySQL | ✅ |
| Error de comunicación: apagar el backend y abrir una vista | Aviso "No fue posible conectar con la API" + botón Reintentar | ✅ |
| `GET /inscripciones?torneoId=abc` | 400 (corregido tras la revisión del PR #17) | ✅ |

### Pruebas automáticas

Se ejecutan con `cd backend && npm test`. (Sección a cargo de Fabián: detalle de los tests y resultados.)

## 15. Problemas encontrados y cómo se resolvieron

| Problema | Solución |
|---|---|
| `nest new` instalaba NestJS 12, que es ESM y rompía el código del curso | Se creó el proyecto con `npx @nestjs/cli@11` |
| `npm install @nestjs/swagger` y TypeORM traían versiones incompatibles con Nest 11 | Se fijaron `@nestjs/swagger@11`, `@nestjs/typeorm@11` y `typeorm@0.3` |
| OneDrive sincronizaba `node_modules` y causaba errores | El repositorio se clonó en `C:\dev`, fuera de OneDrive |
| PR que dependían de otro aún no integrado (#16 → #17) | Se integraron en orden y el segundo quedó solo con su commit |
| `GET /inscripciones?torneoId=abc` respondía 200 con lista vacía | Se validó con `ParseIntPipe` opcional (detectado en la revisión del PR #17) |
| Al escribir `@Roles` en la descripción de un PR, GitHub lo tomó como mención a un usuario | Se escribe entre comillas invertidas como código |
| Diseño distinto entre las vistas de cada integrante | Se unificó con el estilo de las actividades del curso (barra azul, tarjetas, formularios) |

## 16. Declaración de uso de Inteligencia Artificial

En la parte de Javier se usó IA como asistente durante el desarrollo, de forma declarada y permitida por la evaluación. Cada avance fue ejecutado, probado y estudiado por el estudiante antes de integrarse.

| Elemento | Javier Suarez |
| --- | --- |
| Herramienta | Claude (Anthropic), usado a través de Claude Code |
| Uso | Generación y explicación del código de sus módulos, pruebas contra la API y en el navegador, apoyo en la revisión de Pull Requests y redacción de este README y de una guía de estudio |
| Parte afectada | Backend: `auth/`, `usuarios/`, `torneos/`, `inscripciones/`, `main.ts` (Swagger), `seed.ts`, entidades y módulos. Frontend: vistas de login, registro, perfil y torneos, `TorneoCard`, `Navbar`, router, `sesion.js` y estilos. Este README |
| Revisión del estudiante | Ejecutó y probó cada avance en su computador con MySQL antes de cada commit, revisó el código comentado, realizó los commits y Pull Requests, revisó los PR de su compañero y estudió el funcionamiento de todo el sistema para poder explicarlo |

| Elemento | Fabián Díaz |
| --- | --- |
| Herramienta | (a completar por Fabián) |
| Uso | (a completar por Fabián) |
| Parte afectada | (a completar por Fabián) |
| Revisión del estudiante | (a completar por Fabián) |

Todo el código entregado es responsabilidad de ambos integrantes, incluido el desarrollado con apoyo de IA.
