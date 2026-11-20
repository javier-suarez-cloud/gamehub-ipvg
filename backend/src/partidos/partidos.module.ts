import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Partido } from './entities/partido.entity';
import { Torneo } from '../torneos/entities/torneo.entity';
import { Equipo } from '../equipos/entities/equipo.entity';
import { Inscripcion } from '../inscripciones/entities/inscripcion.entity';
import { Resultado } from '../resultados/entities/resultado.entity';
import { PartidosController } from './partidos.controller';
import { PartidosService } from './partidos.service';

@Module({
  // Partido para el CRUD; Torneo, Equipo e Inscripcion para validar las reglas; Resultado para mostrarlo
  imports: [TypeOrmModule.forFeature([Partido, Torneo, Equipo, Inscripcion, Resultado])],
  controllers: [PartidosController],
  providers: [PartidosService],
})
export class PartidosModule {}
