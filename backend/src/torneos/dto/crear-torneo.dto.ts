import { IsDateString, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

// DTO para crear un torneo (solo administrador)
export class CrearTorneoDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  nombre: string;

  @IsString()
  @IsNotEmpty({ message: 'El videojuego es obligatorio' })
  videojuego: string;

  // liga: todos contra todos, permite empate; eliminacion: siempre hay ganador
  @IsIn(['liga', 'eliminacion'], { message: 'La modalidad debe ser liga o eliminacion' })
  modalidad: string;

  @IsDateString({}, { message: 'fechaInicio debe ser una fecha (AAAA-MM-DD)' })
  fechaInicio: string;

  @IsDateString({}, { message: 'cierreInscripcion debe ser una fecha (AAAA-MM-DD)' })
  cierreInscripcion: string;

  @IsInt({ message: 'El cupo máximo debe ser un número entero' })
  @Min(2, { message: 'El cupo máximo debe ser de al menos 2 equipos' })
  cupoMaximo: number;

  @IsOptional()
  @IsIn(['abierto', 'en_curso', 'finalizado'], {
    message: 'El estado debe ser abierto, en_curso o finalizado',
  })
  estado?: string;
}
