import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resultado } from './entities/resultado.entity';
import { Partido } from '../partidos/entities/partido.entity';
import { Torneo } from '../torneos/entities/torneo.entity';
import { Inscripcion } from '../inscripciones/entities/inscripcion.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { RegistrarResultadoDto, ActualizarResultadoDto } from './dto/guardar-resultado.dto';

// Puntos del ranking: se calculan siempre a partir de los resultados, nunca se ingresan a mano
const PUNTOS_VICTORIA = 3;
const PUNTOS_EMPATE = 1;

// Una fila de la tabla de posiciones
export interface FilaRanking {
  posicion: number;
  equipoId: number;
  equipo: string;
  partidosJugados: number;
  victorias: number;
  empates: number;
  derrotas: number;
  golesFavor: number;
  golesContra: number;
  diferencia: number;
  puntos: number;
}

// Service de resultados: registra resultados oficiales y calcula el ranking
@Injectable()
export class ResultadosService {
  constructor(
    @InjectRepository(Resultado)
    private readonly resultadosRepo: Repository<Resultado>,
    @InjectRepository(Partido)
    private readonly partidosRepo: Repository<Partido>,
    @InjectRepository(Torneo)
    private readonly torneosRepo: Repository<Torneo>,
    @InjectRepository(Inscripcion)
    private readonly inscripcionesRepo: Repository<Inscripcion>,
  ) {}

  // Lista resultados; si llega torneoId, solo los de ese torneo
  findAll(torneoId?: number) {
    return this.resultadosRepo.find({
      where: torneoId ? { partido: { torneo: { id: torneoId } } } : {},
      order: { id: 'ASC' },
    });
  }

  // Busca un resultado por id; si no existe responde 404
  async findOne(id: number) {
    const resultado = await this.resultadosRepo.findOneBy({ id });
    if (!resultado) {
      throw new NotFoundException(`No existe el resultado con id ${id}`);
    }
    return resultado;
  }

  // Registra el resultado oficial de un partido (el controller ya verificó que sea admin)
  async create(dto: RegistrarResultadoDto, usuarioId: number) {
    // Regla: el resultado solo se registra para un partido que existe
    const partido = await this.partidosRepo.findOneBy({ id: dto.partidoId });
    if (!partido) {
      throw new NotFoundException(`No existe el partido con id ${dto.partidoId}`);
    }
    // Regla: un partido tiene un solo resultado oficial
    const existe = await this.resultadosRepo.findOne({ where: { partido: { id: partido.id } } });
    if (existe) {
      throw new ConflictException('Ese partido ya tiene un resultado registrado'); // 409
    }

    const ganador = this.calcularGanador(partido, dto.puntajeLocal, dto.puntajeVisitante);
    const resultado = this.resultadosRepo.create({
      partido,
      puntajeLocal: dto.puntajeLocal,
      puntajeVisitante: dto.puntajeVisitante,
      ganador,
      registradoPor: { id: usuarioId } as Usuario,
    });
    const guardado = await this.resultadosRepo.save(resultado);

    // El partido pasa a "jugado"
    partido.estado = 'jugado';
    await this.partidosRepo.save(partido);
    return this.findOne(guardado.id); // 201
  }

  // Corrige los puntajes de un resultado ya registrado; el ganador se vuelve a calcular
  async update(id: number, dto: ActualizarResultadoDto, usuarioId: number) {
    const resultado = await this.findOne(id);
    resultado.ganador = this.calcularGanador(resultado.partido, dto.puntajeLocal, dto.puntajeVisitante);
    resultado.puntajeLocal = dto.puntajeLocal;
    resultado.puntajeVisitante = dto.puntajeVisitante;
    resultado.registradoPor = { id: usuarioId } as Usuario;
    await this.resultadosRepo.save(resultado);
    return this.findOne(id);
  }

