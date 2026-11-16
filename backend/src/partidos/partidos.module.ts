import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Partido } from './entities/partido.entity';

@Module({
  // Registra la entidad Partido para poder usar su Repository en este módulo
  imports: [TypeOrmModule.forFeature([Partido])],
})
export class PartidosModule {}