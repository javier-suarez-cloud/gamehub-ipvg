import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Torneo } from '../../torneos/entities/torneo.entity';
import { Equipo } from '../../equipos/entities/equipo.entity';
import { Resultado } from '../../resultados/entities/resultado.entity';

// Entidad Partido: enfrentamiento programado entre dos equipos de un torneo
@Entity()
export class Partido {
  @PrimaryGeneratedColumn()
  id: number;

  // Muchos partidos -> un torneo
  @ManyToOne(() => Torneo, (torneo) => torneo.partidos, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'torneoId' })
  torneo: Torneo;

  // Equipo que juega de local
  @ManyToOne(() => Equipo, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'equipoLocalId' })
  equipoLocal: Equipo;

  // Equipo que juega de visitante
  @ManyToOne(() => Equipo, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'equipoVisitanteId' })
  equipoVisitante: Equipo;

  @Column({ type: 'datetime' }) // fecha y hora del partido
  fechaHora: Date;

  @Column() // ej: 'Fecha 1', 'Semifinal', 'Final'
  ronda: string;

  @Column({ default: 'programado' }) // estados: 'programado' o 'jugado'
  estado: string;

  // Un partido -> un resultado (lado inverso; la columna está en Resultado)
  @OneToOne(() => Resultado, (resultado) => resultado.partido)
  resultado: Resultado;
}