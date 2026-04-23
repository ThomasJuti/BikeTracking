CREATE DATABASE IF NOT EXISTS biketracking
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE biketracking;

CREATE TABLE IF NOT EXISTS motos (
  id CHAR(36) NOT NULL PRIMARY KEY,
  placa VARCHAR(10) NOT NULL UNIQUE,
  marca VARCHAR(80) NOT NULL,
  modelo VARCHAR(80) NOT NULL,
  anio INT NOT NULL,
  cilindraje VARCHAR(30) NOT NULL,
  estado ENUM('activa', 'mantenimiento', 'inactiva') NOT NULL,
  propietario VARCHAR(120) NOT NULL,
  fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS mantenimientos (
  id CHAR(36) NOT NULL PRIMARY KEY,
  moto_id CHAR(36) NOT NULL,
  tipo ENUM('preventivo', 'correctivo', 'revision') NOT NULL,
  descripcion TEXT NOT NULL,
  fecha DATE NOT NULL,
  costo DECIMAL(12,2) NOT NULL,
  tecnico VARCHAR(120) NOT NULL,
  fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_mantenimientos_motos
    FOREIGN KEY (moto_id) REFERENCES motos(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO motos (id, placa, marca, modelo, anio, cilindraje, estado, propietario, fecha_registro) VALUES
  (UUID(), 'BTK101', 'Yamaha', 'FZ 2.0', 2022, '150cc', 'activa', 'Thomas Vaul', NOW()),
  (UUID(), 'BTK202', 'Honda', 'CB 190R', 2021, '184cc', 'mantenimiento', 'Camila Rojas', NOW()),
  (UUID(), 'BTK303', 'Suzuki', 'GN 125', 2019, '125cc', 'activa', 'Juan Perez', NOW()),
  (UUID(), 'BTK404', 'Bajaj', 'Pulsar NS 200', 2020, '200cc', 'inactiva', 'Laura Gomez', NOW()),
  (UUID(), 'BTK505', 'AKT', 'NKD 125', 2023, '125cc', 'activa', 'Daniel Castro', NOW()),
  (UUID(), 'BTK606', 'KTM', 'Duke 200', 2022, '200cc', 'activa', 'Sofia Martinez', NOW()),
  (UUID(), 'BTK707', 'TVS', 'Apache RTR 160', 2020, '160cc', 'mantenimiento', 'Miguel Ariza', NOW());

INSERT INTO mantenimientos (id, moto_id, tipo, descripcion, fecha, costo, tecnico, fecha_registro)
SELECT UUID(), id, 'preventivo', 'Cambio de aceite y filtro', DATE_SUB(CURDATE(), INTERVAL 20 DAY), 35.00, 'Carlos Mejia', NOW()
FROM motos WHERE placa = 'BTK101';

INSERT INTO mantenimientos (id, moto_id, tipo, descripcion, fecha, costo, tecnico, fecha_registro)
SELECT UUID(), id, 'correctivo', 'Ajuste de freno delantero', DATE_SUB(CURDATE(), INTERVAL 10 DAY), 22.50, 'Andres Naranjo', NOW()
FROM motos WHERE placa = 'BTK202';

INSERT INTO mantenimientos (id, moto_id, tipo, descripcion, fecha, costo, tecnico, fecha_registro)
SELECT UUID(), id, 'revision', 'Revision general pre-viaje', DATE_SUB(CURDATE(), INTERVAL 5 DAY), 18.00, 'Paula Ruiz', NOW()
FROM motos WHERE placa = 'BTK303';

INSERT INTO mantenimientos (id, moto_id, tipo, descripcion, fecha, costo, tecnico, fecha_registro)
SELECT UUID(), id, 'preventivo', 'Limpieza y ajuste de cadena', DATE_SUB(CURDATE(), INTERVAL 15 DAY), 12.00, 'Julian Diaz', NOW()
FROM motos WHERE placa = 'BTK404';

INSERT INTO mantenimientos (id, moto_id, tipo, descripcion, fecha, costo, tecnico, fecha_registro)
SELECT UUID(), id, 'correctivo', 'Cambio de pastillas de freno trasero', DATE_SUB(CURDATE(), INTERVAL 7 DAY), 28.00, 'Diana Rios', NOW()
FROM motos WHERE placa = 'BTK505';
