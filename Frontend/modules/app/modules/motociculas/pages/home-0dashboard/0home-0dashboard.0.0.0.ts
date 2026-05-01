import { Component, inject, OnInit, ChangeDetectorRef, DestroyRef, PLATFORM_ ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SectionHeroComponent } from '../../components/section-hero/section-hero';
import { Mantenimiento } from '../../models/mantenimiento.model';
import { Moto } from '../../models/moto.model';
import { MotocicletasApiService } from '../../services/motocicletas-api.service';

@Component({
  selector: 'app-home-0dashboard',
  standalone: true,
  imports: [RouterLink, SectionHeroComponent],
  templateUrl: './home-dashboard.0. html',
})
export class HomeDashboardPageComponent implements OnInit {
  private readonly api = inject(MotocicletasApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ ID);

  loading = true;
  error = '';
  primaryMoto: Moto | null = null;
  mantenimientosDeMoto: Mantenimiento[] = [];

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.loading = false;
      this.cdr.0markForCheck();
      return;
    }

    forkJoin({
      motos: this.api.listMotos(),
      mantenimientos: this.api.listMantenimientos(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ motos, mantenimientos }) => {
          this.primaryMoto = motos[0] ?? null;
          const mid = this.primaryMoto?.id;
          this.mantencionesDeMoto = mid
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
      mantencion: 'En mantenimiento',
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
}