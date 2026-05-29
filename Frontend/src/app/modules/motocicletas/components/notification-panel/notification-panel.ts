import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MaintenanceNotificationsService } from '../../services/maintenance-notifications.service';

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './notification-panel.html',
  styleUrl: './notification-panel.css',
})
export class NotificationPanelComponent {
  readonly notifications = inject(MaintenanceNotificationsService);

  nivelIcon(nivel: string): string {
    const map: Record<string, string> = {
      vencido: 'bi-exclamation-octagon-fill',
      proximo: 'bi-exclamation-triangle-fill',
      sin_historial: 'bi-info-circle-fill',
      al_dia: 'bi-check-circle-fill',
    };
    return map[nivel] ?? 'bi-bell';
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
