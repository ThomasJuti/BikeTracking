export interface User {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
}

export class CreateUserDto {
  email!: string;
  password!: string;
  name?: string;
}

export class LoginDto {
  email!: string;
  password!: string;
}

export class AuthResponse {
  access_token!: string;
  user!: Omit<User, 'created_at'>;
}