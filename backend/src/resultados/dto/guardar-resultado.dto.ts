import { IsInt, Min } from 'class-validator';

// DTO para corregir un resultado: solo los puntajes (el ganador se calcula, no se envía)
export class ActualizarResultadoDto {
  @IsInt({ message: 'puntajeLocal debe ser un número entero' })
  @Min(0, { message: 'puntajeLocal no puede ser negativo' })
  puntajeLocal: number;

  @IsInt({ message: 'puntajeVisitante debe ser un número entero' })
  @Min(0, { message: 'puntajeVisitante no puede ser negativo' })
  puntajeVisitante: number;
}

// DTO para registrar un resultado oficial: el partido y los puntajes
export class RegistrarResultadoDto extends ActualizarResultadoDto {
  @IsInt({ message: 'partidoId debe ser un número entero' })
  @Min(1, { message: 'partidoId debe ser mayor que 0' })
  partidoId: number;
}
