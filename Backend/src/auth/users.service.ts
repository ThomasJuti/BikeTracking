import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { MysqlService } from '../database/mysql.service';
import { User, CreateUserDto } from './users.types';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly mysql: MysqlService) {}

  async findByEmail(email: string): Promise<User | null> {
    const [rows] = await this.mysql.getPool().query(
      'SELECT id, email, name, created_at FROM users WHERE email = ?',
      [email.toLowerCase()],
    );
    const result = rows as User[];
    return result[0] ?? null;
  }

  async findById(id: string): Promise<User | null> {
    const [rows] = await this.mysql.getPool().query(
      'SELECT id, email, name, created_at FROM users WHERE id = ?',
      [id],
    );
    const result = rows as User[];
    return result[0] ?? null;
  }

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException('El correo electrónico ya está registrado.');
    }

    const id = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const name = dto.name ?? null;

    await this.mysql.getPool().query(
      'INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)',
      [id, dto.email.toLowerCase(), passwordHash, name],
    );

    this.logger.log(`Usuario creado: ${dto.email}`);

    return {
      id,
      email: dto.email.toLowerCase(),
      name,
      created_at: new Date().toISOString(),
    };
  }

  async validatePassword(email: string, password: string): Promise<User | null> {
    const [rows] = await this.mysql.getPool().query(
      'SELECT id, email, password_hash, name, created_at FROM users WHERE email = ?',
      [email.toLowerCase()],
    );
    const result = rows as (User & { password_hash: string })[];
    if (!result[0]) {
      return null;
    }

    const user = result[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return null;
    }

    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }
}