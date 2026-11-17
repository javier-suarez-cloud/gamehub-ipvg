import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

// DTO de login: solo correo y contraseña
export class LoginDto {
  @IsEmail({}, { message: 'El correo no tiene un formato válido' })
  correo: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  password: string;
}
