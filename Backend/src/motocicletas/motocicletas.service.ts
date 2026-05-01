import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { MysqlService } from '../database/mysql.service';
import { Mantenimiento, Moto } from './motocicletas.types';

type MotoRow = RowDataPacket & {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  cilindraje: string;
  estado: string;
  propietario: string;
  fechaRegistro: string | Date;
};

type MantenimientoRow = RowDataPacket & {
  id: string;
  moto_id: string;
  tipo: string;
  descripcion: string;
  fecha: string | Date;
  costo: number;
  tecnico: string;
  fechaRegistro: string | Date;
};

@Injectable()
export class MotocicletasService {
  constructor(private readonly mysqlService: MysqlService) {}

  private normalize(value: unknown): string {
    return String(value ?? '').trim();
  }

  private toIso(value: string | Date): string {
    const d = value instanceof Date ? value : new Date(value);
    return d.toISOString();
  }

  private mapMoto(row: MotoRow): Moto {
    return {
      id: row.id,
      placa: row.placa,
      marca: row.marca,
      modelo: row.modelo,
      anio: row.anio,
      cilindraje: row.cilindraje,
      estado: row.estado,
      propietario: row.propietario,
      fechaRegistro: this.toIso(row.fechaRegistro),
    };
  }

  private mapMantenimiento(row: MantenimientoRow): Mantenimiento {
    return {
      id: row.id,
      moto_id: row.moto_id,
      tipo: row.tipo,
      descripcion: row.descripcion,
      fecha:
        typeof row.fecha === 'string'
          ? row.fecha
          : row.fecha.toISOString().slice(0, 10),
      costo: Number(row.costo),
      tecnico: row.tecnico,
      fechaRegistro: this.toIso(row.fechaRegistro),
    };
  }

  private async validateMoto(
    payload: Record<string, unknown>,
    currentId: string | null = null,
  ): Promise<string[]> {
    const errors: string[] = [];
    const required = [
      'placa',
      'marca',
      'modelo',
      'anio',
      'cilindraje',
      'estado',
      'propietario',
    ];

    for (const field of required) {
      if (!this.normalize(payload[field])) {
        errors.push(`El campo '${field}' es obligatorio.`);
      }
    }

    const anio = Number(payload.anio);
    const currentYear = new Date().getFullYear() + 1;
    if (!Number.isInteger(anio) || anio < 1900 || anio > currentYear) {
      errors.push('El anio debe ser un numero valido.');
    }

    const estadosPermitidos = ['activa', 'mantenimiento', 'inactiva'];
    const estado = this.normalize(payload.estado).toLowerCase();
    if (estado && !estadosPermitidos.includes(estado)) {
      errors.push('El estado debe ser activa, mantenimiento o inactiva.');
    }

    const placaInput = this.normalize(payload.placa).toUpperCase();
    if (placaInput) {
      const pool = this.mysqlService.getPool();
      const [duplicadas] = await pool.query<RowDataPacket[]>(
        `SELECT id FROM motos WHERE UPPER(placa) = ? AND (? IS NULL OR id <> ?) LIMIT 1`,
        [placaInput, currentId, currentId],
      );
      if (duplicadas.length > 0) {
        errors.push('La placa ya existe.');
      }
    }

    return errors;
  }

  async findAllMotos(q?: string, estado?: string): Promise<Moto[]> {
    try {
      const pool = this.mysqlService.getPool();
      const sql = `
        SELECT
          id, placa, marca, modelo, anio, cilindraje, estado, propietario,
          fecha_registro AS fechaRegistro
        FROM motos
        WHERE (? = '' OR estado = ?)
          AND (? = '' OR CONCAT(placa, ' ', marca, ' ', modelo, ' ', propietario) LIKE ?)
        ORDER BY fecha_registro DESC
      `;
      const estadoParam = this.normalize(estado).toLowerCase();
      const qParam = this.normalize(q);
      const likeParam = `%${qParam}%`;
      const [rows] = await pool.query<MotoRow[]>(sql, [
        estadoParam,
        estadoParam,
        qParam,
        likeParam,
      ]);
      return rows.map((r) => this.mapMoto(r));
    } catch {
      throw new InternalServerErrorException(
        'No se pudo obtener la lista de motos.',
      );
    }
  }

