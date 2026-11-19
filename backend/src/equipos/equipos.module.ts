import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Equipo } from './entities/equipo.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { EquiposController } from './equipos.controller';
import { EquiposService } from './equipos.service';

@Module({
  // Equipo para el CRUD y Usuario para buscar al capitán y a los integrantes
  imports: [TypeOrmModule.forFeature([Equipo, Usuario])],
  controllers: [EquiposController],
  providers: [EquiposService],
})
export class EquiposModule {}
