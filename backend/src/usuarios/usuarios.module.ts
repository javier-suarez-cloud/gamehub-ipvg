import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from './entities/usuario.entity';

@Module({
  // Registra la entidad Usuario para poder usar su Repository en este módulo
  imports: [TypeOrmModule.forFeature([Usuario])],
})
export class UsuariosModule {}