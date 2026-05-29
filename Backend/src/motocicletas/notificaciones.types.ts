export type AlertNivel = 'vencido' | 'proximo' | 'al_dia' | 'sin_historial';

export interface UltimoMantenimientoRef {
  tipo: string;
  fecha: string;
  kilometraje?: number | null;
}

export interface MaintenanceAlert {
  motoId: string;
  placa: string;
  marca: string;
  modelo: string;
  nivel: AlertNivel;
  ultimoMantenimiento?: UltimoMantenimientoRef;
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