  async findOneMoto(id: string): Promise<Moto> {
    try {
      const pool = this.mysqlService.getPool();
      const [rows] = await pool.query<MotoRow[]>(
        `
          SELECT
            id, placa, marca, modelo, anio, cilindraje, estado, propietario,
            fecha_registro AS fechaRegistro
          FROM motos
          WHERE id = ?
          LIMIT 1
        `,
        [id],
      );
      if (!rows.length) {
        throw new NotFoundException('Motocicleta no encontrada.');
      }
      return this.mapMoto(rows[0]);
    } catch (e) {
      if (e instanceof NotFoundException) throw e;
      throw new InternalServerErrorException(
        'No se pudo obtener la motocicleta.',
      );
    }
  }

  async createMoto(payload: Record<string, unknown>): Promise<Moto> {
    const errors = await this.validateMoto(payload);
    if (errors.length) {
      throw new BadRequestException({ message: 'Validacion fallida.', errors });
    }

    try {
      const pool = this.mysqlService.getPool();
      const placa = this.normalize(payload.placa).toUpperCase();
      const marca = this.normalize(payload.marca);
      const modelo = this.normalize(payload.modelo);
      const anio = Number(payload.anio);
      const cilindraje = this.normalize(payload.cilindraje);
      const estado = this.normalize(payload.estado).toLowerCase();
      const propietario = this.normalize(payload.propietario);

      await pool.query<ResultSetHeader>(
        `
          INSERT INTO motos (
            id, placa, marca, modelo, anio, cilindraje, estado, propietario
          )
          VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)
        `,
        [placa, marca, modelo, anio, cilindraje, estado, propietario],
      );

      const [rows] = await pool.query<MotoRow[]>(
        `
          SELECT
            id, placa, marca, modelo, anio, cilindraje, estado, propietario,
            fecha_registro AS fechaRegistro
          FROM motos
          WHERE placa = ?
          ORDER BY fecha_registro DESC
          LIMIT 1
        `,
        [placa],
      );
      return this.mapMoto(rows[0]);
    } catch {
      throw new InternalServerErrorException(
        'No se pudo crear la motocicleta.',
      );
    }
  }

  async updateMoto(id: string, payload: Record<string, unknown>): Promise<Moto> {
    const errors = await this.validateMoto(payload, id);
    if (errors.length) {
      throw new BadRequestException({ message: 'Validacion fallida.', errors });
    }

    try {
      const pool = this.mysqlService.getPool();
      const [existe] = await pool.query<RowDataPacket[]>(
        'SELECT id FROM motos WHERE id = ? LIMIT 1',
        [id],
      );
      if (!existe.length) {
        throw new NotFoundException('Motocicleta no encontrada.');
      }

      await pool.query<ResultSetHeader>(
        `
          UPDATE motos
          SET placa = ?, marca = ?, modelo = ?, anio = ?, cilindraje = ?,
              estado = ?, propietario = ?
          WHERE id = ?
        `,
        [
          this.normalize(payload.placa).toUpperCase(),
          this.normalize(payload.marca),
          this.normalize(payload.modelo),
          Number(payload.anio),
          this.normalize(payload.cilindraje),
          this.normalize(payload.estado).toLowerCase(),
          this.normalize(payload.propietario),
          id,
        ],
      );

      return this.findOneMoto(id);
    } catch (e) {
      if (e instanceof BadRequestException || e instanceof NotFoundException) {
        throw e;
      }
      throw new InternalServerErrorException(
        'No se pudo actualizar la motocicleta.',
      );
    }
  }

