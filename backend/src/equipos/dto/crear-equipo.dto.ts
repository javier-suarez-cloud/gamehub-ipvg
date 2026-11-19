import { IsNotEmpty, IsString } from 'class-validator';

// DTO para crear un equipo: el capitán es el usuario conectado, no se envía
export class CrearEquipoDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del equipo es obligatorio' })
  nombre: string;

  @IsString()
  @IsNotEmpty({ message: 'El juego preferido es obligatorio' })
  juegoPreferido: string;
}
