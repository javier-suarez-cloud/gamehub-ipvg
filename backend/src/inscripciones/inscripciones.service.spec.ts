import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InscripcionesService } from './inscripciones.service';
import { Inscripcion } from './entities/inscripcion.entity';
import { Torneo } from '../torneos/entities/torneo.entity';
import { Equipo } from '../equipos/entities/equipo.entity';

// Pruebas de las reglas de inscripción: duplicada, cupo máximo y plazo cerrado (sin MySQL)
describe('InscripcionesService', () => {
  let service: InscripcionesService;
  let inscripcionesRepo: { find: jest.Mock; findOneBy: jest.Mock; count: jest.Mock; create: jest.Mock; save: jest.Mock };
  let torneosRepo: { findOneBy: jest.Mock };
  let equiposRepo: { findOneBy: jest.Mock };

  // Torneo abierto con el plazo de inscripción en el futuro, cupo para 2 equipos
  const torneoAbierto = { id: 1, estado: 'abierto', cierreInscripcion: '2099-12-31', cupoMaximo: 2 } as Torneo;
  const equipo = { id: 3, nombre: 'Alfa', estado: 'activo', capitan: { id: 1 } } as Equipo;
  const comoCapitan = { id: 1, rol: 'estudiante' };
  const dto = { torneoId: 1, equipoId: 3 };

  beforeEach(async () => {
    inscripcionesRepo = {
      find: jest.fn(),
      findOneBy: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn((datos) => datos),
      save: jest.fn(async (i) => ({ id: 20, ...i })),
    };
    torneosRepo = { findOneBy: jest.fn().mockResolvedValue(torneoAbierto) };
    equiposRepo = { findOneBy: jest.fn().mockResolvedValue(equipo) };

    const modulo = await Test.createTestingModule({
      providers: [
        InscripcionesService,
        { provide: getRepositoryToken(Inscripcion), useValue: inscripcionesRepo },
        { provide: getRepositoryToken(Torneo), useValue: torneosRepo },
        { provide: getRepositoryToken(Equipo), useValue: equiposRepo },
      ],
    }).compile();
    service = modulo.get(InscripcionesService);
  });

  it('inscribe al equipo cuando se cumplen todas las reglas', async () => {
    // 1ª llamada: revisar que no esté inscrito; 2ª: findOne de la inscripción guardada
    inscripcionesRepo.findOneBy.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 20 });

    await service.create(dto, comoCapitan);

    expect(inscripcionesRepo.save).toHaveBeenCalled();
  });

  it('responde 404 si el torneo o el equipo no existen', async () => {
    torneosRepo.findOneBy.mockResolvedValue(null);
    await expect(service.create(dto, comoCapitan)).rejects.toThrow(NotFoundException);

    torneosRepo.findOneBy.mockResolvedValue(torneoAbierto);
    equiposRepo.findOneBy.mockResolvedValue(null);
    await expect(service.create(dto, comoCapitan)).rejects.toThrow(NotFoundException);
  });

  it('solo el capitán o un admin pueden inscribir (403)', async () => {
    await expect(service.create(dto, { id: 2, rol: 'estudiante' })).rejects.toThrow(ForbiddenException);
  });

  it('no deja inscribir cuando el plazo de inscripción ya cerró (400)', async () => {
    torneosRepo.findOneBy.mockResolvedValue({ ...torneoAbierto, cierreInscripcion: '2000-01-01' });
    await expect(service.create(dto, comoCapitan)).rejects.toThrow(/cerradas/);
  });

  it('no deja inscribir si el torneo no está abierto (400)', async () => {
    torneosRepo.findOneBy.mockResolvedValue({ ...torneoAbierto, estado: 'en_curso' });
    await expect(service.create(dto, comoCapitan)).rejects.toThrow(BadRequestException);
  });

  it('no deja inscribir un equipo inactivo (400)', async () => {
    equiposRepo.findOneBy.mockResolvedValue({ ...equipo, estado: 'inactivo' });
    await expect(service.create(dto, comoCapitan)).rejects.toThrow(/activos/);
  });

  it('un equipo no se puede inscribir dos veces en el mismo torneo (409)', async () => {
    inscripcionesRepo.findOneBy.mockResolvedValue({ id: 5 }); // ya existe la inscripción
    await expect(service.create(dto, comoCapitan)).rejects.toThrow(ConflictException);
    expect(inscripcionesRepo.save).not.toHaveBeenCalled();
  });

  it('no deja superar el cupo máximo del torneo (400)', async () => {
    inscripcionesRepo.findOneBy.mockResolvedValue(null);
    inscripcionesRepo.count.mockResolvedValue(2); // el cupo es 2 y ya hay 2 aceptadas
    await expect(service.create(dto, comoCapitan)).rejects.toThrow(/cupo máximo/);
    expect(inscripcionesRepo.save).not.toHaveBeenCalled();
  });

  it('sí deja inscribir cuando todavía queda un cupo libre', async () => {
    inscripcionesRepo.findOneBy.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 20 });
    inscripcionesRepo.count.mockResolvedValue(1); // 1 de 2 cupos usados

    await expect(service.create(dto, comoCapitan)).resolves.toBeDefined();
  });
});
