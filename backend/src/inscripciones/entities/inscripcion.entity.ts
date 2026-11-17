import {
  CreateDateColumn,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Torneo } from '../../torneos/entities/torneo.entity';
import { Equipo } from '../../equipos/entities/equipo.entity';

// Entidad Inscripcion: une un equipo con un torneo (tabla intermedia con datos propios)
@Entity()
@Unique(['torneo', 'equipo']) // regla: un equipo no se inscribe dos veces en el mismo torneo
export class Inscripcion {
  @PrimaryGeneratedColumn()
  id: number;

  // Muchas inscripciones -> un torneo. Si se borra el torneo, se borran sus inscripciones
  @ManyToOne(() => Torneo, (torneo) => torneo.inscripciones, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'torneoId' })
  torneo: Torneo;

  // Muchas inscripciones -> un equipo
  @ManyToOne(() => Equipo, (equipo) => equipo.inscripciones, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'equipoId' })
  equipo: Equipo;

  @CreateDateColumn() // se llena sola con la fecha y hora de creación
  fecha: Date;

  @Column({ default: 'aceptada' }) // estados: 'aceptada' o 'rechazada'
  estado: string;
}