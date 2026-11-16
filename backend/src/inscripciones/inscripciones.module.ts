import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inscripcion } from './entities/inscripcion.entity';

@Module({
  // Registra la entidad Inscripcion para poder usar su Repository en este módulo
  imports: [TypeOrmModule.forFeature([Inscripcion])],
})
export class InscripcionesModule {}