const express = require("express");
const cors = require("cors");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "motos.json");
const MANTENIMIENTOS_FILE = path.join(DATA_DIR, "mantenimientos.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const FRONTEND_DIR = path.join(__dirname, "..", "frontend");

// Sesiones en memoria: token -> { userId, username }
const sessions = new Map();

app.use(cors());
app.use(express.json());

// ── Auth helpers ────────────────────────────────────────────────────────────

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  const hashBuf = Buffer.from(hash, "hex");
  const derived = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(hashBuf, derived);
}

function requireAuth(req, res, next) {
  const auth = req.headers["authorization"] || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ message: "No autenticado." });
  }
  req.session = sessions.get(token);
  next();
}

// ── User helpers ─────────────────────────────────────────────────────────────

async function readUsers() {
  try {
    const raw = await fs.readFile(USERS_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeUsers(users) {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, "[]", "utf8");
  }

  try {
    await fs.access(MANTENIMIENTOS_FILE);
  } catch {
    await fs.writeFile(MANTENIMIENTOS_FILE, "[]", "utf8");
  }
}

async function readMotos() {
  const raw = await fs.readFile(DATA_FILE, "utf8");
  return JSON.parse(raw);
}

async function writeMotos(motos) {
  await fs.writeFile(DATA_FILE, JSON.stringify(motos, null, 2), "utf8");
}

function generateId() {
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function normalize(value) {
  return String(value || "").trim();
}

function validateMoto(payload, existingMotos, currentId = null) {
  const errors = [];
  const required = ["placa", "marca", "modelo", "anio", "cilindraje", "estado", "relieve", "propietario"];

  for (const field of required) {
    if (!normalize(payload[field])) {
      errors.push(`El campo '${field}' es obligatorio.`);
    }
  }

  const anio = Number(payload.anio);
  const currentYear = new Date().getFullYear() + 1;
  if (!Number.isInteger(anio) || anio < 1900 || anio > currentYear) {
    errors.push("El anio debe ser un numero valido.");
  }

  const estadosPermitidos = ["activa", "mantenimiento", "inactiva"];
  if (payload.estado && !estadosPermitidos.includes(payload.estado)) {
    errors.push("El estado debe ser activa, mantenimiento o inactiva.");
  }

  const relievesPermitidos = ["bajo", "medio", "alto"];
  if (payload.relieve && !relievesPermitidos.includes(payload.relieve)) {
    errors.push("El relieve debe ser bajo, medio o alto.");
  }

  const placaInput = normalize(payload.placa).toUpperCase();
  const placaMotoColombia = /^[A-Z]{3}\d{2}[A-Z]$/;
  if (payload.placa && !placaMotoColombia.test(placaInput)) {
    errors.push("La placa debe tener formato colombiano de moto: ABC12D.");
  }

  const placaDuplicada = existingMotos.some(
    (m) => m.placa.toUpperCase() === placaInput && m.id !== currentId
  );

  if (placaDuplicada) {
    errors.push("La placa ya existe.");
  }

  return errors;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "modulo-motocicletas" });
});

// ── Auth endpoints ──────────────────────────────────────────────────────────

app.post("/api/auth/register", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || username.trim().length < 3) {
    return res.status(400).json({ message: "El usuario debe tener al menos 3 caracteres." });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ message: "La contrasena debe tener al menos 6 caracteres." });
  }
  const users = await readUsers();
  if (users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase())) {
    return res.status(409).json({ message: "El usuario ya existe." });
  }
  const newUser = {
    id: crypto.randomBytes(12).toString("hex"),
    username: username.trim(),
    password: hashPassword(password),
    createdAt: new Date().toISOString()
  };
  users.push(newUser);
  await writeUsers(users);
  res.status(201).json({ message: "Usuario creado.", username: newUser.username });
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: "Usuario y contrasena requeridos." });
  }
  const users = await readUsers();
  const user = users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
  if (!user || !verifyPassword(password, user.password)) {
    return res.status(401).json({ message: "Usuario o contrasena incorrectos." });
  }
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, { userId: user.id, username: user.username });
  res.json({ token, username: user.username });
});

app.post("/api/auth/logout", (req, res) => {
  const auth = req.headers["authorization"] || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (token) sessions.delete(token);
  res.json({ message: "Sesion cerrada." });
});

// ── Motos endpoints (protegidos) ─────────────────────────────────────────────

app.get("/api/motos", requireAuth, async (req, res) => {
  try {
    const { q = "", estado = "" } = req.query;
    let motos = await readMotos();

    if (estado) {
      motos = motos.filter((m) => m.estado === estado);
    }

    if (q) {
      const term = String(q).toLowerCase();
      motos = motos.filter((m) => {
        return [m.placa, m.marca, m.modelo, m.propietario]
          .join(" ")
          .toLowerCase()
          .includes(term);
      });
    }

    res.json(motos);
  } catch (error) {
    res.status(500).json({ message: "No se pudo obtener la lista de motos." });
  }
});

app.get("/api/motos/:id", requireAuth, async (req, res) => {
  try {
    const motos = await readMotos();
    const moto = motos.find((m) => m.id === req.params.id);

    if (!moto) {
      return res.status(404).json({ message: "Motocicleta no encontrada." });
    }

    res.json(moto);
  } catch (error) {
    res.status(500).json({ message: "No se pudo obtener la motocicleta." });
  }
});

