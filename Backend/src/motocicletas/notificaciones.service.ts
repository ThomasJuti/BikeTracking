import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { RowDataPacket } from 'mysql2/promise';
import { MysqlService } from '../database/mysql.service';
import {
  AlertNivel,
  MaintenanceAlert,
  NotificationsSummary,
} from './notificaciones.types';

const INTERVALOS: Record<string, { dias: number; km: number }> = {
  preventivo: { dias: 90, km: 3000 },
  revision: { dias: 180, km: 6000 },
};

const PROXIMO_DIAS = 30;
const PROXIMO_KM = 500;

type MotoAlertRow = RowDataPacket & {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  kilometrajeActual: number | null;
};

type LastMaintRow = RowDataPacket & {
  tipo: string;
  fecha: string | Date;
  kilometraje: number | null;
};

@Injectable()
export class NotificacionesService {
  constructor(private readonly mysqlService: MysqlService) {}

  async getMaintenanceAlerts(userId: string): Promise<NotificationsSummary> {
    try {
      const pool = this.mysqlService.getPool();
      const [motos] = await pool.query<MotoAlertRow[]>(
        `
          SELECT id, placa, marca, modelo, kilometraje_actual AS kilometrajeActual
          FROM motos
          WHERE user_id = ?
          ORDER BY placa ASC
        `,
        [userId],
      );

      const alertas: MaintenanceAlert[] = [];
      const today = this.startOfDay(new Date());

      for (const moto of motos) {
        const [lastRows] = await pool.query<LastMaintRow[]>(
          `
            SELECT tipo, fecha, kilometraje
            FROM mantenimientos
            WHERE moto_id = ? AND tipo IN ('preventivo', 'revision')
            ORDER BY fecha DESC, fecha_registro DESC
            LIMIT 1
          `,
          [moto.id],
        );

        if (!lastRows.length) {
          alertas.push({
            motoId: moto.id,
            placa: moto.placa,
            marca: moto.marca,
            modelo: moto.modelo,
            nivel: 'sin_historial',
            mensaje: 'Sin historial de mantenimiento preventivo o revisión.',
          });
          continue;
        }

        const last = lastRows[0];
        const intervalo = INTERVALOS[last.tipo];
        const lastDate = this.startOfDay(new Date(String(last.fecha)));
        const dueDate = new Date(lastDate);
        dueDate.setDate(dueDate.getDate() + intervalo.dias);

        const lastKm =
          last.kilometraje != null ? Number(last.kilometraje) : null;
        const dueKm =
          lastKm != null ? lastKm + intervalo.km : null;
        const kmActual =
          moto.kilometrajeActual != null
            ? Number(moto.kilometrajeActual)
            : null;

        const diasRestantes = this.diffDays(today, dueDate);
        const kmRestantes =
          dueKm != null && kmActual != null ? dueKm - kmActual : null;

        const vencidoPorFecha = today > dueDate;
        const vencidoPorKm =
          kmRestantes != null && kmRestantes < 0;
        const proximoPorFecha =
          !vencidoPorFecha && diasRestantes <= PROXIMO_DIAS;
        const proximoPorKm =
          !vencidoPorKm &&
          kmRestantes != null &&
          kmRestantes >= 0 &&
          kmRestantes <= PROXIMO_KM;

        let nivel: AlertNivel = 'al_dia';
        if (vencidoPorFecha || vencidoPorKm) {
          nivel = 'vencido';
        } else if (proximoPorFecha || proximoPorKm) {
          nivel = 'proximo';
        }

        alertas.push({
          motoId: moto.id,
          placa: moto.placa,
          marca: moto.marca,
          modelo: moto.modelo,
          nivel,
          ultimoMantenimiento: {
            tipo: last.tipo,
            fecha:
              typeof last.fecha === 'string'
                ? last.fecha.slice(0, 10)
                : last.fecha.toISOString().slice(0, 10),
            kilometraje: lastKm,
          },
          proximaFecha: dueDate.toISOString().slice(0, 10),
          proximoKm: dueKm,
          diasRestantes,
          kmRestantes,
          mensaje: this.buildMessage(
            nivel,
            last.tipo,
            diasRestantes,
            kmRestantes,
            dueDate,
            dueKm,
          ),
        });
      }

      return {
        vencidos: alertas.filter((a) => a.nivel === 'vencido').length,
        proximos: alertas.filter((a) => a.nivel === 'proximo').length,
        alDia: alertas.filter((a) => a.nivel === 'al_dia').length,
        sinHistorial: alertas.filter((a) => a.nivel === 'sin_historial').length,
        alertas,
      };
    } catch {
      throw new InternalServerErrorException(
        'No se pudieron calcular las notificaciones de mantenimiento.',
      );
    }
  }

  private startOfDay(d: Date): Date {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  private diffDays(from: Date, to: Date): number {
    const ms = to.getTime() - from.getTime();
    return Math.round(ms / (1000 * 60 * 60 * 24));
  }

  private buildMessage(
    nivel: AlertNivel,
    tipo: string,
    diasRestantes: number,
    kmRestantes: number | null,
    dueDate: Date,
    dueKm: number | null,
  ): string {
    const fechaLimite = dueDate.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const kmText =
      dueKm != null ? ` o ${dueKm.toLocaleString('es-CO')} km` : '';

    if (nivel === 'vencido') {
      const diasVencidos = Math.abs(diasRestantes);
      if (diasRestantes < 0 && kmRestantes != null && kmRestantes < 0) {
        return `Mantenimiento ${tipo} vencido hace ${diasVencidos} días y ${Math.abs(kmRestantes).toLocaleString('es-CO')} km.`;
      }
      if (kmRestantes != null && kmRestantes < 0) {
        return `Mantenimiento ${tipo} vencido por ${Math.abs(kmRestantes).toLocaleString('es-CO')} km.`;
      }
      return `Mantenimiento ${tipo} vencido hace ${diasVencidos} días (límite: ${fechaLimite}${kmText}).`;
    }

    if (nivel === 'proximo') {
      if (kmRestantes != null && kmRestantes <= PROXIMO_KM) {
        return `Próximo ${tipo} en ${diasRestantes} días o ${kmRestantes.toLocaleString('es-CO')} km restantes.`;
      }
      return `Próximo ${tipo} en ${diasRestantes} días (límite: ${fechaLimite}${kmText}).`;
    }

    return `Al día. Próximo ${tipo}: ${fechaLimite}${kmText}.`;
  }
}
