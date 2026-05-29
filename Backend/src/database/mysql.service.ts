import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool, RowDataPacket, createPool } from 'mysql2/promise';
import * as bcrypt from 'bcryptjs';

type CountRow = RowDataPacket & { total: number };

@Injectable()
export class MysqlService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MysqlService.name);
  private pool!: Pool;

  async onModuleInit(): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      this.logger.warn('Conexion MySQL omitida en entorno de pruebas.');
      return;
    }

    this.pool = createPool({
      host: process.env.DB_HOST ?? '127.0.0.1',
      port: Number(process.env.DB_PORT ?? 3306),
      user: process.env.DB_USER ?? 'root',
      password: process.env.DB_PASSWORD ?? '',
      database: process.env.DB_NAME ?? 'biketracking',
      waitForConnections: true,
      connectionLimit: 10,
      namedPlaceholders: true,
    });

    // Check if table motos exists and has user_id column
    let recreateNeeded = false;
    try {
      const [columns] = await this.pool.query<RowDataPacket[]>(`
        SHOW COLUMNS FROM motos LIKE 'user_id'
      `);
      if (columns.length === 0) {
        recreateNeeded = true;
      }
    } catch (e) {
      // Table doesn't exist, which is fine
    }

    if (recreateNeeded) {
      this.logger.warn('Esquema antiguo detectado. Recreando tablas...');
      await this.pool.query('DROP TABLE IF EXISTS mantenimientos');
      await this.pool.query('DROP TABLE IF EXISTS motos');
      await this.pool.query('DROP TABLE IF EXISTS users');
    }

    await this.createSchema();
    await this.migrateOdometerColumns();
    await this.seedDataIfEmpty();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
    }
  }

  getPool(): Pool {
    if (!this.pool) {
      throw new Error(
        'Pool de MySQL no inicializado. Verifica conexion y variables de entorno.',
      );
    }
    return this.pool;
  }

  private async createSchema(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id CHAR(36) NOT NULL PRIMARY KEY,
        email VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(100),
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS motos (
        id CHAR(36) NOT NULL PRIMARY KEY,
        user_id CHAR(36) NOT NULL,
        placa VARCHAR(10) NOT NULL UNIQUE,
        marca VARCHAR(80) NOT NULL,
        modelo VARCHAR(80) NOT NULL,
        anio INT NOT NULL,
        cilindraje VARCHAR(30) NOT NULL,
        estado ENUM('activa','mantenimiento','inactiva') NOT NULL,
        propietario VARCHAR(120) NOT NULL,
        kilometraje_actual INT UNSIGNED NULL DEFAULT NULL,
        fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_motos_users FOREIGN KEY (user_id)
          REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_motos_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS mantenimientos (
        id CHAR(36) NOT NULL PRIMARY KEY,
        moto_id CHAR(36) NOT NULL,
        tipo ENUM('preventivo','correctivo','revision') NOT NULL,
        descripcion TEXT NOT NULL,
        fecha DATE NOT NULL,
        costo DECIMAL(12,2) NOT NULL,
        tecnico VARCHAR(120) NOT NULL,
        kilometraje INT UNSIGNED NULL DEFAULT NULL,
        fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_mantenimientos_motos FOREIGN KEY (moto_id)
          REFERENCES motos(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS motos_catalogo (
        id INT AUTO_INCREMENT PRIMARY KEY,
        brand VARCHAR(100) NOT NULL,
        model VARCHAR(150) NOT NULL,
        year INT NOT NULL,
        category VARCHAR(100) NULL,
        displacement FLOAT NULL,
        power FLOAT NULL,
        torque FLOAT NULL,
        engine_cylinder VARCHAR(100) NULL,
        engine_stroke VARCHAR(100) NULL,
        gearbox VARCHAR(100) NULL,
        bore FLOAT NULL,
        stroke FLOAT NULL,
        fuel_capacity FLOAT NULL,
        fuel_system VARCHAR(150) NULL,
        fuel_control VARCHAR(150) NULL,
        cooling_system VARCHAR(100) NULL,
        transmission_type VARCHAR(100) NULL,
        dry_weight FLOAT NULL,
        wheelbase FLOAT NULL,
        seat_height FLOAT NULL,
        front_brakes VARCHAR(150) NULL,
        rear_brakes VARCHAR(150) NULL,
        front_tire VARCHAR(100) NULL,
        rear_tire VARCHAR(100) NULL,
        front_suspension VARCHAR(255) NULL,
        rear_suspension VARCHAR(255) NULL,
        color_options TEXT NULL,
        INDEX idx_brand_model (brand, model)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  }

  private async migrateOdometerColumns(): Promise<void> {
    const columnChecks: { table: string; column: string; sql: string }[] = [
      {
        table: 'motos',
        column: 'kilometraje_actual',
        sql: 'ALTER TABLE motos ADD COLUMN kilometraje_actual INT UNSIGNED NULL DEFAULT NULL',
      },
      {
        table: 'mantenimientos',
        column: 'kilometraje',
        sql: 'ALTER TABLE mantenimientos ADD COLUMN kilometraje INT UNSIGNED NULL DEFAULT NULL',
      },
    ];

    for (const { table, column, sql } of columnChecks) {
      try {
        const [rows] = await this.pool.query<RowDataPacket[]>(
          `SHOW COLUMNS FROM ${table} LIKE ?`,
          [column],
        );
        if (rows.length === 0) {
          await this.pool.query(sql);
          this.logger.log(`Columna ${table}.${column} agregada.`);
        }
      } catch (e) {
        this.logger.warn(`No se pudo migrar ${table}.${column}: ${String(e)}`);
      }
    }
  }

  private async seedDataIfEmpty(): Promise<void> {
    const [rows] = await this.pool.query<CountRow[]>(
      'SELECT COUNT(*) AS total FROM motos',
    );

    if (rows[0]?.total > 0) {
      return;
    }

    const defaultUserId = 'default-user-uuid-1234-5678-90abcdef';
    const passwordHash = await bcrypt.hash('password123', 10);

    // Seed default user if not exists
    await this.pool.query(`
      INSERT IGNORE INTO users (id, email, password_hash, name)
      VALUES (?, 'test@example.com', ?, 'Thomas Vaul')
    `, [defaultUserId, passwordHash]);

    // Seed default motos associated with the default user
    await this.pool.query(`
      INSERT INTO motos (id, user_id, placa, marca, modelo, anio, cilindraje, estado, propietario, kilometraje_actual, fecha_registro)
      VALUES
        (UUID(), ?, 'BTK101', 'Yamaha', 'FZ 2.0', 2022, '150cc', 'activa', 'Thomas Vaul', 15200, NOW()),
        (UUID(), ?, 'BTK202', 'Honda', 'CB 190R', 2021, '184cc', 'mantenimiento', 'Camila Rojas', 9800, NOW()),
        (UUID(), ?, 'BTK303', 'Suzuki', 'GN 125', 2019, '125cc', 'activa', 'Juan Perez', 22000, NOW()),
        (UUID(), ?, 'BTK404', 'Bajaj', 'Pulsar NS 200', 2020, '200cc', 'inactiva', 'Laura Gomez', 18500, NOW()),
        (UUID(), ?, 'BTK505', 'AKT', 'NKD 125', 2023, '125cc', 'activa', 'Daniel Castro', 7200, NOW());
    `, [defaultUserId, defaultUserId, defaultUserId, defaultUserId, defaultUserId]);

    await this.pool.query(`
      INSERT INTO mantenimientos (id, moto_id, tipo, descripcion, fecha, costo, tecnico, kilometraje, fecha_registro)
      SELECT UUID(), id, 'preventivo', 'Cambio de aceite y filtro', DATE_SUB(CURDATE(), INTERVAL 20 DAY), 35.00, 'Carlos Mejia', 12000, NOW()
      FROM motos WHERE placa = 'BTK101';
    `);

    await this.pool.query(`
      INSERT INTO mantenimientos (id, moto_id, tipo, descripcion, fecha, costo, tecnico, kilometraje, fecha_registro)
      SELECT UUID(), id, 'correctivo', 'Ajuste de freno delantero', DATE_SUB(CURDATE(), INTERVAL 10 DAY), 22.50, 'Andres Naranjo', 9500, NOW()
      FROM motos WHERE placa = 'BTK202';
    `);

    await this.pool.query(`
      INSERT INTO mantenimientos (id, moto_id, tipo, descripcion, fecha, costo, tecnico, kilometraje, fecha_registro)
      SELECT UUID(), id, 'revision', 'Revision general pre-viaje', DATE_SUB(CURDATE(), INTERVAL 5 DAY), 18.00, 'Paula Ruiz', 21500, NOW()
      FROM motos WHERE placa = 'BTK303';
    `);

    await this.pool.query(`
      INSERT INTO mantenimientos (id, moto_id, tipo, descripcion, fecha, costo, tecnico, kilometraje, fecha_registro)
      SELECT UUID(), id, 'preventivo', 'Cambio de aceite', DATE_SUB(CURDATE(), INTERVAL 95 DAY), 40.00, 'Julian Diaz', 15000, NOW()
      FROM motos WHERE placa = 'BTK404';
    `);

    await this.pool.query(`
      INSERT INTO mantenimientos (id, moto_id, tipo, descripcion, fecha, costo, tecnico, kilometraje, fecha_registro)
      SELECT UUID(), id, 'preventivo', 'Lubricacion general', DATE_SUB(CURDATE(), INTERVAL 65 DAY), 28.00, 'Diana Rios', 4000, NOW()
      FROM motos WHERE placa = 'BTK505';
    `);

    this.logger.log('Se inicializo la base de datos con datos de ejemplo.');
  }
}
