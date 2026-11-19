import { IsInt, IsPositive } from 'class-validator';

// DTO para sumar un jugador al equipo: solo se envía el id del usuario
export class AgregarIntegranteDto {
  @IsInt({ message: 'usuarioId debe ser un número entero' })
  @IsPositive({ message: 'usuarioId debe ser mayor que 0' })
  usuarioId: number;
}
