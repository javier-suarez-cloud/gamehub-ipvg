import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

// Guard de roles: revisa que el rol del usuario esté entre los permitidos por @Roles(...)
// Se usa DESPUÉS del AuthGuard, porque necesita request.usuario
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Lee los roles puestos con @Roles en el método o en el controller
    const rolesPermitidos = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!rolesPermitidos) {
      return true; // la ruta no exige un rol
    }

    const { usuario } = context.switchToHttp().getRequest();
    if (!usuario || !rolesPermitidos.includes(usuario.rol)) {
      throw new ForbiddenException('No tienes permisos para esta acción'); // 403
    }
    return true;
  }
}
