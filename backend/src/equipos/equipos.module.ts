import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Equipo } from './entities/equipo.entity';

@Module({
  // Registra la entidad Equipo para poder usar su Repository en este módulo
  imports: [TypeOrmModule.forFeature([Equipo])],
})
export class EquiposModule {}