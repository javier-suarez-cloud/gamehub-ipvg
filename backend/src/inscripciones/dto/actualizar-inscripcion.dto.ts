import { IsIn } from 'class-validator';

// DTO para que el administrador acepte o rechace una inscripción
export class ActualizarInscripcionDto {
  @IsIn(['aceptada', 'rechazada'], { message: 'El estado debe ser aceptada o rechazada' })
  estado: string;
}
