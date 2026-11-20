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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PartidosService } from './partidos.service';
import { CrearPartidoDto } from './dto/crear-partido.dto';
import { ActualizarPartidoDto } from './dto/actualizar-partido.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

// Controller de partidos: rutas /partidos
@ApiTags('Partidos') // grupo en Swagger
@Controller('partidos')
export class PartidosController {
  constructor(private readonly partidosService: PartidosService) {}

  // GET /partidos?torneoId=1&estado=programado -> calendario público con filtros combinables
  @Get()
  findAll(
    @Query('torneoId', new ParseIntPipe({ optional: true })) torneoId?: number,
    @Query('estado') estado?: string,
  ) {
    return this.partidosService.findAll({ torneoId, estado });
  }

  // GET /partidos/:id -> detalle público con su resultado (404 si no existe)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.partidosService.findOne(id);
  }

  // POST /partidos -> programar un partido (solo admin)
  @Post()
  @ApiBearerAuth() // en Swagger: requiere token
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  create(@Body() dto: CrearPartidoDto) {
    return this.partidosService.create(dto);
  }

  // PATCH /partidos/:id -> reprogramar (solo admin)
  @Patch(':id')
  @ApiBearerAuth() // en Swagger: requiere token
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: ActualizarPartidoDto) {
    return this.partidosService.update(id, dto);
  }

  // DELETE /partidos/:id -> eliminar (solo admin)
  @Delete(':id')
  @ApiBearerAuth() // en Swagger: requiere token
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.partidosService.remove(id);
  }
}
