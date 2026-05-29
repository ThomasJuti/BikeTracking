import { createPool } from 'mysql2/promise';
import * as fs from 'fs';
import * as readline from 'readline';
import * as path from 'path';

// Parse .env file manually if it exists to load DB credentials
function loadEnv() {
  const envPath = path.join(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
      if (match) {
        const key = match[1];
        let val = match[2].trim();
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  }
}

loadEnv();

const host = process.env.DB_HOST ?? '127.0.0.1';
const port = Number(process.env.DB_PORT ?? 3306);
const user = process.env.DB_USER ?? 'root';
const password = process.env.DB_PASSWORD ?? '';
const database = process.env.DB_NAME ?? 'biketracking';

function parseNumber(val: string): number | null {
  if (!val || val.trim() === '') return null;
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

async function main() {
  // Get CSV path from command line arguments
  const args = process.argv.slice(2);
  let csvPath = args[0] || 'C:\\Users\\thoma_vaulmzi\\OneDrive\\Documentos\\universidad\\7to Semestre\\Gestion de proyectos\\archive (1)\\all_bikez_curated.csv';

  console.log(`Buscando archivo CSV en: ${csvPath}`);
  if (!fs.existsSync(csvPath)) {
    console.error(`ERROR: El archivo CSV no existe en la ruta especificada.`);
    process.exit(1);
  }

  const pool = createPool({
    host,
    port,
    user,
    password,
    database,
    connectionLimit: 5,
  });

  console.log('Conectado a la base de datos MySQL.');

  try {
    // Ensure table exists
    console.log('Verificando/Creando tabla motos_catalogo...');
    await pool.query(`
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

    // Truncate existing catalog table
    console.log('Limpiando la tabla motos_catalogo...');
    await pool.query('TRUNCATE TABLE motos_catalogo');

    const fileStream = fs.createReadStream(csvPath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let isHeader = true;
    let count = 0;
    let batch: any[][] = [];
    const BATCH_SIZE = 1000;

    const sql = `
      INSERT INTO motos_catalogo (
        brand, model, year, category, displacement, power, torque,
        engine_cylinder, engine_stroke, gearbox, bore, stroke, fuel_capacity,
        fuel_system, fuel_control, cooling_system, transmission_type, dry_weight,
        wheelbase, seat_height, front_brakes, rear_brakes, front_tire, rear_tire,
        front_suspension, rear_suspension, color_options
      ) VALUES ?
    `;

    console.log('Iniciando importacion...');

    for await (const line of rl) {
      if (isHeader) {
        isHeader = false;
        continue;
      }

      if (!line.trim()) continue;

      const parts = parseCSVLine(line);
      if (parts.length < 3) continue; // Invalid line

      const brand = parts[0] || 'Unknown';
      const model = parts[1] || 'Unknown';
      const year = parseInt(parts[2], 10) || 0;
      const category = parts[3] || null;
      const displacement = parseNumber(parts[5]);
      const power = parseNumber(parts[6]);
      const torque = parseNumber(parts[7]);
      const engine_cylinder = parts[8] || null;
      const engine_stroke = parts[9] || null;
      const gearbox = parts[10] || null;
      const bore = parseNumber(parts[11]);
      const stroke = parseNumber(parts[12]);
      const fuel_capacity = parseNumber(parts[13]);
      const fuel_system = parts[14] || null;
      const fuel_control = parts[15] || null;
      const cooling_system = parts[16] || null;
      const transmission_type = parts[17] || null;
      const dry_weight = parseNumber(parts[18]);
      const wheelbase = parseNumber(parts[19]);
      const seat_height = parseNumber(parts[20]);
      const front_brakes = parts[21] || null;
      const rear_brakes = parts[22] || null;
      const front_tire = parts[23] || null;
      const rear_tire = parts[24] || null;
      const front_suspension = parts[25] || null;
      const rear_suspension = parts[26] || null;
      const color_options = parts[27] || null;

      batch.push([
        brand, model, year, category, displacement, power, torque,
        engine_cylinder, engine_stroke, gearbox, bore, stroke, fuel_capacity,
        fuel_system, fuel_control, cooling_system, transmission_type, dry_weight,
        wheelbase, seat_height, front_brakes, rear_brakes, front_tire, rear_tire,
        front_suspension, rear_suspension, color_options
      ]);

      count++;

      if (batch.length >= BATCH_SIZE) {
        await pool.query(sql, [batch]);
        console.log(`Importados ${count} registros...`);
        batch = [];
      }
    }

    // Insert remaining rows
    if (batch.length > 0) {
      await pool.query(sql, [batch]);
      console.log(`Importados ${count} registros en total.`);
    }

    console.log('¡Importacion completada exitosamente!');
  } catch (error) {
    console.error('ERROR durante la importacion:', error);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