app.post("/api/motos", requireAuth, async (req, res) => {
  try {
    const motos = await readMotos();
    const payload = req.body;
    const errors = validateMoto(payload, motos);

    if (errors.length) {
      return res.status(400).json({ message: "Validacion fallida.", errors });
    }

    const nuevaMoto = {
      id: generateId(),
      placa: normalize(payload.placa).toUpperCase(),
      marca: normalize(payload.marca),
      modelo: normalize(payload.modelo),
      anio: Number(payload.anio),
      cilindraje: normalize(payload.cilindraje),
      estado: normalize(payload.estado).toLowerCase(),
      relieve: normalize(payload.relieve).toLowerCase(),
      propietario: normalize(payload.propietario),
      fechaRegistro: new Date().toISOString()
    };

    motos.push(nuevaMoto);
    await writeMotos(motos);
    res.status(201).json(nuevaMoto);
  } catch (error) {
    res.status(500).json({ message: "No se pudo crear la motocicleta." });
  }
});

app.put("/api/motos/:id", requireAuth, async (req, res) => {
  try {
    const motos = await readMotos();
    const index = motos.findIndex((m) => m.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ message: "Motocicleta no encontrada." });
    }

    const payload = req.body;
    const errors = validateMoto(payload, motos, req.params.id);

    if (errors.length) {
      return res.status(400).json({ message: "Validacion fallida.", errors });
    }

    const updated = {
      ...motos[index],
      placa: normalize(payload.placa).toUpperCase(),
      marca: normalize(payload.marca),
      modelo: normalize(payload.modelo),
      anio: Number(payload.anio),
      cilindraje: normalize(payload.cilindraje),
      estado: normalize(payload.estado).toLowerCase(),
      relieve: normalize(payload.relieve).toLowerCase(),
      propietario: normalize(payload.propietario)
    };

    motos[index] = updated;
    await writeMotos(motos);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "No se pudo actualizar la motocicleta." });
  }
});

app.delete("/api/motos/:id", requireAuth, async (req, res) => {
  try {
    const motos = await readMotos();
    const index = motos.findIndex((m) => m.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ message: "Motocicleta no encontrada." });
    }

    motos.splice(index, 1);
    await writeMotos(motos);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "No se pudo eliminar la motocicleta." });
  }
});

app.get("/api/mantenimientos", requireAuth, async (_req, res) => {
  try {
    const raw = await fs.readFile(MANTENIMIENTOS_FILE, "utf8");
    res.json(JSON.parse(raw));
  } catch {
    res.status(500).json({ message: "No se pudo obtener la lista de mantenimientos." });
  }
});

app.post("/api/mantenimientos", requireAuth, async (req, res) => {
  try {
    const payload = req.body;
    const errors = [];

    const required = ["moto_id", "tipo", "descripcion", "fecha", "tecnico"];
    for (const field of required) {
      if (!String(payload[field] || "").trim()) {
        errors.push(`El campo '${field}' es obligatorio.`);
      }
    }

    const tiposPermitidos = ["preventivo", "correctivo", "revision"];
    if (payload.tipo && !tiposPermitidos.includes(payload.tipo)) {
      errors.push("El tipo debe ser preventivo, correctivo o revision.");
    }

    if (payload.fecha) {
      const fecha = new Date(payload.fecha + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (isNaN(fecha.getTime())) {
        errors.push("La fecha no es valida.");
      } else if (fecha > today) {
        errors.push("La fecha no puede ser futura.");
      }
    }

    if (payload.costo !== undefined) {
      const costo = Number(payload.costo);
      if (isNaN(costo) || costo < 0) {
        errors.push("El costo debe ser un numero igual o mayor a 0.");
      }
    }

    if (errors.length) {
      return res.status(400).json({ message: "Validacion fallida.", errors });
    }

    // Verificar que la moto exista
    const motosRaw = await fs.readFile(DATA_FILE, "utf8");
    const motos = JSON.parse(motosRaw);
    const motoExiste = motos.some((m) => m.id === payload.moto_id);
    if (!motoExiste) {
      return res.status(400).json({ message: "La motocicleta seleccionada no existe.", errors: ["moto_id invalido."] });
    }

    const raw = await fs.readFile(MANTENIMIENTOS_FILE, "utf8");
    const mantenimientos = JSON.parse(raw);

    const nuevo = {
      id: `${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      moto_id: payload.moto_id,
      tipo: payload.tipo,
      descripcion: String(payload.descripcion).trim(),
      fecha: payload.fecha,
      costo: Number(payload.costo),
      tecnico: String(payload.tecnico).trim(),
      fechaRegistro: new Date().toISOString()
    };

    mantenimientos.push(nuevo);
    await fs.writeFile(MANTENIMIENTOS_FILE, JSON.stringify(mantenimientos, null, 2), "utf8");
    res.status(201).json(nuevo);
  } catch {
    res.status(500).json({ message: "No se pudo registrar el mantenimiento." });
  }
});

app.use(express.static(FRONTEND_DIR));

app.get("*", (_req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "login.html"));
});

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try { await fs.access(DATA_FILE); } catch { await fs.writeFile(DATA_FILE, "[]", "utf8"); }
  try { await fs.access(MANTENIMIENTOS_FILE); } catch { await fs.writeFile(MANTENIMIENTOS_FILE, "[]", "utf8"); }
  try { await fs.access(USERS_FILE); } catch { await fs.writeFile(USERS_FILE, "[]", "utf8"); }
}

ensureDataFile()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor ejecutandose en http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error inicializando almacenamiento:", error);
    process.exit(1);
  });
