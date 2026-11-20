import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ResultadosService } from './resultados.service';
import { Resultado } from './entities/resultado.entity';
import { Partido } from '../partidos/entities/partido.entity';
import { Torneo } from '../torneos/entities/torneo.entity';
import { Inscripcion } from '../inscripciones/entities/inscripcion.entity';

// Pruebas unitarias de ResultadosService: resultado oficial y ranking calculado (sin MySQL)
describe('ResultadosService', () => {
  let service: ResultadosService;
  let resultadosRepo: { find: jest.Mock; findOne: jest.Mock; findOneBy: jest.Mock; create: jest.Mock; save: jest.Mock; remove: jest.Mock };
  let partidosRepo: { findOneBy: jest.Mock; save: jest.Mock };
  let torneosRepo: { findOneBy: jest.Mock };
  let inscripcionesRepo: { find: jest.Mock };

  const alfa = { id: 3, nombre: 'Alfa' };
  const beta = { id: 4, nombre: 'Beta' };
  const gamma = { id: 5, nombre: 'Gamma' };
  const liga = { id: 1, nombre: 'Liga', videojuego: 'FIFA', modalidad: 'liga' };
  const copa = { id: 2, nombre: 'Copa', videojuego: 'FIFA', modalidad: 'eliminacion' };

  // Crea un partido de ejemplo (programado) entre dos equipos de un torneo
  const partido = (id: number, torneo: object, local: object, visitante: object) =>
    ({ id, torneo, equipoLocal: local, equipoVisitante: visitante, estado: 'programado' }) as unknown as Partido;

  beforeEach(async () => {
    resultadosRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn((datos) => datos),
      save: jest.fn(async (r) => ({ id: 100, ...r })),
      remove: jest.fn(),
    };
    partidosRepo = { findOneBy: jest.fn(), save: jest.fn() };
    torneosRepo = { findOneBy: jest.fn() };
    inscripcionesRepo = { find: jest.fn() };

    const modulo = await Test.createTestingModule({
      providers: [
        ResultadosService,
        { provide: getRepositoryToken(Resultado), useValue: resultadosRepo },
        { provide: getRepositoryToken(Partido), useValue: partidosRepo },
        { provide: getRepositoryToken(Torneo), useValue: torneosRepo },
        { provide: getRepositoryToken(Inscripcion), useValue: inscripcionesRepo },
      ],
    }).compile();
    service = modulo.get(ResultadosService);
  });

  describe('create (resultado oficial)', () => {
    it('responde 404 si el partido no existe', async () => {
      partidosRepo.findOneBy.mockResolvedValue(null);
      await expect(service.create({ partidoId: 99, puntajeLocal: 1, puntajeVisitante: 0 }, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('responde 409 si el partido ya tiene resultado', async () => {
      partidosRepo.findOneBy.mockResolvedValue(partido(1, liga, alfa, beta));
      resultadosRepo.findOne.mockResolvedValue({ id: 5 });
      await expect(service.create({ partidoId: 1, puntajeLocal: 1, puntajeVisitante: 0 }, 1)).rejects.toThrow(
        ConflictException,
      );
    });

    it('el ganador es el equipo local si tiene más puntos', async () => {
      const p = partido(1, liga, alfa, beta);
      partidosRepo.findOneBy.mockResolvedValue(p);
      resultadosRepo.findOne.mockResolvedValue(null);
      resultadosRepo.findOneBy.mockResolvedValue({ id: 100 });

      await service.create({ partidoId: 1, puntajeLocal: 3, puntajeVisitante: 1 }, 7);

      expect(resultadosRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ ganador: alfa, registradoPor: { id: 7 } }),
      );
    });

    it('el ganador es el visitante si tiene más puntos', async () => {
      partidosRepo.findOneBy.mockResolvedValue(partido(1, liga, alfa, beta));
      resultadosRepo.findOne.mockResolvedValue(null);
      resultadosRepo.findOneBy.mockResolvedValue({ id: 100 });

      await service.create({ partidoId: 1, puntajeLocal: 0, puntajeVisitante: 2 }, 7);

      expect(resultadosRepo.create).toHaveBeenCalledWith(expect.objectContaining({ ganador: beta }));
    });

    it('en una liga el empate se guarda sin ganador', async () => {
      partidosRepo.findOneBy.mockResolvedValue(partido(1, liga, alfa, beta));
      resultadosRepo.findOne.mockResolvedValue(null);
      resultadosRepo.findOneBy.mockResolvedValue({ id: 100 });

      await service.create({ partidoId: 1, puntajeLocal: 2, puntajeVisitante: 2 }, 7);

      expect(resultadosRepo.create).toHaveBeenCalledWith(expect.objectContaining({ ganador: null }));
    });

    it('en eliminación el empate no se permite (400)', async () => {
      partidosRepo.findOneBy.mockResolvedValue(partido(1, copa, alfa, beta));
      resultadosRepo.findOne.mockResolvedValue(null);

      await expect(service.create({ partidoId: 1, puntajeLocal: 1, puntajeVisitante: 1 }, 7)).rejects.toThrow(
        BadRequestException,
      );
      expect(resultadosRepo.save).not.toHaveBeenCalled();
    });

    it('el partido pasa a "jugado" al registrar el resultado', async () => {
      const p = partido(1, liga, alfa, beta);
      partidosRepo.findOneBy.mockResolvedValue(p);
      resultadosRepo.findOne.mockResolvedValue(null);
      resultadosRepo.findOneBy.mockResolvedValue({ id: 100 });

      await service.create({ partidoId: 1, puntajeLocal: 1, puntajeVisitante: 0 }, 7);

      expect(p.estado).toBe('jugado');
      expect(partidosRepo.save).toHaveBeenCalledWith(p);
    });
  });

  describe('remove', () => {
    it('al anular el resultado el partido vuelve a "programado"', async () => {
      const p = { ...partido(1, liga, alfa, beta), estado: 'jugado' } as Partido;
      resultadosRepo.findOneBy.mockResolvedValue({ id: 8, partido: p });

      await service.remove(8);

      expect(resultadosRepo.remove).toHaveBeenCalled();
      expect(p.estado).toBe('programado');
    });
  });

  describe('ranking calculado', () => {
    // Resultado de ejemplo para un partido de la liga
    const resultado = (local: object, visitante: object, pl: number, pv: number) => ({
      partido: partido(1, liga, local, visitante),
      puntajeLocal: pl,
      puntajeVisitante: pv,
    });

    beforeEach(() => {
      torneosRepo.findOneBy.mockResolvedValue(liga);
      // Los tres equipos están inscritos y aceptados en la liga
      inscripcionesRepo.find.mockResolvedValue([{ equipo: alfa }, { equipo: beta }, { equipo: gamma }]);
    });

    it('responde 404 si el torneo no existe', async () => {
      torneosRepo.findOneBy.mockResolvedValue(null);
      await expect(service.ranking(99)).rejects.toThrow(NotFoundException);
    });

    it('sin resultados todos los equipos aparecen con 0 puntos', async () => {
      resultadosRepo.find.mockResolvedValue([]);

      const { tabla } = await service.ranking(1);

      expect(tabla).toHaveLength(3);
      expect(tabla.every((f) => f.puntos === 0 && f.partidosJugados === 0)).toBe(true);
    });

    it('victoria = 3 puntos, empate = 1 punto, derrota = 0', async () => {
      resultadosRepo.find.mockResolvedValue([
        resultado(alfa, beta, 3, 1), // gana Alfa
        resultado(alfa, gamma, 2, 2), // empatan
      ]);

      const { tabla } = await service.ranking(1);
      const puntos = Object.fromEntries(tabla.map((f) => [f.equipo, f.puntos]));

      expect(puntos).toEqual({ Alfa: 4, Gamma: 1, Beta: 0 });
    });

    it('cuenta victorias, empates, derrotas y puntos a favor y en contra', async () => {
      resultadosRepo.find.mockResolvedValue([resultado(alfa, beta, 3, 1), resultado(alfa, gamma, 2, 2)]);

      const { tabla } = await service.ranking(1);
      const filaAlfa = tabla.find((f) => f.equipo === 'Alfa')!;

      expect(filaAlfa).toMatchObject({
        partidosJugados: 2,
        victorias: 1,
        empates: 1,
        derrotas: 0,
        golesFavor: 5,
        golesContra: 3,
        diferencia: 2,
      });
    });

    it('ordena por puntos y desempata por diferencia', async () => {
      resultadosRepo.find.mockResolvedValue([
        resultado(alfa, beta, 3, 1), // Alfa +2
        resultado(gamma, beta, 1, 0), // Gamma +1
      ]);

      const { tabla } = await service.ranking(1);

      // Alfa y Gamma tienen 3 puntos; Alfa queda primero por mejor diferencia
      expect(tabla.map((f) => f.equipo)).toEqual(['Alfa', 'Gamma', 'Beta']);
      expect(tabla.map((f) => f.posicion)).toEqual([1, 2, 3]);
    });

    it('si cambia un resultado, el ranking se recalcula solo (no hay puntos guardados)', async () => {
      resultadosRepo.find.mockResolvedValueOnce([resultado(alfa, beta, 1, 0)]);
      const antes = await service.ranking(1);
      expect(antes.tabla[0]).toMatchObject({ equipo: 'Alfa', puntos: 3 });

      // El administrador corrige el marcador: ahora gana Beta
      resultadosRepo.find.mockResolvedValueOnce([resultado(alfa, beta, 0, 1)]);
      const despues = await service.ranking(1);
      expect(despues.tabla[0]).toMatchObject({ equipo: 'Beta', puntos: 3 });
    });
  });
});
