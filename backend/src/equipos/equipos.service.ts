import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Equipo } from './entities/equipo.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { CrearEquipoDto } from './dto/crear-equipo.dto';
import { ActualizarEquipoDto } from './dto/actualizar-equipo.dto';

// Datos del usuario conectado que deja el AuthGuard en request.usuario
interface UsuarioToken {
  id: number;
  rol: string;
}

// Service de equipos: lógica para crear y administrar equipos
@Injectable()
export class EquiposService {
  constructor(
    @InjectRepository(Equipo)
    private readonly equiposRepo: Repository<Equipo>,
    @InjectRepository(Usuario)
    private readonly usuariosRepo: Repository<Usuario>,
  ) {}

  // Lista equipos; si llega "buscar", filtra por nombre (contiene el texto)
  findAll(buscar?: string) {
    return this.equiposRepo.find({
      where: buscar ? { nombre: Like(`%${buscar}%`) } : {},
      order: { nombre: 'ASC' },
    });
  }

  // Busca un equipo por id; si no existe responde 404
  async findOne(id: number) {
    const equipo = await this.equiposRepo.findOneBy({ id });
    if (!equipo) {
      throw new NotFoundException(`No existe el equipo con id ${id}`);
    }
    return equipo;
  }

  // Crea un equipo: el usuario conectado queda como capitán y primer integrante
  async create(dto: CrearEquipoDto, usuario: UsuarioToken) {
    await this.validarNombreLibre(dto.nombre);
    const capitan = await this.buscarUsuario(usuario.id);
    const equipo = this.equiposRepo.create({
      ...dto,
      capitan,
      integrantes: [capitan],
    });
    const guardado = await this.equiposRepo.save(equipo);
    return this.findOne(guardado.id);
  }

  // Edita nombre, juego o estado (solo capitán o admin)
  async update(id: number, dto: ActualizarEquipoDto, usuario: UsuarioToken) {
    const equipo = await this.findOne(id);
    this.validarPermiso(equipo, usuario);
    if (dto.nombre && dto.nombre !== equipo.nombre) {
      await this.validarNombreLibre(dto.nombre);
    }
    Object.assign(equipo, dto);
    await this.equiposRepo.save(equipo);
    return this.findOne(id);
  }

  // Elimina un equipo (solo capitán o admin)
  async remove(id: number, usuario: UsuarioToken) {
    const equipo = await this.findOne(id);
    this.validarPermiso(equipo, usuario);
    await this.equiposRepo.remove(equipo);
    return { mensaje: `Equipo ${id} eliminado` };
  }

  // Suma un jugador al equipo (solo capitán o admin)
  async agregarIntegrante(id: number, usuarioId: number, usuario: UsuarioToken) {
    const equipo = await this.findOne(id);
    this.validarPermiso(equipo, usuario);
    if (equipo.integrantes.some((i) => i.id === usuarioId)) {
      throw new ConflictException('El usuario ya es integrante del equipo'); // 409
    }
    const nuevo = await this.buscarUsuario(usuarioId);
    equipo.integrantes.push(nuevo);
    await this.equiposRepo.save(equipo);
    return this.findOne(id);
  }

  // Quita un jugador del equipo (solo capitán o admin; el capitán no se puede quitar)
  async quitarIntegrante(id: number, usuarioId: number, usuario: UsuarioToken) {
    const equipo = await this.findOne(id);
    this.validarPermiso(equipo, usuario);
    if (equipo.capitan.id === usuarioId) {
      throw new BadRequestException('No se puede quitar al capitán del equipo'); // 400
    }
    if (!equipo.integrantes.some((i) => i.id === usuarioId)) {
      throw new NotFoundException('Ese usuario no es integrante del equipo'); // 404
    }
    equipo.integrantes = equipo.integrantes.filter((i) => i.id !== usuarioId);
    await this.equiposRepo.save(equipo);
    return this.findOne(id);
  }

  // ---------- Métodos de apoyo (privados) ----------

  // Regla: solo el capitán del equipo o un administrador pueden modificarlo
  private validarPermiso(equipo: Equipo, usuario: UsuarioToken) {
    if (equipo.capitan.id !== usuario.id && usuario.rol !== 'admin') {
      throw new ForbiddenException('Solo el capitán o un administrador pueden modificar este equipo'); // 403
    }
  }

  // Regla: no puede haber dos equipos con el mismo nombre
  private async validarNombreLibre(nombre: string) {
    const existe = await this.equiposRepo.findOneBy({ nombre });
    if (existe) {
      throw new ConflictException('Ya existe un equipo con ese nombre'); // 409
    }
  }

  // Busca un usuario por id; si no existe responde 404
  private async buscarUsuario(id: number) {
    const usuario = await this.usuariosRepo.findOneBy({ id });
    if (!usuario) {
      throw new NotFoundException(`No existe el usuario con id ${id}`);
    }
    return usuario;
  }
}
