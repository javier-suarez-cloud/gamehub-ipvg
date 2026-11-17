import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Resultado } from './entities/resultado.entity';

@Module({
  // Registra la entidad Resultado para poder usar su Repository en este módulo
  imports: [TypeOrmModule.forFeature([Resultado])],
})
export class ResultadosModule {}