  async deleteMoto(id: string): Promise<void> {
    try {
      const pool = this.mysqlService.getPool();
      // Eliminar registros de mantenimientos asociados para evitar error de clave foránea
      await pool.query('DELETE FROM mantenimientos WHERE moto_id = ?', [id]);
      
      const [result] = await pool.query<ResultSetHeader>(
        'DELETE FROM motos WHERE id = ?',
        [id],
      );
      if (!result.affectedRows) {
        throw new NotFoundException('Motocicleta no encontrada.');
      }
    } catch (e) {
      if (e instanceof NotFoundException) throw e;
      throw new InternalServerErrorException(
        'No se pudo eliminar la motocicleta.',
      );
    }
  }

  async findAllMantenimientos(): Promise<Mantenimiento[]> {
    try {
      const pool = this.mysqlService.getPool();
      const [rows] = await pool.query<MantenimientoRow[]>(
        `
          SELECT
            id, moto_id, tipo, descripcion, fecha, costo, tecnico,
            fecha_registro AS fechaRegistro
          FROM mantenimientos
          ORDER BY fecha DESC, fecha_registro DESC
        `,
      );
      return rows.map((r) => this.mapMantenimiento(r));
    } catch {
      throw new InternalServerErrorException(
        'No se pudo obtener la lista de mantenimientos.',
      );
    }
  }

  async createMantenimiento(
    payload: Record<string, unknown>,
  ): Promise<Mantenimiento> {
    const errors: string[] = [];

    const required = [
      'moto_id',
      'tipo',
      'descripcion',
      'fecha',
      'tecnico',
      'costo',
    ];
    for (const field of required) {
      if (!this.normalize(payload[field])) {
        errors.push(`El campo '${field}' es obligatorio.`);
      }
    }

    const tiposPermitidos = ['preventivo', 'correctivo', 'revision'];
    const tipo = this.normalize(payload.tipo).toLowerCase();
    if (tipo && !tiposPermitidos.includes(tipo)) {
      errors.push('El tipo debe ser preventivo, correctivo o revision.');
    }

    if (payload.fecha) {
      const fecha = new Date(String(payload.fecha) + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (isNaN(fecha.getTime())) {
        errors.push('La fecha no es valida.');
      } else if (fecha > today) {
        errors.push('La fecha no puede ser futura.');
      }
    }

    const costo = Number(payload.costo);
    if (isNaN(costo) || costo < 0) {
      errors.push('El costo debe ser un numero igual o mayor a 0.');
    }

    if (errors.length) {
      throw new BadRequestException({ message: 'Validacion fallida.', errors });
    }

    try {
      const pool = this.mysqlService.getPool();
      const motoId = this.normalize(payload.moto_id);
      const [motoRows] = await pool.query<RowDataPacket[]>(
        'SELECT id FROM motos WHERE id = ? LIMIT 1',
        [motoId],
      );
      if (!motoRows.length) {
        throw new BadRequestException({
          message: 'La motocicleta seleccionada no existe.',
          errors: ['moto_id invalido.'],
        });
      }

      await pool.query<ResultSetHeader>(
        `
          INSERT INTO mantenimientos (
            id, moto_id, tipo, descripcion, fecha, costo, tecnico
          ) VALUES (UUID(), ?, ?, ?, ?, ?, ?)
        `,
        [
          motoId,
          tipo,
          this.normalize(payload.descripcion),
          String(payload.fecha),
          costo,
          this.normalize(payload.tecnico),
        ],
      );

      const [rows] = await pool.query<MantenimientoRow[]>(
        `
          SELECT
            id, moto_id, tipo, descripcion, fecha, costo, tecnico,
            fecha_registro AS fechaRegistro
          FROM mantenimientos
          WHERE moto_id = ?
          ORDER BY fecha_registro DESC
          LIMIT 1
        `,
        [motoId],
      );
      return this.mapMantenimiento(rows[0]);
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      throw new InternalServerErrorException(
        'No se pudo registrar el mantenimiento.',
      );
    }
  }
}