  // Anula un resultado: el partido vuelve a quedar programado y el ranking se recalcula solo
  async remove(id: number) {
    const resultado = await this.findOne(id);
    const partido = resultado.partido;
    await this.resultadosRepo.remove(resultado);
    partido.estado = 'programado';
    await this.partidosRepo.save(partido);
    return { mensaje: `Resultado ${id} eliminado` };
  }

  // Tabla de posiciones de un torneo, calculada con los resultados oficiales
  async ranking(torneoId: number) {
    const torneo = await this.torneosRepo.findOneBy({ id: torneoId });
    if (!torneo) {
      throw new NotFoundException(`No existe el torneo con id ${torneoId}`);
    }

    // Todos los equipos inscritos y aceptados aparecen, aunque aún no hayan jugado
    const inscripciones = await this.inscripcionesRepo.find({
      where: { torneo: { id: torneoId }, estado: 'aceptada' },
    });
    const filas = new Map<number, FilaRanking>();
    const fila = (id: number, nombre: string) => {
      if (!filas.has(id)) {
        filas.set(id, {
          posicion: 0,
          equipoId: id,
          equipo: nombre,
          partidosJugados: 0,
          victorias: 0,
          empates: 0,
          derrotas: 0,
          golesFavor: 0,
          golesContra: 0,
          diferencia: 0,
          puntos: 0,
        });
      }
      return filas.get(id)!;
    };
    inscripciones.forEach((i) => fila(i.equipo.id, i.equipo.nombre));

    // Suma cada resultado oficial a los dos equipos del partido
    const resultados = await this.findAll(torneoId);
    for (const r of resultados) {
      const local = fila(r.partido.equipoLocal.id, r.partido.equipoLocal.nombre);
      const visitante = fila(r.partido.equipoVisitante.id, r.partido.equipoVisitante.nombre);
      local.partidosJugados++;
      visitante.partidosJugados++;
      local.golesFavor += r.puntajeLocal;
      local.golesContra += r.puntajeVisitante;
      visitante.golesFavor += r.puntajeVisitante;
      visitante.golesContra += r.puntajeLocal;

      if (r.puntajeLocal === r.puntajeVisitante) {
        local.empates++;
        visitante.empates++;
        local.puntos += PUNTOS_EMPATE;
        visitante.puntos += PUNTOS_EMPATE;
      } else if (r.puntajeLocal > r.puntajeVisitante) {
        local.victorias++;
        visitante.derrotas++;
        local.puntos += PUNTOS_VICTORIA;
      } else {
        visitante.victorias++;
        local.derrotas++;
        visitante.puntos += PUNTOS_VICTORIA;
      }
    }

    // Orden: más puntos, mejor diferencia, más a favor y por último el nombre
    const tabla = [...filas.values()];
    tabla.forEach((f) => (f.diferencia = f.golesFavor - f.golesContra));
    tabla.sort(
      (a, b) =>
        b.puntos - a.puntos ||
        b.diferencia - a.diferencia ||
        b.golesFavor - a.golesFavor ||
        a.equipo.localeCompare(b.equipo),
    );
    tabla.forEach((f, i) => (f.posicion = i + 1));

    return {
      torneo: {
        id: torneo.id,
        nombre: torneo.nombre,
        videojuego: torneo.videojuego,
        modalidad: torneo.modalidad,
      },
      puntosVictoria: PUNTOS_VICTORIA,
      puntosEmpate: PUNTOS_EMPATE,
      tabla,
    };
  }

  // ---------- Métodos de apoyo (privados) ----------

  // Decide el ganador por los puntajes; null = empate (solo permitido en modalidad liga)
  private calcularGanador(partido: Partido, local: number, visitante: number) {
    if (local > visitante) return partido.equipoLocal;
    if (visitante > local) return partido.equipoVisitante;
    if (partido.torneo.modalidad === 'eliminacion') {
      throw new BadRequestException('En un torneo de eliminación no puede haber empate');
    }
    return null;
  }
}
