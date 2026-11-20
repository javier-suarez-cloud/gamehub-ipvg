import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, Repository } from 'typeorm';
import { Partido } from './entities/partido.entity';
import { Torneo } from '../torneos/entities/torneo.entity';
import { Equipo } from '../equipos/entities/equipo.entity';
import { Inscripcion } from '../inscripciones/entities/inscripcion.entity';
import { Resultado } from '../resultados/entities/resultado.entity';
import { CrearPartidoDto } from './dto/crear-partido.dto';
import { ActualizarPartidoDto } from './dto/actualizar-partido.dto';

// Filtros que pueden llegar por la URL: /partidos?torneoId=1&estado=jugado
export interface FiltrosPartido {
  torneoId?: number;
  estado?: string;
}

// Service de partidos: programación de enfrentamientos entre equipos inscritos
@Injectable()
export class PartidosService {
  constructor(
    @InjectRepository(Partido)
    private readonly partidosRepo: Repository<Partido>,
    @InjectRepository(Torneo)
    private readonly torneosRepo: Repository<Torneo>,
    @InjectRepository(Equipo)
    private readonly equiposRepo: Repository<Equipo>,
    @InjectRepository(Inscripcion)
    private readonly inscripcionesRepo: Repository<Inscripcion>,
    @InjectRepository(Resultado)
    private readonly resultadosRepo: Repository<Resultado>,
  ) {}

  // Lista partidos combinando los filtros que lleguen; cada partido trae su resultado (o null)
  async findAll(filtros: FiltrosPartido) {
    const where: FindOptionsWhere<Partido> = {};
    if (filtros.torneoId) where.torneo = { id: filtros.torneoId };
    if (filtros.estado) where.estado = filtros.estado;
    const partidos = await this.partidosRepo.find({ where, order: { fechaHora: 'ASC' } });
    return this.conResultado(partidos);
  }

  // Busca un partido por id; si no existe responde 404
  async findOne(id: number) {
    const partido = await this.partidosRepo.findOneBy({ id });
    if (!partido) {
      throw new NotFoundException(`No existe el partido con id ${id}`);
    }
    const [conResultado] = await this.conResultado([partido]);
    return conResultado;
  }

  // Programa un partido aplicando las reglas de negocio
  async create(dto: CrearPartidoDto) {
    const torneo = await this.torneosRepo.findOneBy({ id: dto.torneoId });
    if (!torneo) {
      throw new NotFoundException(`No existe el torneo con id ${dto.torneoId}`);
    }
    // Regla: un partido enfrenta a dos equipos distintos
    if (dto.equipoLocalId === dto.equipoVisitanteId) {
      throw new BadRequestException('El equipo local y el visitante deben ser distintos');
    }
    if (torneo.estado === 'finalizado') {
      throw new BadRequestException('No se pueden programar partidos en un torneo finalizado');
    }

    const local = await this.buscarEquipo(dto.equipoLocalId);
    const visitante = await this.buscarEquipo(dto.equipoVisitanteId);
    // Regla: los dos equipos deben estar inscritos (y aceptados) en el mismo torneo
    await this.validarInscrito(torneo, local);
    await this.validarInscrito(torneo, visitante);

    const partido = this.partidosRepo.create({
      torneo,
      equipoLocal: local,
      equipoVisitante: visitante,
      fechaHora: new Date(dto.fechaHora),
      ronda: dto.ronda,
    });
    const guardado = await this.partidosRepo.save(partido);
    return this.findOne(guardado.id); // 201
  }

  // Reprograma fecha/hora o ronda; un partido ya jugado no se puede cambiar
  async update(id: number, dto: ActualizarPartidoDto) {
    const partido = await this.partidosRepo.findOneBy({ id });
    if (!partido) {
      throw new NotFoundException(`No existe el partido con id ${id}`);
    }
    if (partido.estado === 'jugado') {
      throw new BadRequestException('Un partido jugado no se puede modificar; corrige su resultado');
    }
    if (dto.fechaHora) partido.fechaHora = new Date(dto.fechaHora);
    if (dto.ronda) partido.ronda = dto.ronda;
    await this.partidosRepo.save(partido);
    return this.findOne(id);
  }

  // Elimina un partido (su resultado, si tiene, se borra en cascada)
  async remove(id: number) {
    const partido = await this.partidosRepo.findOneBy({ id });
    if (!partido) {
      throw new NotFoundException(`No existe el partido con id ${id}`);
    }
    await this.partidosRepo.remove(partido);
    return { mensaje: `Partido ${id} eliminado` };
  }

  // ---------- Métodos de apoyo (privados) ----------

  // Busca un equipo por id; si no existe responde 404
  private async buscarEquipo(id: number) {
    const equipo = await this.equiposRepo.findOneBy({ id });
    if (!equipo) {
      throw new NotFoundException(`No existe el equipo con id ${id}`);
    }
    return equipo;
  }

  // Revisa que el equipo tenga una inscripción aceptada en el torneo
  private async validarInscrito(torneo: Torneo, equipo: Equipo) {
    const inscripcion = await this.inscripcionesRepo.findOneBy({
      torneo: { id: torneo.id },
      equipo: { id: equipo.id },
      estado: 'aceptada',
    });
    if (!inscripcion) {
      throw new BadRequestException(
        `El equipo ${equipo.nombre} no está inscrito en el torneo ${torneo.nombre}`,
      );
    }
  }

  // Agrega a cada partido un resumen de su resultado (o null si aún no se juega)
  private async conResultado(partidos: Partido[]) {
    if (partidos.length === 0) return [];
    const resultados = await this.resultadosRepo.find({
      where: { partido: { id: In(partidos.map((p) => p.id)) } },
    });
    return partidos.map((partido) => {
      const r = resultados.find((x) => x.partido.id === partido.id);
      // Se resume el resultado para no repetir el partido dentro de sí mismo
      const resumen = r
        ? {
            id: r.id,
            puntajeLocal: r.puntajeLocal,
            puntajeVisitante: r.puntajeVisitante,
            ganador: r.ganador ? { id: r.ganador.id, nombre: r.ganador.nombre } : null,
          }
        : null;
      return { ...partido, resultado: resumen };
    });
  }
}
