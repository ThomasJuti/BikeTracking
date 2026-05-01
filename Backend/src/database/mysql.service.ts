import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool, RowDataPacket, createPool } from 'mysql2/promise';

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

    await this.createSchema();
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
        placa VARCHAR(10) NOT NULL UNIQUE,
        marca VARCHAR(80) NOT NULL,
        modelo VARCHAR(80) NOT NULL,
        anio INT NOT NULL,
        cilindraje VARCHAR(30) NOT NULL,
        estado ENUM('activa','mantenimiento','inactiva') NOT NULL,
        propietario VARCHAR(120) NOT NULL,
        fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
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
        fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_mantenimientos_motos FOREIGN KEY (moto_id)
          REFERENCES motos(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  }

  private async seedDataIfEmpty(): Promise<void> {
    const [rows] = await this.pool.query<CountRow[]>(
      'SELECT COUNT(*) AS total FROM motos',
    );

    if (rows[0]?.total > 0) {
      return;
    }

    await this.pool.query(`
      INSERT INTO motos (id, placa, marca, modelo, anio, cilindraje, estado, propietario, fecha_registro)
      VALUES
        (UUID(), 'BTK101', 'Yamaha', 'FZ 2.0', 2022, '150cc', 'activa', 'Thomas Vaul', NOW()),
        (UUID(), 'BTK202', 'Honda', 'CB 190R', 2021, '184cc', 'mantenimiento', 'Camila Rojas', NOW()),
        (UUID(), 'BTK303', 'Suzuki', 'GN 125', 2019, '125cc', 'activa', 'Juan Perez', NOW()),
        (UUID(), 'BTK404', 'Bajaj', 'Pulsar NS 200', 2020, '200cc', 'inactiva', 'Laura Gomez', NOW()),
        (UUID(), 'BTK505', 'AKT', 'NKD 125', 2023, '125cc', 'activa', 'Daniel Castro', NOW());
    `);

    await this.pool.query(`
      INSERT INTO mantenimientos (id, moto_id, tipo, descripcion, fecha, costo, tecnico, fecha_registro)
      SELECT UUID(), id, 'preventivo', 'Cambio de aceite y filtro', DATE_SUB(CURDATE(), INTERVAL 20 DAY), 35.00, 'Carlos Mejia', NOW()
      FROM motos WHERE placa = 'BTK101';
    `);

    await this.pool.query(`
      INSERT INTO mantenimientos (id, moto_id, tipo, descripcion, fecha, costo, tecnico, fecha_registro)
      SELECT UUID(), id, 'correctivo', 'Ajuste de freno delantero', DATE_SUB(CURDATE(), INTERVAL 10 DAY), 22.50, 'Andres Naranjo', NOW()
      FROM motos WHERE placa = 'BTK202';
    `);

    await this.pool.query(`
      INSERT INTO mantenimientos (id, moto_id, tipo, descripcion, fecha, costo, tecnico, fecha_registro)
      SELECT UUID(), id, 'revision', 'Revision general pre-viaje', DATE_SUB(CURDATE(), INTERVAL 5 DAY), 18.00, 'Paula Ruiz', NOW()
      FROM motos WHERE placa = 'BTK303';
    `);

    this.logger.log('Se inicializo la base de datos con datos de ejemplo.');
  }
}
