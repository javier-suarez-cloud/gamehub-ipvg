import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

// DTO para reprogramar un partido: solo se puede cambiar la fecha/hora y la ronda
export class ActualizarPartidoDto {
  @IsOptional()
  @IsDateString({}, { message: 'fechaHora debe ser una fecha y hora válidas (AAAA-MM-DDTHH:mm)' })
  fechaHora?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'La ronda no puede quedar vacía' })
  ronda?: string;
}
