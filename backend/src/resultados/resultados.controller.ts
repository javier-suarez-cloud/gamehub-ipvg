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
import { ResultadosService } from './resultados.service';
import { RegistrarResultadoDto, ActualizarResultadoDto } from './dto/guardar-resultado.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

// Tipo de la petición con el usuario que dejó el AuthGuard
type PeticionConUsuario = { usuario: { id: number; rol: string } };

// Controller de resultados: rutas /resultados
@Controller('resultados')
export class ResultadosController {
  constructor(private readonly resultadosService: ResultadosService) {}

  // GET /resultados?torneoId=1 -> resultados oficiales (público)
  @Get()
  findAll(@Query('torneoId', new ParseIntPipe({ optional: true })) torneoId?: number) {
    return this.resultadosService.findAll(torneoId);
  }

  // GET /resultados/:id -> detalle (404 si no existe)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.resultadosService.findOne(id);
  }

  // POST /resultados -> registrar el resultado oficial de un partido (solo admin)
  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  create(@Body() dto: RegistrarResultadoDto, @Req() req: PeticionConUsuario) {
    return this.resultadosService.create(dto, req.usuario.id);
  }

  // PATCH /resultados/:id -> corregir los puntajes (solo admin)
  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarResultadoDto,
    @Req() req: PeticionConUsuario,
  ) {
    return this.resultadosService.update(id, dto, req.usuario.id);
  }

  // DELETE /resultados/:id -> anular el resultado (solo admin)
  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.resultadosService.remove(id);
  }
}

// Controller del ranking: ruta /ranking (la tabla se calcula, no se guarda)
@Controller('ranking')
export class RankingController {
  constructor(private readonly resultadosService: ResultadosService) {}

  // GET /ranking?torneoId=1 -> tabla de posiciones del torneo (pública)
  @Get()
  ranking(@Query('torneoId', ParseIntPipe) torneoId: number) {
    return this.resultadosService.ranking(torneoId);
  }
}
