import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { RegistroDto } from './dto/registro.dto';
import { LoginDto } from './dto/login.dto';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto';

// Service de autenticación: aquí está la lógica de registro, login y perfil
@Injectable()
export class AuthService {
  constructor(
    // Repository de Usuario: permite consultar y guardar en la tabla usuario
    @InjectRepository(Usuario)
    private readonly usuariosRepo: Repository<Usuario>,
    // Lee variables del .env (JWT_SECRET)
    private readonly config: ConfigService,
  ) {}

  // Registra un estudiante nuevo
  async registrar(dto: RegistroDto) {
    // Regla: no se repiten correos
    const existe = await this.usuariosRepo.findOneBy({ correo: dto.correo });
    if (existe) {
      throw new ConflictException('El correo ya está registrado'); // 409
    }

    // Encripta la contraseña con bcrypt (10 rondas); nunca se guarda en texto plano
    const passwordEncriptada = await bcrypt.hash(dto.password, 10);

    // Todo registro nuevo es estudiante; los administradores se crean aparte
    const usuario = this.usuariosRepo.create({
      ...dto,
      password: passwordEncriptada,
      rol: 'estudiante',
    });
    const guardado = await this.usuariosRepo.save(usuario);

    return this.perfil(guardado.id); // devuelve el usuario sin la contraseña
  }

  // Inicia sesión y entrega un token JWT
  async login(dto: LoginDto) {
    // La contraseña tiene select: false, así que hay que pedirla explícitamente
    const usuario = await this.usuariosRepo.findOne({
      where: { correo: dto.correo },
      select: { id: true, correo: true, password: true, rol: true, activo: true },
    });

    // Mismo mensaje si falla el correo o la contraseña (no se dan pistas)
    const passwordCorrecta =
      usuario && (await bcrypt.compare(dto.password, usuario.password));
    if (!usuario || !passwordCorrecta) {
      throw new UnauthorizedException('Correo o contraseña incorrectos'); // 401
    }
    if (!usuario.activo) {
      throw new UnauthorizedException('La cuenta está desactivada'); // 401
    }

    // Firma el token con el id, correo y rol; dura 2 horas
    const token = jwt.sign(
      { id: usuario.id, correo: usuario.correo, rol: usuario.rol },
      this.config.getOrThrow<string>('JWT_SECRET'),
      { expiresIn: '2h' },
    );

    return { token, usuario: await this.perfil(usuario.id) };
  }

  // Devuelve los datos del usuario (sin contraseña)
  async perfil(id: number) {
    const usuario = await this.usuariosRepo.findOneBy({ id });
    if (!usuario) {
      throw new NotFoundException(`No existe el usuario con id ${id}`); // 404
    }
    return usuario;
  }

  // Actualiza nombre y/o alias del usuario autenticado
  async actualizarPerfil(id: number, dto: ActualizarPerfilDto) {
    const usuario = await this.perfil(id);
    Object.assign(usuario, dto); // copia solo los campos que llegaron
    await this.usuariosRepo.save(usuario);
    return this.perfil(id);
  }
}
