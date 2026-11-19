import { SetMetadata } from '@nestjs/common';

// Nombre interno con el que se guardan los roles permitidos de una ruta
export const ROLES_KEY = 'roles';

// Decorador @Roles('admin'): marca qué roles pueden usar una ruta
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
