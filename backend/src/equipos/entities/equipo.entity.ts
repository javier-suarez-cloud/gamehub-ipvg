import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Inscripcion } from '../../inscripciones/entities/inscripcion.entity';

// Entidad Equipo: agrupa jugadores y tiene un capitán
@Entity()
export class Equipo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true }) // no puede haber dos equipos con el mismo nombre
  nombre: string;

  @Column()
  juegoPreferido: string;

  @Column({ default: 'activo' }) // estados: 'activo' o 'inactivo'
  estado: string;

  // Muchos equipos -> un capitán (Usuario). Crea la columna capitanId
  // eager: true = al consultar un equipo, trae su capitán automáticamente
  @ManyToOne(() => Usuario, { eager: true })
  @JoinColumn({ name: 'capitanId' })
  capitan: Usuario;

  // Muchos equipos <-> muchos usuarios. Crea la tabla intermedia equipo_integrantes
  @ManyToMany(() => Usuario, (usuario) => usuario.equipos, { eager: true })
  @JoinTable({ name: 'equipo_integrantes' })
  integrantes: Usuario[];

  // Un equipo -> muchas inscripciones a torneos
  @OneToMany(() => Inscripcion, (inscripcion) => inscripcion.equipo)
  inscripciones: Inscripcion[];
}