import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Like, Repository } from 'typeorm';
import { Torneo } from './entities/torneo.entity';
import { CrearTorneoDto } from './dto/crear-torneo.dto';
import { ActualizarTorneoDto } from './dto/actualizar-torneo.dto';

// Filtros que pueden llegar por la URL: /torneos?buscar=...&videojuego=...&estado=...&modalidad=...
export interface FiltrosTorneo {
  buscar?: string;
  videojuego?: string;
  estado?: string;
  modalidad?: string;
}

// Service de torneos: lógica del CRUD, búsqueda y filtros
@Injectable()
export class TorneosService {
  constructor(
    @InjectRepository(Torneo)
    private readonly torneosRepo: Repository<Torneo>,
  ) {}

  // Lista torneos combinando los filtros que lleguen (los vacíos se ignoran)
  findAll(filtros: FiltrosTorneo) {
    const where: FindOptionsWhere<Torneo> = {};
    if (filtros.buscar) where.nombre = Like(`%${filtros.buscar}%`); // búsqueda por texto
    if (filtros.videojuego) where.videojuego = filtros.videojuego; // filtro 1
    if (filtros.estado) where.estado = filtros.estado; // filtro 2
    if (filtros.modalidad) where.modalidad = filtros.modalidad; // filtro 3
    return this.torneosRepo.find({ where, order: { fechaInicio: 'ASC' } });
  }

  // Busca un torneo por id; si no existe responde 404
  async findOne(id: number) {
    const torneo = await this.torneosRepo.findOneBy({ id });
    if (!torneo) {
      throw new NotFoundException(`No existe el torneo con id ${id}`);
    }
    return torneo;
  }

  // Crea un torneo (el controller ya verificó que sea admin)
  async create(dto: CrearTorneoDto) {
    this.validarFechas(dto.cierreInscripcion, dto.fechaInicio);
    const torneo = this.torneosRepo.create(dto);
    return this.torneosRepo.save(torneo); // 201 con el torneo creado
  }

  // Edita un torneo; revisa las fechas con los valores nuevos o los que ya tenía
  async update(id: number, dto: ActualizarTorneoDto) {
    const torneo = await this.findOne(id);
    this.validarFechas(
      dto.cierreInscripcion ?? torneo.cierreInscripcion,
      dto.fechaInicio ?? torneo.fechaInicio,
    );
    Object.assign(torneo, dto);
    await this.torneosRepo.save(torneo);
    return this.findOne(id);
  }

  // Elimina un torneo (sus inscripciones y partidos se borran en cascada)
  async remove(id: number) {
    const torneo = await this.findOne(id);
    await this.torneosRepo.remove(torneo);
    return { mensaje: `Torneo ${id} eliminado` };
  }

  // Regla: las inscripciones deben cerrar el mismo día o antes de que empiece el torneo
  private validarFechas(cierreInscripcion: string, fechaInicio: string) {
    if (cierreInscripcion > fechaInicio) {
      throw new BadRequestException(
        'El cierre de inscripción no puede ser posterior a la fecha de inicio',
      );
    }
  }
}
