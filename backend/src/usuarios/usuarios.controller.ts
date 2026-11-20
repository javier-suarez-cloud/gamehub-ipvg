import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

// Controller de usuarios: rutas /usuarios
@ApiTags('Usuarios') // grupo en Swagger
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  // GET /usuarios -> solo el administrador puede ver la lista de usuarios
  @Get()
  @ApiBearerAuth() // en Swagger: requiere token
  @UseGuards(AuthGuard, RolesGuard) // 1° revisa el token, 2° revisa el rol
  @Roles('admin')
  findAll() {
    return this.usuariosService.findAll();
  }
}
