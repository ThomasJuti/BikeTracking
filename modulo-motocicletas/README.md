# Módulo Motocicletas — BikeTracking

Módulo de seguimiento personal de motocicletas. Permite a cada usuario registrar su vehículo, consultar su estado y llevar un historial de mantenimientos.

---

## Estructura del proyecto

```
modulo-motocicletas/
├── backend/
│   ├── server.js              # API REST con Express + autenticación
│   ├── package.json
│   └── data/
│       ├── motos.json         # Almacenamiento de motocicletas
│       ├── mantenimientos.json
│       └── users.json         # Usuarios registrados (contraseñas hasheadas)
└── frontend/
    ├── login.html             # Pantalla de acceso / registro
    ├── login.js
    ├── home.html              # Dashboard personal
    ├── home.js
    ├── index.html             # Ficha de la moto
    ├── app.js
    ├── maintenance.html       # Formulario de mantenimiento
    ├── maintenance.js
    └── styles.css
```

---

## Cómo ejecutar

### 1. Instalar dependencias
```bash
cd modulo-motocicletas/backend
npm install
```

### 2. Iniciar el servidor
```bash
npm run start
```

El servidor levanta en **http://localhost:3000** y sirve también el frontend estático.

---

## Endpoints de la API

### Autenticación

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/auth/register` | Registrar nuevo usuario |
| `POST` | `/api/auth/login` | Iniciar sesión, devuelve `token` |
| `POST` | `/api/auth/logout` | Cerrar sesión, invalida el token |

**Body de registro/login:**
```json
{ "username": "miusuario", "password": "micontrasena" }
```

**Respuesta de login:**
```json
{ "token": "...", "username": "miusuario" }
```

> Todas las rutas de `/api/motos` y `/api/mantenimientos` requieren el header:
> `Authorization: Bearer <token>`

---

### Motocicletas

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/motos` | Listar motos (soporta `?q=` y `?estado=`) |
| `GET` | `/api/motos/:id` | Obtener moto por ID |
| `POST` | `/api/motos` | Registrar nueva moto |
| `PUT` | `/api/motos/:id` | Actualizar datos de la moto |
| `DELETE` | `/api/motos/:id` | Eliminar moto |

**Campos requeridos al crear/editar:**
```json
{
  "placa": "ABC123",
  "marca": "Yamaha",
  "modelo": "FZ25",
  "anio": 2022,
  "cilindraje": "250cc",
  "estado": "activa",
  "propietario": "Juan Perez"
}
```

Estados válidos: `activa` | `mantenimiento` | `inactiva`

---

### Mantenimientos

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/mantenimientos` | Listar todos los mantenimientos |
| `POST` | `/api/mantenimientos` | Registrar nuevo mantenimiento |

**Campos requeridos al crear:**
```json
{
  "moto_id": "<id de la moto>",
  "tipo": "preventivo",
  "descripcion": "Cambio de aceite",
  "fecha": "2026-04-30",
  "costo": 45000,
  "tecnico": "Carlos Lopez"
}
```

Tipos válidos: `preventivo` | `correctivo` | `revision`

---

## Autenticación (detalle técnico)

- Las contraseñas se almacenan con **scrypt + salt aleatorio** (módulo nativo `crypto` de Node.js). Nunca se guardan en texto plano.
- Los tokens de sesión son cadenas hexadecimales de **32 bytes generadas aleatoriamente**.
- Las sesiones se mantienen **en memoria** del servidor; al reiniciar el proceso, los tokens se invalidan (los datos de usuarios persisten en `users.json`).
- Se usa `crypto.timingSafeEqual` para comparar hashes y evitar ataques de tiempo.

---

## Vistas del frontend

| Ruta | Descripción |
|------|-------------|
| `/login.html` | Pantalla de inicio de sesión y registro de cuenta |
| `/home.html` | Dashboard personal: estado de la moto y acceso rápido a módulos |
| `/index.html` | Ficha principal: crear, editar y eliminar la moto |
| `/maintenance.html` | Formulario para registrar servicios y mantenimientos |

Todas las vistas redirigen automáticamente a `/login.html` si no hay sesión activa. El token se almacena en `sessionStorage` del navegador.

---

## Avances de la sesión (30 de abril 2026)

### Sincronización con repositorio principal
- Se conectó el remoto `upstream` al repositorio `ThomasJuti/BikeTracking`.
- Se actualizó la rama `main` local con los cambios del equipo (66 archivos, +21 762 líneas) incluyendo el backend NestJS y el frontend Angular del proyecto completo.
- Se publicaron los cambios a `origin/main`.

### Módulo motocicletas ejecutado y validado
- Se levantó el servidor Express en `http://localhost:3000`.
- Se verificaron las tres vistas del frontend: home, ficha de moto y mantenimientos.
- Se confirmó que la API respondía correctamente (sin datos iniciales).

### Sistema de autenticación implementado
- **Backend:** Endpoints de registro, login y logout con contraseñas hasheadas (scrypt).
- **Protección de rutas:** Todas las rutas de la API requieren token válido (`401` en caso contrario).
- **Frontend:** Nueva página `login.html` / `login.js` con formularios de acceso y registro.
- **Guards:** Los tres módulos JS (`app.js`, `home.js`, `maintenance.js`) redirigen al login si no hay sesión.
- **Logout:** Botón "Salir" agregado en todas las páginas protegidas.
