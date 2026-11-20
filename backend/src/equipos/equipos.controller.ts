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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EquiposService } from './equipos.service';
import { CrearEquipoDto } from './dto/crear-equipo.dto';
import { ActualizarEquipoDto } from './dto/actualizar-equipo.dto';
import { AgregarIntegranteDto } from './dto/agregar-integrante.dto';
import { AuthGuard } from '../auth/guards/auth.guard';

// Tipo de la petición con el usuario que dejó el AuthGuard
type PeticionConUsuario = { usuario: { id: number; rol: string } };

// Controller de equipos: rutas /equipos
@ApiTags('Equipos') // grupo en Swagger
@Controller('equipos')
export class EquiposController {
  constructor(private readonly equiposService: EquiposService) {}

  // GET /equipos?buscar=texto -> listado público (con búsqueda opcional por nombre)
  @Get()
  findAll(@Query('buscar') buscar?: string) {
    return this.equiposService.findAll(buscar);
  }

  // GET /equipos/:id -> detalle público; ParseIntPipe convierte el id a número (o responde 400)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.equiposService.findOne(id);
  }

  // POST /equipos -> crear equipo (requiere sesión; el que lo crea queda de capitán)
  @Post()
  @ApiBearerAuth() // en Swagger: requiere token
  @UseGuards(AuthGuard)
  create(@Body() dto: CrearEquipoDto, @Req() req: PeticionConUsuario) {
    return this.equiposService.create(dto, req.usuario);
  }

  // PATCH /equipos/:id -> editar (capitán o admin)
  @Patch(':id')
  @ApiBearerAuth() // en Swagger: requiere token
  @UseGuards(AuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarEquipoDto,
    @Req() req: PeticionConUsuario,
  ) {
    return this.equiposService.update(id, dto, req.usuario);
  }

  // DELETE /equipos/:id -> eliminar (capitán o admin)
  @Delete(':id')
  @ApiBearerAuth() // en Swagger: requiere token
  @UseGuards(AuthGuard)
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: PeticionConUsuario) {
    return this.equiposService.remove(id, req.usuario);
  }

  // POST /equipos/:id/integrantes -> sumar un jugador (capitán o admin)
  @Post(':id/integrantes')
  @ApiBearerAuth() // en Swagger: requiere token
  @UseGuards(AuthGuard)
  agregarIntegrante(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AgregarIntegranteDto,
    @Req() req: PeticionConUsuario,
  ) {
    return this.equiposService.agregarIntegrante(id, dto.usuarioId, req.usuario);
  }

  // DELETE /equipos/:id/integrantes/:usuarioId -> quitar un jugador (capitán o admin)
  @Delete(':id/integrantes/:usuarioId')
  @ApiBearerAuth() // en Swagger: requiere token
  @UseGuards(AuthGuard)
  quitarIntegrante(
    @Param('id', ParseIntPipe) id: number,
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @Req() req: PeticionConUsuario,
  ) {
    return this.equiposService.quitarIntegrante(id, usuarioId, req.usuario);
  }
}
