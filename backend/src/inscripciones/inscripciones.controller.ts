import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { InscripcionesService } from './inscripciones.service';
import { CrearInscripcionDto } from './dto/crear-inscripcion.dto';
import { ActualizarInscripcionDto } from './dto/actualizar-inscripcion.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

// Tipo de la petición con el usuario que dejó el AuthGuard
type PeticionConUsuario = { usuario: { id: number; rol: string } };

// Controller de inscripciones: rutas /inscripciones
@Controller('inscripciones')
export class InscripcionesController {
  constructor(private readonly inscripcionesService: InscripcionesService) {}

  // GET /inscripciones?torneoId=1 -> inscripciones de un torneo (público)
  @Get()
  findAll(@Query('torneoId') torneoId?: string) {
    return this.inscripcionesService.findAll(torneoId ? Number(torneoId) : undefined);
  }

  // GET /inscripciones/:id -> detalle (404 si no existe)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.inscripcionesService.findOne(id);
  }

  // POST /inscripciones -> inscribir un equipo (capitán del equipo o admin)
  @Post()
  @UseGuards(AuthGuard)
  create(@Body() dto: CrearInscripcionDto, @Req() req: PeticionConUsuario) {
    return this.inscripcionesService.create(dto, req.usuario);
  }

  // PATCH /inscripciones/:id -> aceptar o rechazar (solo admin)
  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  cambiarEstado(@Param('id', ParseIntPipe) id: number, @Body() dto: ActualizarInscripcionDto) {
    return this.inscripcionesService.cambiarEstado(id, dto.estado);
  }

  // DELETE /inscripciones/:id -> cancelar (capitán del equipo o admin)
  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: PeticionConUsuario) {
    return this.inscripcionesService.remove(id, req.usuario);
  }
}
