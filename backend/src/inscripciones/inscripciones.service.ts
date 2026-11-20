import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inscripcion } from './entities/inscripcion.entity';
import { Torneo } from '../torneos/entities/torneo.entity';
import { Equipo } from '../equipos/entities/equipo.entity';
import { CrearInscripcionDto } from './dto/crear-inscripcion.dto';

// Datos del usuario conectado que deja el AuthGuard en request.usuario
interface UsuarioToken {
  id: number;
  rol: string;
}

// Service de inscripciones: aquí están las reglas de negocio de la inscripción
@Injectable()
export class InscripcionesService {
  constructor(
    @InjectRepository(Inscripcion)
    private readonly inscripcionesRepo: Repository<Inscripcion>,
    @InjectRepository(Torneo)
    private readonly torneosRepo: Repository<Torneo>,
    @InjectRepository(Equipo)
    private readonly equiposRepo: Repository<Equipo>,
  ) {}

  // Lista las inscripciones; si llega torneoId, solo las de ese torneo
  findAll(torneoId?: number) {
    return this.inscripcionesRepo.find({
      where: torneoId ? { torneo: { id: torneoId } } : {},
      order: { fecha: 'ASC' },
    });
  }

  // Busca una inscripción por id; si no existe responde 404
  async findOne(id: number) {
    const inscripcion = await this.inscripcionesRepo.findOneBy({ id });
    if (!inscripcion) {
      throw new NotFoundException(`No existe la inscripción con id ${id}`);
    }
    return inscripcion;
  }

  // Inscribe un equipo en un torneo aplicando las reglas de negocio
  async create(dto: CrearInscripcionDto, usuario: UsuarioToken) {
    const torneo = await this.torneosRepo.findOneBy({ id: dto.torneoId });
    if (!torneo) {
      throw new NotFoundException(`No existe el torneo con id ${dto.torneoId}`);
    }
    const equipo = await this.equiposRepo.findOneBy({ id: dto.equipoId });
    if (!equipo) {
      throw new NotFoundException(`No existe el equipo con id ${dto.equipoId}`);
    }

    // Solo el capitán del equipo o un administrador pueden inscribirlo
    this.validarPermiso(equipo, usuario);

    // Regla: el período de inscripción debe estar abierto
    if (torneo.estado !== 'abierto' || this.hoy() > torneo.cierreInscripcion) {
      throw new BadRequestException('Las inscripciones de este torneo están cerradas');
    }
    // Regla: el equipo debe estar activo
    if (equipo.estado !== 'activo') {
      throw new BadRequestException('Solo los equipos activos pueden inscribirse');
    }
    // Regla: un equipo no se inscribe dos veces en el mismo torneo
    const existe = await this.inscripcionesRepo.findOneBy({
      torneo: { id: torneo.id },
      equipo: { id: equipo.id },
    });
    if (existe) {
      throw new ConflictException('El equipo ya está inscrito en este torneo'); // 409
    }
    // Regla: no se puede superar el cupo máximo
    await this.validarCupo(torneo);

    const inscripcion = this.inscripcionesRepo.create({ torneo, equipo, estado: 'aceptada' });
    const guardada = await this.inscripcionesRepo.save(inscripcion);
    return this.findOne(guardada.id); // 201
  }

  // El administrador acepta o rechaza una inscripción
  async cambiarEstado(id: number, estado: string) {
    const inscripcion = await this.findOne(id);
    // Si se vuelve a aceptar, debe haber cupo
    if (estado === 'aceptada' && inscripcion.estado !== 'aceptada') {
      await this.validarCupo(inscripcion.torneo);
    }
    inscripcion.estado = estado;
    await this.inscripcionesRepo.save(inscripcion);
    return this.findOne(id);
  }

  // Cancela una inscripción (capitán del equipo o admin)
  async remove(id: number, usuario: UsuarioToken) {
    const inscripcion = await this.findOne(id);
    this.validarPermiso(inscripcion.equipo, usuario);
    await this.inscripcionesRepo.remove(inscripcion);
    return { mensaje: `Inscripción ${id} cancelada` };
  }

  // ---------- Métodos de apoyo (privados) ----------

  // Cuenta las inscripciones aceptadas del torneo y las compara con el cupo
  private async validarCupo(torneo: Torneo) {
    const aceptadas = await this.inscripcionesRepo.count({
      where: { torneo: { id: torneo.id }, estado: 'aceptada' },
    });
    if (aceptadas >= torneo.cupoMaximo) {
      throw new BadRequestException(
        `El torneo ya completó su cupo máximo de ${torneo.cupoMaximo} equipos`,
      );
    }
  }

  // Solo el capitán del equipo o un administrador
  private validarPermiso(equipo: Equipo, usuario: UsuarioToken) {
    if (equipo.capitan.id !== usuario.id && usuario.rol !== 'admin') {
      throw new ForbiddenException('Solo el capitán del equipo o un administrador pueden hacer esto');
    }
  }

  // Fecha de hoy en formato AAAA-MM-DD (mismo formato que cierreInscripcion)
  private hoy() {
    return new Date().toLocaleDateString('sv-SE');
  }
}
