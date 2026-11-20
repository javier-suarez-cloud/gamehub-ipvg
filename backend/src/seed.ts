// Seed: carga datos de prueba en MySQL (npm run seed).
// OJO: primero BORRA todos los datos de gamehub_db y después inserta los de ejemplo.
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { AppModule } from './app.module';
import { Usuario } from './usuarios/entities/usuario.entity';
import { Equipo } from './equipos/entities/equipo.entity';
import { Torneo } from './torneos/entities/torneo.entity';
import { Inscripcion } from './inscripciones/entities/inscripcion.entity';
import { Partido } from './partidos/entities/partido.entity';
import { Resultado } from './resultados/entities/resultado.entity';

async function seed() {
  // Levanta la app sin servidor HTTP, solo para usar la conexión a MySQL
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const ds = app.get(DataSource);

  // 1) Limpia las tablas en orden (primero las que dependen de otras)
  const tablas = ['resultado', 'partido', 'inscripcion', 'equipo_integrantes', 'equipo', 'torneo', 'usuario'];
  for (const tabla of tablas) {
    await ds.query(`DELETE FROM ${tabla}`);
    if (tabla !== 'equipo_integrantes') await ds.query(`ALTER TABLE ${tabla} AUTO_INCREMENT = 1`);
  }

  const usuarios = ds.getRepository(Usuario);
  const equipos = ds.getRepository(Equipo);
  const torneos = ds.getRepository(Torneo);
  const inscripciones = ds.getRepository(Inscripcion);
  const partidos = ds.getRepository(Partido);
  const resultados = ds.getRepository(Resultado);

  // 2) Usuarios: 1 administrador y 6 estudiantes (contraseñas encriptadas con bcrypt)
  const claveAdmin = await bcrypt.hash('Admin123', 10);
  const claveEstudiante = await bcrypt.hash('Estudiante123', 10);
  const admin = await usuarios.save({ nombre: 'Administrador GameHub', alias: 'admin', correo: 'admin@ipvg.cl', password: claveAdmin, rol: 'admin' });
  const crearEstudiante = (nombre: string, alias: string, correo: string) =>
    usuarios.save({ nombre, alias, correo, password: claveEstudiante, rol: 'estudiante' });
  const javier = await crearEstudiante('Javier Suarez', 'javi', 'javier@ipvg.cl');
  const fabian = await crearEstudiante('Fabián Díaz', 'talisk', 'fabian@ipvg.cl');
  const camila = await crearEstudiante('Camila Rojas', 'cami', 'camila@ipvg.cl');
  const diego = await crearEstudiante('Diego Muñoz', 'dmz', 'diego@ipvg.cl');
  const valentina = await crearEstudiante('Valentina Soto', 'vale', 'valentina@ipvg.cl');
  const tomas = await crearEstudiante('Tomás Pérez', 'tomy', 'tomas@ipvg.cl');

  // 3) Equipos: capitán + integrantes
  const crearEquipo = (nombre: string, juegoPreferido: string, capitan: Usuario, otros: Usuario[]) =>
    equipos.save({ nombre, juegoPreferido, capitan, integrantes: [capitan, ...otros] });
  const pumas = await crearEquipo('Los Pumas', 'FIFA', javier, [diego]);
  const halcones = await crearEquipo('Halcones IPVG', 'FIFA', fabian, [tomas]);
  const nuble = await crearEquipo('Ñuble Esports', 'FIFA', valentina, []);
  const dragones = await crearEquipo('Dragones del Sur', 'League of Legends', camila, [tomas]);
  const nexus = await crearEquipo('Nexus Chillán', 'League of Legends', diego, [valentina]);

  // 4) Torneos: uno abierto (liga), uno en curso (eliminación) y uno sin inscritos
  const copa = await torneos.save({ nombre: 'Copa FIFA IPVG 2026', videojuego: 'FIFA', modalidad: 'liga', fechaInicio: '2026-12-10', cierreInscripcion: '2026-12-05', cupoMaximo: 8, estado: 'abierto' });
  const lol = await torneos.save({ nombre: 'Liga LoL Primavera', videojuego: 'League of Legends', modalidad: 'eliminacion', fechaInicio: '2026-11-15', cierreInscripcion: '2026-11-12', cupoMaximo: 4, estado: 'en_curso' });
  await torneos.save({ nombre: 'Rocket League Verano', videojuego: 'Rocket League', modalidad: 'eliminacion', fechaInicio: '2027-01-15', cierreInscripcion: '2027-01-10', cupoMaximo: 4, estado: 'abierto' });

  // 5) Inscripciones (una rechazada para mostrar ese estado)
  const inscribir = (torneo: Torneo, equipo: Equipo, estado = 'aceptada') => inscripciones.save({ torneo, equipo, estado });
  await inscribir(copa, pumas);
  await inscribir(copa, halcones);
  await inscribir(copa, nuble);
  await inscribir(lol, dragones);
  await inscribir(lol, nexus);
  await inscribir(lol, nuble, 'rechazada');

  // 6) Partidos entre equipos inscritos del mismo torneo
  const programar = (torneo: Torneo, local: Equipo, visitante: Equipo, fechaHora: string, ronda: string) =>
    partidos.save({ torneo, equipoLocal: local, equipoVisitante: visitante, fechaHora: new Date(fechaHora), ronda });
  const p1 = await programar(copa, pumas, halcones, '2026-12-10T18:00', 'Fecha 1');
  const p2 = await programar(copa, halcones, nuble, '2026-12-11T18:00', 'Fecha 2');
  await programar(copa, pumas, nuble, '2026-12-12T18:00', 'Fecha 3');
  const p4 = await programar(lol, dragones, nexus, '2026-11-16T19:00', 'Final');

  // 7) Resultados oficiales: el ganador se calcula con los puntajes (null = empate)
  const registrar = async (partido: Partido, local: number, visitante: number) => {
    const ganador = local > visitante ? partido.equipoLocal : visitante > local ? partido.equipoVisitante : null;
    await resultados.save({ partido, puntajeLocal: local, puntajeVisitante: visitante, ganador, registradoPor: admin });
    await partidos.update(partido.id, { estado: 'jugado' });
  };
  await registrar(p1, 2, 1); // Pumas gana
  await registrar(p2, 1, 1); // empate (permitido en liga)
  await registrar(p4, 2, 0); // Dragones gana la final

  console.log('Seed listo: 7 usuarios, 5 equipos, 3 torneos, 6 inscripciones, 4 partidos, 3 resultados');
  console.log('Admin:      admin@ipvg.cl / Admin123');
  console.log('Estudiante: javier@ipvg.cl / Estudiante123 (capitán de Los Pumas)');
  await app.close();
}

seed().catch((error) => {
  console.error('Error en el seed:', error);
  process.exit(1);
});
