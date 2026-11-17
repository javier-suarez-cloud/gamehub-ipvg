import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Partido } from '../../partidos/entities/partido.entity';
import { Equipo } from '../../equipos/entities/equipo.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';

// Entidad Resultado: resultado oficial de un partido (de aquí se calcula el ranking)
@Entity()
export class Resultado {
  @PrimaryGeneratedColumn()
  id: number;

  // Un resultado <-> un partido. Crea la columna partidoId (única)
  @OneToOne(() => Partido, (partido) => partido.resultado, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'partidoId' })
  partido: Partido;

  @Column()
  puntajeLocal: number;

  @Column()
  puntajeVisitante: number;

  // Equipo ganador; queda en null cuando es empate
  @ManyToOne(() => Equipo, { nullable: true, onDelete: 'SET NULL', eager: true })
  @JoinColumn({ name: 'ganadorId' })
  ganador: Equipo | null;

  // Administrador que registró el resultado
  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'registradoPor' })
  registradoPor: Usuario;
}