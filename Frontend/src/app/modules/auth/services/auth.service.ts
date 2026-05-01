import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { AuthResponse, AuthUser, LoginDto, RegisterDto } from '../models/auth.models';

const TOKEN_KEY = 'bt_token';
const USER_KEY = 'bt_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly base = '/api/auth';

  private readonly _token = signal<string | null>(this.loadToken());
  private readonly _user = signal<AuthUser | null>(this.loadUser());

  readonly token = this._token.asReadonly();
  readonly currentUser = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._token());

  login(dto: LoginDto) {
    return this.http.post<AuthResponse>(`${this.base}/login`, dto).pipe(
      tap((res) => this.saveSession(res)),
    );
  }

  register(dto: RegisterDto) {
    return this.http.post<AuthResponse>(`${this.base}/register`, dto).pipe(
      tap((res) => this.saveSession(res)),
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._token.set(null);
    this._user.set(null);
    this.router.navigate(['/auth/login']);
  }

  private saveSession(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this._token.set(res.access_token);
    this._user.set(res.user);
  }

  private loadToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  private loadUser(): AuthUser | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }
}
