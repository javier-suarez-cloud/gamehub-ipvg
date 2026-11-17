import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';

// Service de usuarios: consultas sobre la tabla usuario
@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuariosRepo: Repository<Usuario>,
  ) {}

  // Lista todos los usuarios (sin contraseña, gracias al select: false)
  findAll() {
    return this.usuariosRepo.find({ order: { id: 'ASC' } });
  }
}
