import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, tap, throwError } from 'rxjs';
import {
  MaintenanceAlert,
  NotificationsSummary,
} from '../models/notificacion.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MaintenanceNotificationsService {
  private readonly http = inject(HttpClient);

  private readonly _summary = signal<NotificationsSummary | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal('');
  private readonly _expanded = signal(false);

  readonly summary = this._summary.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly expanded = this._expanded.asReadonly();

  readonly alertas = computed(() => this._summary()?.alertas ?? []);
  readonly vencidos = computed(() => this._summary()?.vencidos ?? 0);
  readonly proximos = computed(() => this._summary()?.proximos ?? 0);
  readonly alDia = computed(() => this._summary()?.alDia ?? 0);
  readonly sinHistorial = computed(() => this._summary()?.sinHistorial ?? 0);
  readonly hasCritical = computed(
    () => (this._summary()?.vencidos ?? 0) > 0 || (this._summary()?.proximos ?? 0) > 0,
  );
  readonly totalAlertas = computed(
    () => this.vencidos() + this.proximos() + this.sinHistorial(),
  );

  load(): void {
    this._loading.set(true);
    this._error.set('');
    this.http
      .get<NotificationsSummary>(`${environment.apiUrl}/notificaciones/mantenimiento`)
      .pipe(
        tap((data) => {
          this._summary.set(data);
          this._loading.set(false);
          this._expanded.set(data.vencidos > 0 || data.proximos > 0);
        }),
        catchError(() => {
          this._error.set('No se pudieron cargar las alertas de mantenimiento.');
          this._loading.set(false);
          return throwError(() => new Error('notifications load failed'));
        }),
      )
      .subscribe();
  }

  refresh(): void {
    this.load();
  }

  clear(): void {
    this._summary.set(null);
    this._error.set('');
    this._loading.set(false);
    this._expanded.set(false);
  }

  toggleExpanded(): void {
    this._expanded.update((v) => !v);
  }

  sortByPriority(alertas: MaintenanceAlert[]): MaintenanceAlert[] {
    const order: Record<string, number> = {
      vencido: 0,
      proximo: 1,
      sin_historial: 2,
      al_dia: 3,
    };
    return [...alertas].sort(
      (a, b) => (order[a.nivel] ?? 9) - (order[b.nivel] ?? 9),
    );
  }
}
