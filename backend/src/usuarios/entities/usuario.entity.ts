import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Equipo } from '../../equipos/entities/equipo.entity';

// Entidad Usuario: tabla "usuario" en MySQL
@Entity()
export class Usuario {
  @PrimaryGeneratedColumn() // id autoincremental
  id: number;

  @Column()
  nombre: string;

  @Column()
  alias: string; // apodo del jugador

  @Column({ unique: true }) // no se repiten correos
  correo: string;

  @Column({ select: false }) // no se devuelve en las consultas normales (seguridad)
  password: string; // se guarda encriptada con bcryptjs, nunca en texto plano

  @Column({ default: 'estudiante' }) // roles: 'admin' o 'estudiante'
  rol: string;

  @Column({ default: true }) // permite desactivar una cuenta sin borrarla
  activo: boolean;

  // Equipos de los que el usuario es integrante (lado inverso de Equipo.integrantes)
  @ManyToMany(() => Equipo, (equipo) => equipo.integrantes)
  equipos: Equipo[];
}