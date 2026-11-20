# Pruebas manuales documentadas · GameHub IPVG

Pruebas funcionales de los 9 puntos del apartado 12.1 de la evaluación. Se ejecutaron el **20 de noviembre de 2026** en entorno local (MySQL 8.4, API NestJS en `http://localhost:3000`, frontend Vue en el navegador). Las ejecutó Fabián Díaz con apoyo de Claude Code (ver la declaración de uso de IA en el README).

**Resultado general: 55 comprobaciones, todas OK.** Las pruebas de API se hicieron con peticiones HTTP (también se pueden repetir desde Swagger en `/api`) y las de interfaz en el navegador.

## Cómo repetirlas

1. Levantar MySQL y la API: `cd backend` → `npm start`.
2. Cargar datos de prueba: `npm run seed` (administrador `admin@ipvg.cl` / `Admin123`; estudiantes con clave `Estudiante123`). **Ojo:** el seed borra los datos de `gamehub_db` antes de cargar.
3. Levantar el frontend: `cd frontend` → `npm run dev`.
4. Para las pruebas de API, iniciar sesión en `POST /auth/login` y usar el token como `Authorization: Bearer <token>`, o pulsar **Authorize** en Swagger.

> Los códigos de estado y mensajes de abajo son los que devolvió la API en la ejecución. Los nombres de equipos y torneos son los de la base de pruebas de esa ejecución.

## 1. Login correcto e incorrecto

| # | Caso | Resultado esperado | Obtenido | Estado |
|---|------|--------------------|----------|--------|
| 1.1 | `POST /auth/login` con correo y clave válidos | 200 y token | 200 con token y datos del usuario | OK |
| 1.2 | Clave incorrecta | 401 | 401 "Correo o contraseña incorrectos" | OK |
| 1.3 | Correo que no existe | 401 (mismo mensaje, sin dar pistas) | 401 "Correo o contraseña incorrectos" | OK |
| 1.4 | Correo sin formato (`abc`) | 400 | 400 "El correo no tiene un formato válido" | OK |
| 1.5 | Pantalla `/login` con clave mala | Mensaje de error y se queda en la pantalla | "Correo o contraseña incorrectos" | OK |

## 2. Acceso según rol

| # | Caso | Resultado esperado | Obtenido | Estado |
|---|------|--------------------|----------|--------|
| 2.1 | Crear torneo sin token | 401 | 401 "Debes iniciar sesión" | OK |
| 2.2 | Crear torneo como estudiante | 403 | 403 "No tienes permisos para esta acción" | OK |
| 2.3 | Crear torneo como administrador | 201 | 201 | OK |
| 2.4 | `GET /usuarios` como estudiante | 403 | 403 | OK |
| 2.5 | `GET /usuarios` como administrador | 200 | 200 | OK |
| 2.6 | Estudiante abre `/partidos/nuevo` en el navegador | Lo redirige a `/torneos` | Redirigido a `/torneos` | OK |
| 2.7 | Estudiante abre un partido | No ve los botones de administración | Solo ve el detalle | OK |
| 2.8 | Abrir `/perfil` sin sesión | Lo manda al login | Redirigido a `/login` | OK |

## 3. Crear y gestionar torneos, equipos, inscripciones, partidos y resultados

| # | Caso | Resultado esperado | Obtenido | Estado |
|---|------|--------------------|----------|--------|
| 3.1 | Crear equipo con sesión | 201, el usuario queda de capitán | 201, `GET` muestra capitán e integrante | OK |
| 3.2 | Editar un equipo ajeno como estudiante | 403 | 403 "Solo el capitán o un administrador pueden modificar este equipo" | OK |
| 3.3 | Inscribir un equipo en un torneo | 201 | 201 (equipos A y B) | OK |
| 3.4 | Programar un partido entre equipos inscritos | 201 | 201 | OK |
| 3.5 | Registrar un resultado como administrador | 201, el ganador se calcula | 201, partido pasa a "jugado" | OK |
| 3.6 | Registrar un resultado como estudiante | 403 | 403 | OK |
| 3.7 | El ranking refleja el resultado | Ganador con 3 puntos | Manual A = 3, Manual B = 0 | OK |

## 4. Validaciones con datos inválidos

| # | Caso | Resultado esperado | Obtenido | Estado |
|---|------|--------------------|----------|--------|
| 4.1 | Registro sin nombre | 400 | 400 "El nombre es obligatorio" | OK |
| 4.2 | Registro con clave de 3 caracteres | 400 | 400 "La contraseña debe tener al menos 6 caracteres" | OK |
| 4.3 | Registro con correo ya usado | 409 | 409 "El correo ya está registrado" | OK |
| 4.4 | Crear equipo sin nombre | 400 | 400 "El nombre del equipo es obligatorio" | OK |
| 4.5 | Crear torneo con cupo 1 | 400 | 400 "El cupo máximo debe ser de al menos 2 equipos" | OK |
| 4.6 | Torneo con cierre de inscripción posterior al inicio | 400 | 400 "El cierre de inscripción no puede ser posterior a la fecha de inicio" | OK |
| 4.7 | Resultado con puntaje negativo | 400 | 400 "puntajeLocal no puede ser negativo" | OK |
| 4.8 | Resultado con ganador enviado a mano | 400 | 400 (el campo no existe en el DTO) | OK |
| 4.9 | Resultado con empate en torneo de eliminación (pantalla) | Mensaje y no se envía | "En un torneo de eliminación no puede haber empate" | OK |

