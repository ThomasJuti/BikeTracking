CREATE DATABASE IF NOT EXISTS biketracking
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE biketracking;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) NOT NULL PRIMARY KEY,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS motos (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  placa VARCHAR(10) NOT NULL UNIQUE,
  marca VARCHAR(80) NOT NULL,
  modelo VARCHAR(80) NOT NULL,
  anio INT NOT NULL,
  cilindraje VARCHAR(30) NOT NULL,
  estado ENUM('activa', 'mantenimiento', 'inactiva') NOT NULL,
  propietario VARCHAR(120) NOT NULL,
  kilometraje_actual INT UNSIGNED NULL DEFAULT NULL,
  fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_motos_users
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  INDEX idx_motos_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS mantenimientos (
  id CHAR(36) NOT NULL PRIMARY KEY,
  moto_id CHAR(36) NOT NULL,
  tipo ENUM('preventivo', 'correctivo', 'revision') NOT NULL,
  descripcion TEXT NOT NULL,
  fecha DATE NOT NULL,
  costo DECIMAL(12,2) NOT NULL,
  tecnico VARCHAR(120) NOT NULL,
  kilometraje INT UNSIGNED NULL DEFAULT NULL,
  fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_mantenimientos_motos
    FOREIGN KEY (moto_id) REFERENCES motos(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Usuario de prueba: test@example.com / password123
-- Generar hash con bcrypt (cost 10) antes de insertar en produccion.
INSERT INTO users (id, email, password_hash, name)
VALUES (
  'default-user-uuid-1234-5678-90abcdef',
  'test@example.com',
  '$2a$10$placeholder-replace-with-bcrypt-hash',
  'Thomas Vaul'
);

INSERT INTO motos (id, user_id, placa, marca, modelo, anio, cilindraje, estado, propietario, kilometraje_actual, fecha_registro) VALUES
  (UUID(), 'default-user-uuid-1234-5678-90abcdef', 'BTK101', 'Yamaha', 'FZ 2.0', 2022, '150cc', 'activa', 'Thomas Vaul', 15200, NOW()),
  (UUID(), 'default-user-uuid-1234-5678-90abcdef', 'BTK202', 'Honda', 'CB 190R', 2021, '184cc', 'mantenimiento', 'Camila Rojas', 9800, NOW()),
  (UUID(), 'default-user-uuid-1234-5678-90abcdef', 'BTK303', 'Suzuki', 'GN 125', 2019, '125cc', 'activa', 'Juan Perez', 22000, NOW()),
  (UUID(), 'default-user-uuid-1234-5678-90abcdef', 'BTK404', 'Bajaj', 'Pulsar NS 200', 2020, '200cc', 'inactiva', 'Laura Gomez', 18500, NOW()),
  (UUID(), 'default-user-uuid-1234-5678-90abcdef', 'BTK505', 'AKT', 'NKD 125', 2023, '125cc', 'activa', 'Daniel Castro', 7200, NOW());

INSERT INTO mantenimientos (id, moto_id, tipo, descripcion, fecha, costo, tecnico, kilometraje, fecha_registro)
SELECT UUID(), id, 'preventivo', 'Cambio de aceite y filtro', DATE_SUB(CURDATE(), INTERVAL 20 DAY), 35.00, 'Carlos Mejia', 12000, NOW()
FROM motos WHERE placa = 'BTK101';

INSERT INTO mantenimientos (id, moto_id, tipo, descripcion, fecha, costo, tecnico, kilometraje, fecha_registro)
SELECT UUID(), id, 'correctivo', 'Ajuste de freno delantero', DATE_SUB(CURDATE(), INTERVAL 10 DAY), 22.50, 'Andres Naranjo', 9500, NOW()
FROM motos WHERE placa = 'BTK202';

INSERT INTO mantenimientos (id, moto_id, tipo, descripcion, fecha, costo, tecnico, kilometraje, fecha_registro)
SELECT UUID(), id, 'revision', 'Revision general pre-viaje', DATE_SUB(CURDATE(), INTERVAL 5 DAY), 18.00, 'Paula Ruiz', 21500, NOW()
FROM motos WHERE placa = 'BTK303';

INSERT INTO mantenimientos (id, moto_id, tipo, descripcion, fecha, costo, tecnico, kilometraje, fecha_registro)
SELECT UUID(), id, 'preventivo', 'Cambio de aceite', DATE_SUB(CURDATE(), INTERVAL 95 DAY), 40.00, 'Julian Diaz', 15000, NOW()
FROM motos WHERE placa = 'BTK404';

INSERT INTO mantenimientos (id, moto_id, tipo, descripcion, fecha, costo, tecnico, kilometraje, fecha_registro)
SELECT UUID(), id, 'preventivo', 'Lubricacion general', DATE_SUB(CURDATE(), INTERVAL 65 DAY), 28.00, 'Diana Rios', 4000, NOW()
FROM motos WHERE placa = 'BTK505';
