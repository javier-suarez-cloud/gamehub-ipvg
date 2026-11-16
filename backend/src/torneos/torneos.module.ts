import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Torneo } from './entities/torneo.entity';

@Module({
  // Registra la entidad Torneo para poder usar su Repository en este módulo
  imports: [TypeOrmModule.forFeature([Torneo])],
})
export class TorneosModule {}