import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { filter } from 'rxjs/operators';
import { SectionHeroComponent } from '../../components/section-hero/section-hero';
import { Mantenimiento } from '../../models/mantenimiento.model';
import { MaintenanceAlert } from '../../models/notificacion.model';
import { Moto } from '../../models/moto.model';
import { MaintenanceNotificationsService } from '../../services/maintenance-notifications.service';
import { MotocicletasApiService } from '../../services/motocicletas-api.service';

@Component({
  selector: 'app-home-dashboard',
  standalone: true,
  imports: [RouterLink, SectionHeroComponent],
  templateUrl: './home-dashboard.html',
})
export class HomeDashboardPageComponent implements OnInit {
  private readonly api = inject(MotocicletasApiService);
  readonly notifications = inject(MaintenanceNotificationsService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  loading = true;
  error = '';
  motos: Moto[] = [];
  primaryMoto: Moto | null = null;
  mantenimientosDeMoto: Mantenimiento[] = [];

  ngOnInit(): void {
    this.loadDashboardData();

    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
        filter((event) => event.urlAfterRedirects.includes('/inicio')),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.loadDashboardData());
  }

  get alertas(): MaintenanceAlert[] {
    return this.notifications.sortByPriority(this.notifications.alertas());
  }

  get summary() {
    return this.notifications.summary();
  }

  private loadDashboardData(): void {
    this.loading = true;
    this.error = '';

    forkJoin({
      motos: this.api.listMotos(),
      mantenimientos: this.api.listMantenimientos(),
    }).subscribe({
      next: ({ motos, mantenimientos }) => {
        this.motos = motos;
        this.primaryMoto = motos[0] ?? null;
        const mid = this.primaryMoto?.id;
        this.mantenimientosDeMoto = mid
          ? mantenimientos
              .filter((m) => m.moto_id === mid)
              .sort(
                (a, b) =>
                  new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
              )
          : [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'No se pudieron cargar los datos del seguimiento personal.';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  prettyState(value: string | undefined): string {
    const map: Record<string, string> = {
      activa: 'Activa',
      mantenimiento: 'En mantenimiento',
      inactiva: 'Inactiva',
    };
    return map[value ?? ''] ?? 'Sin definir';
  }

  formatDate(value: string | undefined): string {
    if (!value) return 'Sin registro';
    return new Date(value).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  nivelLabel(nivel: string): string {
    const map: Record<string, string> = {
      vencido: 'Vencido',
      proximo: 'Próximo',
      sin_historial: 'Sin historial',
      al_dia: 'Al día',
    };
    return map[nivel] ?? nivel;
  }
}
