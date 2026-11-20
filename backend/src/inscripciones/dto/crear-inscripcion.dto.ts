import { IsInt, IsPositive } from 'class-validator';

// DTO para inscribir un equipo en un torneo
export class CrearInscripcionDto {
  @IsInt({ message: 'torneoId debe ser un número entero' })
  @IsPositive({ message: 'torneoId debe ser mayor que 0' })
  torneoId: number;

  @IsInt({ message: 'equipoId debe ser un número entero' })
  @IsPositive({ message: 'equipoId debe ser mayor que 0' })
  equipoId: number;
}
