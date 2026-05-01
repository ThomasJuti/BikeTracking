export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  access_token: string;
  user: AuthUser;
}
