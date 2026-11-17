import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

// Guard de autenticación: deja pasar solo peticiones con un token válido
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // El token llega en el encabezado: Authorization: Bearer <token>
    const encabezado: string | undefined = request.headers.authorization;
    if (!encabezado || !encabezado.startsWith('Bearer ')) {
      throw new UnauthorizedException('Debes iniciar sesión'); // 401
    }
    const token = encabezado.split(' ')[1];

    try {
      // Verifica la firma y la expiración; si es válido, guarda los datos del usuario en la petición
      request.usuario = jwt.verify(token, this.config.getOrThrow<string>('JWT_SECRET'));
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido o expirado'); // 401
    }
  }
}
