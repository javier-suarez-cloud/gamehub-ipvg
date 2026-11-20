import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Resultado } from './entities/resultado.entity';
import { Partido } from '../partidos/entities/partido.entity';
import { Torneo } from '../torneos/entities/torneo.entity';
import { Inscripcion } from '../inscripciones/entities/inscripcion.entity';
import { ResultadosController, RankingController } from './resultados.controller';
import { ResultadosService } from './resultados.service';

@Module({
  // Resultado para el CRUD; Partido, Torneo e Inscripcion para validar y armar el ranking
  imports: [TypeOrmModule.forFeature([Resultado, Partido, Torneo, Inscripcion])],
  controllers: [ResultadosController, RankingController],
  providers: [ResultadosService],
})
export class ResultadosModule {}
