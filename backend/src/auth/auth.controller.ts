import { Body, Controller, Get, HttpCode, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegistroDto } from './dto/registro.dto';
import { LoginDto } from './dto/login.dto';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto';
import { AuthGuard } from './guards/auth.guard';

// Controller de autenticación: todas sus rutas empiezan con /auth
@ApiTags('Autenticación') // grupo en Swagger
@Controller('auth')
export class AuthController {
  // Nest entrega el service listo para usar (inyección de dependencias)
  constructor(private readonly authService: AuthService) {}

  // POST /auth/registro -> crea un estudiante (responde 201)
  @Post('registro')
  registrar(@Body() dto: RegistroDto) {
    return this.authService.registrar(dto);
  }

  // POST /auth/login -> devuelve el token (200 en vez del 201 que usa POST por defecto)
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // GET /auth/perfil -> datos del usuario conectado (requiere token)
  @Get('perfil')
  @ApiBearerAuth() // en Swagger: requiere token
  @UseGuards(AuthGuard)
  perfil(@Req() req: { usuario: { id: number } }) {
    return this.authService.perfil(req.usuario.id);
  }

  // PATCH /auth/perfil -> edita nombre y/o alias (requiere token)
  @Patch('perfil')
  @ApiBearerAuth() // en Swagger: requiere token
  @UseGuards(AuthGuard)
  actualizarPerfil(
    @Req() req: { usuario: { id: number } },
    @Body() dto: ActualizarPerfilDto,
  ) {
    return this.authService.actualizarPerfil(req.usuario.id, dto);
  }
}
