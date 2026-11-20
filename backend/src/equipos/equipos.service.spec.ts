import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { EquiposService } from './equipos.service';
import { Equipo } from './entities/equipo.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';

// Pruebas unitarias de EquiposService: los repositorios son falsos (mocks), no se usa MySQL
describe('EquiposService', () => {
  let service: EquiposService;
  let equiposRepo: { find: jest.Mock; findOneBy: jest.Mock; create: jest.Mock; save: jest.Mock; remove: jest.Mock };
  let usuariosRepo: { findOneBy: jest.Mock };

  // Datos de ejemplo: el usuario 1 es el capitán del equipo; el 2 es un estudiante cualquiera
  const capitan = { id: 1, nombre: 'Fabian', alias: 'fabi' } as Usuario;
  const jugador = { id: 2, nombre: 'Otro', alias: 'otro' } as Usuario;
  const comoCapitan = { id: 1, rol: 'estudiante' };
  const comoOtro = { id: 2, rol: 'estudiante' };
  const comoAdmin = { id: 9, rol: 'admin' };

  // Cada prueba parte con un equipo nuevo para que no se contaminen entre sí
  let equipo: Equipo;

  beforeEach(async () => {
    equipo = { id: 10, nombre: 'Los Pumas', juegoPreferido: 'FIFA', estado: 'activo', capitan, integrantes: [capitan] } as Equipo;
    equiposRepo = {
      find: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn((datos) => datos),
      save: jest.fn(async (e) => ({ id: 10, ...e })),
      remove: jest.fn(),
    };
    usuariosRepo = { findOneBy: jest.fn() };

    const modulo = await Test.createTestingModule({
      providers: [
        EquiposService,
        { provide: getRepositoryToken(Equipo), useValue: equiposRepo },
        { provide: getRepositoryToken(Usuario), useValue: usuariosRepo },
      ],
    }).compile();
    service = modulo.get(EquiposService);
  });

  describe('findOne', () => {
    it('devuelve el equipo si existe', async () => {
      equiposRepo.findOneBy.mockResolvedValue(equipo);
      await expect(service.findOne(10)).resolves.toBe(equipo);
    });

    it('responde 404 si el equipo no existe', async () => {
      equiposRepo.findOneBy.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('deja al usuario conectado como capitán e integrante', async () => {
      // 1ª llamada: validar que el nombre esté libre; 2ª: findOne con el id guardado
      equiposRepo.findOneBy.mockResolvedValueOnce(null).mockResolvedValueOnce(equipo);
      usuariosRepo.findOneBy.mockResolvedValue(capitan);

      await service.create({ nombre: 'Los Pumas', juegoPreferido: 'FIFA' }, comoCapitan);

      expect(equiposRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ nombre: 'Los Pumas', capitan, integrantes: [capitan] }),
      );
    });

    it('responde 409 si ya existe un equipo con ese nombre', async () => {
      equiposRepo.findOneBy.mockResolvedValue(equipo);
      await expect(
        service.create({ nombre: 'Los Pumas', juegoPreferido: 'FIFA' }, comoCapitan),
      ).rejects.toThrow(ConflictException);
      expect(equiposRepo.save).not.toHaveBeenCalled(); // no se guardó nada
    });
  });

  describe('permisos (capitán o admin)', () => {
    beforeEach(() => equiposRepo.findOneBy.mockResolvedValue(equipo));

    it('un estudiante que no es capitán no puede editar (403)', async () => {
      await expect(service.update(10, { estado: 'inactivo' }, comoOtro)).rejects.toThrow(ForbiddenException);
    });

    it('un estudiante que no es capitán no puede eliminar (403)', async () => {
      await expect(service.remove(10, comoOtro)).rejects.toThrow(ForbiddenException);
      expect(equiposRepo.remove).not.toHaveBeenCalled();
    });

    it('el capitán puede editar el estado', async () => {
      await service.update(10, { estado: 'inactivo' }, comoCapitan);
      expect(equiposRepo.save).toHaveBeenCalledWith(expect.objectContaining({ estado: 'inactivo' }));
    });

    it('un administrador puede eliminar aunque no sea capitán', async () => {
      await expect(service.remove(10, comoAdmin)).resolves.toEqual({ mensaje: 'Equipo 10 eliminado' });
      expect(equiposRepo.remove).toHaveBeenCalledWith(equipo);
    });
  });

  describe('integrantes', () => {
    it('agrega un jugador nuevo al equipo', async () => {
      equiposRepo.findOneBy.mockResolvedValue(equipo);
      usuariosRepo.findOneBy.mockResolvedValue(jugador);

      await service.agregarIntegrante(10, 2, comoCapitan);

      expect(equipo.integrantes).toContain(jugador);
      expect(equiposRepo.save).toHaveBeenCalled();
    });

    it('responde 409 si el jugador ya es integrante', async () => {
      equiposRepo.findOneBy.mockResolvedValue(equipo);
      await expect(service.agregarIntegrante(10, 1, comoCapitan)).rejects.toThrow(ConflictException);
    });

    it('responde 404 si el usuario a agregar no existe', async () => {
      equiposRepo.findOneBy.mockResolvedValue(equipo);
      usuariosRepo.findOneBy.mockResolvedValue(null);
      await expect(service.agregarIntegrante(10, 77, comoCapitan)).rejects.toThrow(NotFoundException);
    });

    it('no permite quitar al capitán (400)', async () => {
      equiposRepo.findOneBy.mockResolvedValue(equipo);
      await expect(service.quitarIntegrante(10, 1, comoCapitan)).rejects.toThrow(BadRequestException);
    });

    it('quita a un integrante que sí está en el equipo', async () => {
      equipo.integrantes = [capitan, jugador];
      equiposRepo.findOneBy.mockResolvedValue(equipo);

      await service.quitarIntegrante(10, 2, comoCapitan);

      expect(equipo.integrantes).toEqual([capitan]);
    });

    it('responde 404 si el usuario no es integrante', async () => {
      equiposRepo.findOneBy.mockResolvedValue(equipo);
      await expect(service.quitarIntegrante(10, 2, comoCapitan)).rejects.toThrow(NotFoundException);
    });
  });
});
