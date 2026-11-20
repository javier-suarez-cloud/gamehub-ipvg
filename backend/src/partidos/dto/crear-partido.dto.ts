import { IsDateString, IsInt, IsNotEmpty, IsPositive, IsString } from 'class-validator';

// DTO para programar un partido (solo administrador)
export class CrearPartidoDto {
  @IsInt({ message: 'torneoId debe ser un número entero' })
  @IsPositive({ message: 'torneoId debe ser mayor que 0' })
  torneoId: number;

  @IsInt({ message: 'equipoLocalId debe ser un número entero' })
  @IsPositive({ message: 'equipoLocalId debe ser mayor que 0' })
  equipoLocalId: number;

  @IsInt({ message: 'equipoVisitanteId debe ser un número entero' })
  @IsPositive({ message: 'equipoVisitanteId debe ser mayor que 0' })
  equipoVisitanteId: number;

  @IsDateString({}, { message: 'fechaHora debe ser una fecha y hora válidas (AAAA-MM-DDTHH:mm)' })
  fechaHora: string;

  // ej: 'Fecha 1', 'Semifinal', 'Final'
  @IsString()
  @IsNotEmpty({ message: 'La ronda es obligatoria' })
  ronda: string;
}
