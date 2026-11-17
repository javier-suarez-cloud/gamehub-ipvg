import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

// DTO de registro: define y valida los datos que debe enviar un estudiante nuevo
export class RegistroDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  nombre: string;

  @IsString()
  @IsNotEmpty({ message: 'El alias es obligatorio' })
  alias: string;

  @IsEmail({}, { message: 'El correo no tiene un formato válido' })
  correo: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;
}
