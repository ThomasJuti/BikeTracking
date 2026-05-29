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
  kilometrajeActual: number | null;
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
  kilometraje: number | null;
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

  private parseOptionalKm(value: unknown): number | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }
    const km = Number(value);
    if (!Number.isInteger(km) || km < 0) {
      return NaN as unknown as null;
    }
    return km;
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
      kilometrajeActual:
        row.kilometrajeActual != null ? Number(row.kilometrajeActual) : null,
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
      kilometraje: row.kilometraje != null ? Number(row.kilometraje) : null,
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

    const cilindrajeStr = this.normalize(payload.cilindraje);
    if (cilindrajeStr) {
      const ccMatch = cilindrajeStr.match(/^(-?\d+)/);
      if (ccMatch) {
        const num = parseInt(ccMatch[1], 10);
        if (num <= 0) {
          errors.push('El cilindraje no puede ser negativo ni cero.');
        }
      }
    }

    // Validaciones de longitud mínima
    const placaVal = this.normalize(payload.placa);
    if (placaVal && placaVal.length < 2) {
      errors.push('La placa debe tener al menos 2 caracteres.');
    }
    const marcaVal = this.normalize(payload.marca);
    if (marcaVal && marcaVal.length < 2) {
      errors.push('La marca debe tener al menos 2 caracteres.');
    }
    const propietarioVal = this.normalize(payload.propietario);
    if (propietarioVal && propietarioVal.length < 2) {
      errors.push('El propietario debe tener al menos 2 caracteres.');
    }

    const estadosPermitidos = ['activa', 'mantenimiento', 'inactiva'];
    const estado = this.normalize(payload.estado).toLowerCase();
    if (estado && !estadosPermitidos.includes(estado)) {
      errors.push('El estado debe ser activa, mantenimiento o inactiva.');
    }

    const kmVal = this.parseOptionalKm(
      payload.kilometrajeActual ?? payload.kilometraje_actual,
    );
    if (Number.isNaN(kmVal as unknown as number)) {
      errors.push('El kilometraje actual debe ser un entero igual o mayor a 0.');
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

  async findAllMotos(
    userId: string,
    q?: string,
    estado?: string,
  ): Promise<Moto[]> {
    try {
      const pool = this.mysqlService.getPool();
      const sql = `
        SELECT
          id, placa, marca, modelo, anio, cilindraje, estado, propietario,
          kilometraje_actual AS kilometrajeActual,
          fecha_registro AS fechaRegistro
        FROM motos
        WHERE user_id = ?
          AND (? = '' OR estado = ?)
          AND (? = '' OR CONCAT(placa, ' ', marca, ' ', modelo, ' ', propietario) LIKE ?)
        ORDER BY fecha_registro DESC
      `;
      const estadoParam = this.normalize(estado).toLowerCase();
      const qParam = this.normalize(q);
      const likeParam = `%${qParam}%`;
      const [rows] = await pool.query<MotoRow[]>(sql, [
        userId,
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

  async findOneMoto(userId: string, id: string): Promise<Moto> {
    try {
      const pool = this.mysqlService.getPool();
      const [rows] = await pool.query<MotoRow[]>(
        `
          SELECT
            id, placa, marca, modelo, anio, cilindraje, estado, propietario,
            kilometraje_actual AS kilometrajeActual,
            fecha_registro AS fechaRegistro
          FROM motos
          WHERE id = ? AND user_id = ?
          LIMIT 1
        `,
        [id, userId],
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

  async createMoto(
    userId: string,
    payload: Record<string, unknown>,
  ): Promise<Moto> {
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
      const kilometrajeActual = this.parseOptionalKm(
        payload.kilometrajeActual ?? payload.kilometraje_actual,
      );

      await pool.query<ResultSetHeader>(
        `
          INSERT INTO motos (
            id, user_id, placa, marca, modelo, anio, cilindraje, estado, propietario, kilometraje_actual
          )
          VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          userId,
          placa,
          marca,
          modelo,
          anio,
          cilindraje,
          estado,
          propietario,
          kilometrajeActual,
        ],
      );

      const [rows] = await pool.query<MotoRow[]>(
        `
          SELECT
            id, placa, marca, modelo, anio, cilindraje, estado, propietario,
            kilometraje_actual AS kilometrajeActual,
            fecha_registro AS fechaRegistro
          FROM motos
          WHERE placa = ? AND user_id = ?
          ORDER BY fecha_registro DESC
          LIMIT 1
        `,
        [placa, userId],
      );
      return this.mapMoto(rows[0]);
    } catch {
      throw new InternalServerErrorException(
        'No se pudo crear la motocicleta.',
      );
    }
  }

  async updateMoto(
    userId: string,
    id: string,
    payload: Record<string, unknown>,
  ): Promise<Moto> {
    const errors = await this.validateMoto(payload, id);
    if (errors.length) {
      throw new BadRequestException({ message: 'Validacion fallida.', errors });
    }

    try {
      const pool = this.mysqlService.getPool();
      const [existe] = await pool.query<RowDataPacket[]>(
        'SELECT id FROM motos WHERE id = ? AND user_id = ? LIMIT 1',
        [id, userId],
      );
      if (!existe.length) {
        throw new NotFoundException('Motocicleta no encontrada.');
      }

      await pool.query<ResultSetHeader>(
        `
          UPDATE motos
          SET placa = ?, marca = ?, modelo = ?, anio = ?, cilindraje = ?,
              estado = ?, propietario = ?, kilometraje_actual = ?
          WHERE id = ? AND user_id = ?
        `,
        [
          this.normalize(payload.placa).toUpperCase(),
          this.normalize(payload.marca),
          this.normalize(payload.modelo),
          Number(payload.anio),
          this.normalize(payload.cilindraje),
          this.normalize(payload.estado).toLowerCase(),
          this.normalize(payload.propietario),
          this.parseOptionalKm(
            payload.kilometrajeActual ?? payload.kilometraje_actual,
          ),
          id,
          userId,
        ],
      );

      return this.findOneMoto(userId, id);
    } catch (e) {
      if (e instanceof BadRequestException || e instanceof NotFoundException) {
        throw e;
      }
      throw new InternalServerErrorException(
        'No se pudo actualizar la motocicleta.',
      );
    }
  }

  async deleteMoto(userId: string, id: string): Promise<void> {
    try {
      const pool = this.mysqlService.getPool();
      const [owned] = await pool.query<RowDataPacket[]>(
        'SELECT id FROM motos WHERE id = ? AND user_id = ? LIMIT 1',
        [id, userId],
      );
      if (!owned.length) {
        throw new NotFoundException('Motocicleta no encontrada.');
      }

      await pool.query('DELETE FROM mantenimientos WHERE moto_id = ?', [id]);

      const [result] = await pool.query<ResultSetHeader>(
        'DELETE FROM motos WHERE id = ? AND user_id = ?',
        [id, userId],
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

  async findAllMantenimientos(userId: string): Promise<Mantenimiento[]> {
    try {
      const pool = this.mysqlService.getPool();
      const [rows] = await pool.query<MantenimientoRow[]>(
        `
          SELECT
            m.id, m.moto_id, m.tipo, m.descripcion, m.fecha, m.costo, m.tecnico,
            m.kilometraje, m.fecha_registro AS fechaRegistro
          FROM mantenimientos m
          INNER JOIN motos mo ON mo.id = m.moto_id
          WHERE mo.user_id = ?
          ORDER BY m.fecha DESC, m.fecha_registro DESC
        `,
        [userId],
      );
      return rows.map((r) => this.mapMantenimiento(r));
    } catch {
      throw new InternalServerErrorException(
        'No se pudo obtener la lista de mantenimientos.',
      );
    }
  }

  async createMantenimiento(
    userId: string,
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

    // Validaciones de longitud mínima
    const descripcionVal = this.normalize(payload.descripcion);
    if (descripcionVal && descripcionVal.length < 3) {
      errors.push('La descripcion debe tener al menos 3 caracteres.');
    }
    const tecnicoVal = this.normalize(payload.tecnico);
    if (tecnicoVal && tecnicoVal.length < 2) {
      errors.push('El nombre del tecnico debe tener al menos 2 caracteres.');
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
    } else if (costo > 999999) {
      errors.push('El costo no puede superar 999999.');
    }

    const kilometraje = this.parseOptionalKm(payload.kilometraje);
    if (Number.isNaN(kilometraje as unknown as number)) {
      errors.push('El kilometraje debe ser un entero igual o mayor a 0.');
    }

    if (errors.length) {
      throw new BadRequestException({ message: 'Validacion fallida.', errors });
    }

    try {
      const pool = this.mysqlService.getPool();
      const motoId = this.normalize(payload.moto_id);
      const [motoRows] = await pool.query<RowDataPacket[]>(
        'SELECT id FROM motos WHERE id = ? AND user_id = ? LIMIT 1',
        [motoId, userId],
      );
      if (!motoRows.length) {
        throw new BadRequestException({
          message: 'La motocicleta seleccionada no existe o no te pertenece.',
          errors: ['moto_id invalido.'],
        });
      }

      await pool.query<ResultSetHeader>(
        `
          INSERT INTO mantenimientos (
            id, moto_id, tipo, descripcion, fecha, costo, tecnico, kilometraje
          ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          motoId,
          tipo,
          this.normalize(payload.descripcion),
          String(payload.fecha),
          costo,
          this.normalize(payload.tecnico),
          kilometraje,
        ],
      );

      const [rows] = await pool.query<MantenimientoRow[]>(
        `
          SELECT
            id, moto_id, tipo, descripcion, fecha, costo, tecnico, kilometraje,
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

  async searchCatalog(q?: string, limit: number = 20): Promise<any[]> {
    try {
      const pool = this.mysqlService.getPool();
      let sql = `
        SELECT 
          id, brand, model, year, category, displacement, power, torque,
          engine_cylinder AS engineCylinder, engine_stroke AS engineStroke,
          gearbox, bore, stroke, fuel_capacity AS fuelCapacity,
          fuel_system AS fuelSystem, fuel_control AS fuelControl,
          cooling_system AS coolingSystem, transmission_type AS transmissionType,
          dry_weight AS dryWeight, wheelbase, seat_height AS seatHeight,
          front_brakes AS frontBrakes, rear_brakes AS rearBrakes,
          front_tire AS frontTire, rear_tire AS rearTire,
          front_suspension AS frontSuspension, rear_suspension AS rearSuspension,
          color_options AS colorOptions
        FROM motos_catalogo
      `;
      const params: any[] = [];
      if (q) {
        sql += ` WHERE CONCAT(brand, ' ', model) LIKE ? `;
        params.push(`%${this.normalize(q)}%`);
      }
      sql += ` ORDER BY brand ASC, model ASC, year DESC LIMIT ?`;
      params.push(limit);

      const [rows] = await pool.query<RowDataPacket[]>(sql, params);
      return rows;
    } catch (error) {
      throw new InternalServerErrorException('No se pudo buscar en el catalogo.');
    }
  }

  async findCatalogItem(id: number): Promise<any> {
    try {
      const pool = this.mysqlService.getPool();
      const [rows] = await pool.query<RowDataPacket[]>(
        `
          SELECT 
            id, brand, model, year, category, displacement, power, torque,
            engine_cylinder AS engineCylinder, engine_stroke AS engineStroke,
            gearbox, bore, stroke, fuel_capacity AS fuelCapacity,
            fuel_system AS fuelSystem, fuel_control AS fuelControl,
            cooling_system AS coolingSystem, transmission_type AS transmissionType,
            dry_weight AS dryWeight, wheelbase, seat_height AS seatHeight,
            front_brakes AS frontBrakes, rear_brakes AS rearBrakes,
            front_tire AS frontTire, rear_tire AS rearTire,
            front_suspension AS frontSuspension, rear_suspension AS rearSuspension,
            color_options AS colorOptions
          FROM motos_catalogo
          WHERE id = ?
          LIMIT 1
        `,
        [id],
      );
      if (!rows.length) {
        throw new NotFoundException('Modelo de catalogo no encontrado.');
      }
      return rows[0];
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('No se pudo obtener el modelo de catalogo.');
    }
  }
}
