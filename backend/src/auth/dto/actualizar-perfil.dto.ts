import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

// DTO para editar el perfil: ambos campos son opcionales, pero si vienen no pueden ir vacíos
export class ActualizarPerfilDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'El nombre no puede quedar vacío' })
  nombre?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'El alias no puede quedar vacío' })
  alias?: string;
}
