import { Injectable, Logger, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from './users.service';
import { User, LoginDto, AuthResponse, CreateUserDto } from './users.types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: CreateUserDto): Promise<AuthResponse> {
    const user = await this.usersService.create(dto);
    const token = this.generateToken(user);

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.validatePassword(dto.email, dto.password);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const token = this.generateToken(user);

    this.logger.log(`Usuario autenticado: ${user.email}`);

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async validateUser(userId: string): Promise<Omit<User, 'created_at'>> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado.');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }

  private generateToken(user: User): string {
    const payload = { sub: user.id, email: user.email };
    return this.jwtService.sign(payload);
  }
}