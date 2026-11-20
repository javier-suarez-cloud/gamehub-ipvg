import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PartidosService } from './partidos.service';
import { Partido } from './entities/partido.entity';
import { Torneo } from '../torneos/entities/torneo.entity';
import { Equipo } from '../equipos/entities/equipo.entity';
import { Inscripcion } from '../inscripciones/entities/inscripcion.entity';
import { Resultado } from '../resultados/entities/resultado.entity';

// Pruebas unitarias de PartidosService: reglas para programar un partido (sin MySQL)
describe('PartidosService', () => {
  let service: PartidosService;
  let partidosRepo: { find: jest.Mock; findOneBy: jest.Mock; create: jest.Mock; save: jest.Mock; remove: jest.Mock };
  let torneosRepo: { findOneBy: jest.Mock };
  let equiposRepo: { findOneBy: jest.Mock };
  let inscripcionesRepo: { findOneBy: jest.Mock };
  let resultadosRepo: { find: jest.Mock };

  const torneo = { id: 1, nombre: 'Liga IPVG', modalidad: 'liga', estado: 'abierto' } as Torneo;
  const alfa = { id: 3, nombre: 'Alfa' } as Equipo;
  const beta = { id: 4, nombre: 'Beta' } as Equipo;
  const fechaHora = '2026-12-21T18:00';

  beforeEach(async () => {
    partidosRepo = {
      find: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn((datos) => datos),
      save: jest.fn(async (p) => ({ id: 50, ...p })),
      remove: jest.fn(),
    };
    torneosRepo = { findOneBy: jest.fn().mockResolvedValue(torneo) };
    equiposRepo = { findOneBy: jest.fn(async ({ id }) => [alfa, beta].find((e) => e.id === id) ?? null) };
    inscripcionesRepo = { findOneBy: jest.fn().mockResolvedValue({ id: 1 }) }; // por defecto: ambos inscritos
    resultadosRepo = { find: jest.fn().mockResolvedValue([]) };

    const modulo = await Test.createTestingModule({
      providers: [
        PartidosService,
        { provide: getRepositoryToken(Partido), useValue: partidosRepo },
        { provide: getRepositoryToken(Torneo), useValue: torneosRepo },
        { provide: getRepositoryToken(Equipo), useValue: equiposRepo },
        { provide: getRepositoryToken(Inscripcion), useValue: inscripcionesRepo },
        { provide: getRepositoryToken(Resultado), useValue: resultadosRepo },
      ],
    }).compile();
    service = modulo.get(PartidosService);
  });

  describe('create (reglas de negocio)', () => {
    const dto = { torneoId: 1, equipoLocalId: 3, equipoVisitanteId: 4, fechaHora, ronda: 'Fecha 1' };

    it('programa el partido cuando los dos equipos están inscritos', async () => {
      // la última llamada (findOne del partido recién guardado) devuelve el partido
      partidosRepo.findOneBy.mockResolvedValue({ id: 50, ronda: 'Fecha 1' });

      const resultado = await service.create(dto);

      expect(partidosRepo.save).toHaveBeenCalled();
      expect(resultado).toMatchObject({ id: 50, ronda: 'Fecha 1', resultado: null });
    });

    it('responde 404 si el torneo no existe', async () => {
      torneosRepo.findOneBy.mockResolvedValue(null);
      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('responde 400 si el equipo local y el visitante son el mismo', async () => {
      await expect(service.create({ ...dto, equipoVisitanteId: 3 })).rejects.toThrow(BadRequestException);
      expect(partidosRepo.save).not.toHaveBeenCalled();
    });

    it('responde 400 si el torneo está finalizado', async () => {
      torneosRepo.findOneBy.mockResolvedValue({ ...torneo, estado: 'finalizado' });
      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('responde 404 si un equipo no existe', async () => {
      await expect(service.create({ ...dto, equipoVisitanteId: 99 })).rejects.toThrow(NotFoundException);
    });

    it('responde 400 si un equipo no está inscrito en el torneo', async () => {
      // el local sí está inscrito y el visitante no
      inscripcionesRepo.findOneBy.mockResolvedValueOnce({ id: 1 }).mockResolvedValueOnce(null);
      await expect(service.create(dto)).rejects.toThrow(/no está inscrito/);
      expect(partidosRepo.save).not.toHaveBeenCalled();
    });

    it('solo acepta inscripciones aceptadas', async () => {
      partidosRepo.findOneBy.mockResolvedValue({ id: 50 });
      await service.create(dto);
      expect(inscripcionesRepo.findOneBy).toHaveBeenCalledWith(
        expect.objectContaining({ estado: 'aceptada' }),
      );
    });
  });

  describe('findOne', () => {
    it('responde 404 si el partido no existe', async () => {
      partidosRepo.findOneBy.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('incluye un resumen del resultado cuando el partido ya se jugó', async () => {
      partidosRepo.findOneBy.mockResolvedValue({ id: 7, estado: 'jugado' });
      resultadosRepo.find.mockResolvedValue([
        { id: 2, partido: { id: 7 }, puntajeLocal: 3, puntajeVisitante: 1, ganador: { id: 3, nombre: 'Alfa' } },
      ]);

      const partido = await service.findOne(7);

      expect(partido.resultado).toEqual({
        id: 2,
        puntajeLocal: 3,
        puntajeVisitante: 1,
        ganador: { id: 3, nombre: 'Alfa' },
      });
    });
  });

  describe('update', () => {
    it('no deja modificar un partido ya jugado (400)', async () => {
      partidosRepo.findOneBy.mockResolvedValue({ id: 7, estado: 'jugado' });
      await expect(service.update(7, { ronda: 'Final' })).rejects.toThrow(BadRequestException);
    });

    it('reprograma un partido pendiente', async () => {
      const partido = { id: 7, estado: 'programado', ronda: 'Fecha 1' };
      partidosRepo.findOneBy.mockResolvedValue(partido);

      await service.update(7, { ronda: 'Semifinal' });

      expect(partido.ronda).toBe('Semifinal');
      expect(partidosRepo.save).toHaveBeenCalledWith(partido);
    });
  });
});
