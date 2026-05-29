export type AlertNivel = 'vencido' | 'proximo' | 'al_dia' | 'sin_historial';

export interface MaintenanceAlert {
  motoId: string;
  placa: string;
  marca: string;
  modelo: string;
  nivel: AlertNivel;
  ultimoMantenimiento?: {
    tipo: string;
    fecha: string;
    kilometraje?: number | null;
  };
  proximaFecha?: string;
  proximoKm?: number | null;
  diasRestantes?: number | null;
  kmRestantes?: number | null;
  mensaje: string;
}

export interface NotificationsSummary {
  vencidos: number;
  proximos: number;
  alDia: number;
  sinHistorial: number;
  alertas: MaintenanceAlert[];
}
