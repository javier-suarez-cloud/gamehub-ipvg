import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

// DTO para editar un equipo: todos los campos son opcionales
export class ActualizarEquipoDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'El nombre no puede quedar vacío' })
  nombre?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'El juego preferido no puede quedar vacío' })
  juegoPreferido?: string;

  @IsOptional()
  @IsIn(['activo', 'inactivo'], { message: 'El estado debe ser activo o inactivo' })
  estado?: string;
}
