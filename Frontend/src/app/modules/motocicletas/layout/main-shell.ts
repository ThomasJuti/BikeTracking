import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-main-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar bg-panel border-bottom py-3">
      <div class="container d-flex flex-wrap justify-content-between align-items-center gap-2">
        <a class="navbar-brand text-white mb-0 fs-3 d-flex align-items-center gap-2" routerLink="/inicio">
          <i class="bi bi-speedometer2 text-primary"></i>
          BIKETRACKING<span class="text-primary">_</span>
        </a>
        <ul class="nav gap-4 align-items-center">
          <li class="nav-item">
            <a
              class="nav-link text-muted px-0 text-uppercase"
              routerLink="/inicio"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: true }"
              >Inicio</a
            >
          </li>
          <li class="nav-item">
            <a
              class="nav-link text-muted px-0 text-uppercase"
              routerLink="/mi-moto"
              routerLinkActive="active"
              >Mi moto</a
            >
          </li>
          <li class="nav-item">
            <a
              class="nav-link text-muted px-0 text-uppercase"
              routerLink="/mantenimiento"
              routerLinkActive="active"
              >Mantenimiento</a
            >
          </li>
          <li class="nav-item ms-md-4 d-flex align-items-center gap-3">
            @if (auth.currentUser(); as user) {
              <span class="d-none d-md-inline text-muted small tracking">
                {{ user.name ?? user.email }}
              </span>
            }
            <button
              id="btn-logout"
              type="button"
              class="btn btn-sm btn-outline-secondary"
              (click)="auth.logout()"
              title="Cerrar sesión"
            >
              <i class="bi bi-power"></i>
            </button>
          </li>
        </ul>
      </div>
    </nav>

    <main class="container py-5">
      <router-outlet />
    </main>
  `,
  styles: [
    `
      .navbar {
        background-color: var(--bg-panel);
        border-bottom: 1px solid var(--line-color);
      }
      .navbar-brand {
        font-family: 'Oswald', sans-serif;
        font-weight: 700;
        letter-spacing: 0.05em;
      }
      .nav-link {
        font-family: 'Oswald', sans-serif;
        font-weight: 500;
        font-size: 1.05rem;
        letter-spacing: 0.05em;
        transition: color 0.2s ease, text-shadow 0.2s ease;
        position: relative;
      }
      .nav-link::after {
        content: '';
        position: absolute;
        bottom: -5px;
        left: 0;
        width: 100%;
        height: 2px;
        background: var(--neon-red);
        transform: scaleX(0);
        transform-origin: right;
        transition: transform 0.3s ease;
      }
      .nav-link:hover {
        color: #fff !important;
      }
      .nav-link.active {
        color: #fff !important;
        text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
      }
      .nav-link.active::after {
        transform: scaleX(1);
        transform-origin: left;
      }
    `,
  ],
})
export class MainShellComponent {
  readonly auth = inject(AuthService);
}
