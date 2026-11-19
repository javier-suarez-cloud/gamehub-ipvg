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
  UseGuards,
} from '@nestjs/common';
import { TorneosService } from './torneos.service';
import { CrearTorneoDto } from './dto/crear-torneo.dto';
import { ActualizarTorneoDto } from './dto/actualizar-torneo.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

// Controller de torneos: rutas /torneos
@Controller('torneos')
export class TorneosController {
  constructor(private readonly torneosService: TorneosService) {}

  // GET /torneos?buscar=&videojuego=&estado=&modalidad= -> listado público con filtros combinables
  @Get()
  findAll(
    @Query('buscar') buscar?: string,
    @Query('videojuego') videojuego?: string,
    @Query('estado') estado?: string,
    @Query('modalidad') modalidad?: string,
  ) {
    return this.torneosService.findAll({ buscar, videojuego, estado, modalidad });
  }

  // GET /torneos/:id -> detalle público (404 si no existe)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.torneosService.findOne(id);
  }

  // POST /torneos -> crear (solo admin)
  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  create(@Body() dto: CrearTorneoDto) {
    return this.torneosService.create(dto);
  }

  // PATCH /torneos/:id -> editar (solo admin)
  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: ActualizarTorneoDto) {
    return this.torneosService.update(id, dto);
  }

  // DELETE /torneos/:id -> eliminar (solo admin)
  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.torneosService.remove(id);
  }
}