## 5. Búsqueda y filtros

| # | Caso | Resultado esperado | Obtenido | Estado |
|---|------|--------------------|----------|--------|
| 5.1 | `GET /torneos?buscar=Prueba` | Solo torneos con ese texto | Liga Prueba y Copa Prueba | OK |
| 5.2 | `GET /torneos?modalidad=eliminacion` | Solo eliminación | Copa Prueba | OK |
| 5.3 | Búsqueda y filtro combinados (`buscar=Prueba&modalidad=liga`) | Intersección | Liga Prueba | OK |
| 5.4 | `GET /equipos?buscar=Manual` | Equipos con ese texto | Manual A, B y C | OK |
| 5.5 | `GET /partidos?torneoId=1&estado=jugado` | Solo partidos jugados del torneo | 2 partidos | OK |
| 5.6 | Pantalla `/partidos`: filtros por equipo, torneo y estado | La lista se acota al instante | Se recalcula con cada filtro | OK |

## 6. Consulta de un ID inexistente

| # | Caso | Resultado esperado | Obtenido | Estado |
|---|------|--------------------|----------|--------|
| 6.1 | `GET /torneos/999` | 404 | 404 "No existe el torneo con id 999" | OK |
| 6.2 | `GET /equipos/999` | 404 | 404 "No existe el equipo con id 999" | OK |
| 6.3 | `GET /partidos/999` | 404 | 404 "No existe el partido con id 999" | OK |
| 6.4 | `GET /resultados/999` | 404 | 404 | OK |
| 6.5 | `GET /inscripciones/999` | 404 | 404 | OK |
| 6.6 | `GET /equipos/abc` | 400 | 400 "Validation failed (numeric string is expected)" | OK |
| 6.7 | Pantalla `/equipos/999` y `/partidos/999` | El frontend informa el error | "No existe el equipo con id 999" en pantalla | OK |

## 7. Reglas de negocio

| # | Caso | Resultado esperado | Obtenido | Estado |
|---|------|--------------------|----------|--------|
| 7.1 | Inscribir dos veces al mismo equipo en un torneo | 409 | 409 "El equipo ya está inscrito en este torneo" | OK |
| 7.2 | Inscribir un tercer equipo en un torneo con cupo 2 | 400 | 400 "El torneo ya completó su cupo máximo de 2 equipos" | OK |
| 7.3 | Inscribir cuando el plazo de inscripción ya cerró | 400 | 400 "Las inscripciones de este torneo están cerradas" | OK |
| 7.4 | Partido con un equipo no inscrito en el torneo | 400 | 400 "El equipo Manual C no está inscrito en el torneo Torneo Manual" | OK |
| 7.5 | Partido de un equipo contra sí mismo | 400 | 400 "El equipo local y el visitante deben ser distintos" | OK |
| 7.6 | Segundo resultado para el mismo partido | 409 | 409 "Ese partido ya tiene un resultado registrado" | OK |
| 7.7 | Empate en torneo de eliminación | 400 | 400 | OK |
| 7.8 | Empate en una liga | 201, sin ganador y 1 punto cada uno | 201, `ganador: null` | OK |
| 7.9 | Corregir un resultado | El ranking se recalcula solo | Los puntos cambian con el nuevo marcador | OK |
| 7.10 | Anular un resultado | El partido vuelve a "programado" | Estado "programado" | OK |

## 8. Persistencia después de reiniciar la API

| # | Caso | Resultado esperado | Obtenido | Estado |
|---|------|--------------------|----------|--------|
| 8.1 | Consultar `GET /ranking?torneoId=3` y `GET /equipos?buscar=Manual`, detener la API, volver a levantarla (`npm start`) y repetir | Los mismos datos | Ranking Manual A = 3 y Manual B = 0; los 3 equipos siguen ahí | OK |

## 9. Error de comunicación con el backend

| # | Caso | Resultado esperado | Obtenido | Estado |
|---|------|--------------------|----------|--------|
| 9.1 | Detener la API y abrir `/equipos` | Mensaje claro y botón para reintentar, sin pantalla en blanco | "No fue posible conectar con la API. Revisa que el backend esté encendido." con botón **Reintentar** | OK |
| 9.2 | Volver a encender la API y pulsar **Reintentar** | La lista se carga | Se carga normalmente | OK |

## Pruebas automáticas

Además de este documento, el backend tiene pruebas automáticas con Jest (`cd backend` → `npm test`): equipos, partidos, resultados con ranking e inscripciones. Ver el README, sección "Pruebas automáticas".
