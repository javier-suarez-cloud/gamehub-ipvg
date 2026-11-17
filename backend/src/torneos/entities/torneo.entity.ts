import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Inscripcion } from '../../inscripciones/entities/inscripcion.entity';
import { Partido } from '../../partidos/entities/partido.entity';

// Entidad Torneo: define una competencia y sus condiciones
@Entity()
export class Torneo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column()
  videojuego: string; // ej: 'League of Legends', 'FIFA'

  @Column() // 'liga' (permite empate) o 'eliminacion' (siempre hay ganador)
  modalidad: string;

  @Column({ type: 'date' }) // fecha en que parte el torneo
  fechaInicio: string;

  @Column({ type: 'date' }) // después de esta fecha no se aceptan inscripciones
  cierreInscripcion: string;

  @Column() // cantidad máxima de equipos inscritos
  cupoMaximo: number;

  @Column({ default: 'abierto' }) // estados: 'abierto', 'en_curso', 'finalizado'
  estado: string;

  // Un torneo -> muchas inscripciones
  @OneToMany(() => Inscripcion, (inscripcion) => inscripcion.torneo)
  inscripciones: Inscripcion[];

  // Un torneo -> muchos partidos
  @OneToMany(() => Partido, (partido) => partido.torneo)
  partidos: Partido[];
}