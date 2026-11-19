import { IsDateString, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

// DTO para editar un torneo: los mismos campos que al crear, pero todos opcionales
export class ActualizarTorneoDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'El nombre no puede quedar vacío' })
  nombre?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'El videojuego no puede quedar vacío' })
  videojuego?: string;

  @IsOptional()
  @IsIn(['liga', 'eliminacion'], { message: 'La modalidad debe ser liga o eliminacion' })
  modalidad?: string;

  @IsOptional()
  @IsDateString({}, { message: 'fechaInicio debe ser una fecha (AAAA-MM-DD)' })
  fechaInicio?: string;

  @IsOptional()
  @IsDateString({}, { message: 'cierreInscripcion debe ser una fecha (AAAA-MM-DD)' })
  cierreInscripcion?: string;

  @IsOptional()
  @IsInt({ message: 'El cupo máximo debe ser un número entero' })
  @Min(2, { message: 'El cupo máximo debe ser de al menos 2 equipos' })
  cupoMaximo?: number;

  @IsOptional()
  @IsIn(['abierto', 'en_curso', 'finalizado'], {
    message: 'El estado debe ser abierto, en_curso o finalizado',
  })
  estado?: string;
}
