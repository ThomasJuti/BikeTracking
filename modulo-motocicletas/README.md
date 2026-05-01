# 🏍️ Módulo Motocicletas — BikeTracking

Aplicación web para el seguimiento personal de motocicletas. Este módulo fue construido con **Node.js + Express** en el backend y **HTML, CSS y JavaScript vanilla** en el frontend. Permite registrar usuarios, iniciar sesión, gestionar la ficha principal de una moto y llevar control básico de mantenimientos.

---

## 🚀 Características principales

- **Autenticación** con registro, login y logout.
- **Hash seguro de contraseñas** usando `crypto.scryptSync` y comparación con `timingSafeEqual`.
- **Gestión de motocicletas** con creación, consulta, edición y eliminación.
- **Foto o referencia visual de la moto** mediante carga de imagen, captura desde cámara o selección de modelos populares en Colombia.
- **Registro de mantenimientos** con validación de fecha, costo, tipo y técnico responsable.
- **Dashboard personal** con acceso rápido a las vistas principales.
- **Tres temas visuales**: Oscuro, Claro y Esmeralda.
- **Interfaz responsive** con Bootstrap 5.

---

## 🛠️ Tecnologías utilizadas

### Backend
| Tecnología | Uso |
|---|---|
| Node.js | Entorno de ejecución |
| Express 4 | API REST y servidor web |
| `crypto` | Hash de contraseñas y tokens de sesión |
| JSON Files | Persistencia local de datos |

### Frontend
| Tecnología | Uso |
|---|---|
| HTML5 | Estructura de vistas |
| CSS3 | Estilos y sistema de temas |
| JavaScript | Lógica del cliente |
| Bootstrap 5.3.3 | Layout y componentes responsive |
| Bootstrap Icons | Iconografía |
| Google Fonts: Sora | Tipografía principal |

---

## 📂 Estructura del proyecto

```text
modulo-motocicletas/
├── backend/
│   ├── package.json
│   ├── server.js
│   └── data/
│       ├── motos.json
│       ├── mantenimientos.json
│       └── users.json
├── frontend/
│   ├── app.js
│   ├── home.html
│   ├── home.js
│   ├── index.html
│   ├── login.html
│   ├── login.js
│   ├── maintenance.html
│   ├── maintenance.js
│   ├── styles.css
│   └── theme.js
└── mockups.html
```

---

## 🚀 Instalación y ejecución

### Requisitos previos

- Node.js 18 o superior
- npm

### Pasos

```bash
cd modulo-motocicletas/backend
npm install
npm start
```

La aplicación queda disponible en `http://localhost:3000`.

El backend también sirve el frontend de forma estática, así que no hace falta levantar un servidor adicional para la interfaz.

---

## 🔌 Endpoints disponibles

### Salud del servicio

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/health` | Verifica que el módulo esté activo |

### Autenticación

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/auth/register` | Crea un nuevo usuario |
| `POST` | `/api/auth/login` | Inicia sesión y devuelve token |
| `POST` | `/api/auth/logout` | Cierra la sesión actual |

Ejemplo de body para registro o login:

```json
{
  "username": "admin",
  "password": "admin123"
}
```

### Motocicletas

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/motos` | Lista motocicletas registradas |
| `GET` | `/api/motos/:id` | Obtiene una motocicleta por ID |
| `POST` | `/api/motos` | Crea una motocicleta |
| `PUT` | `/api/motos/:id` | Actualiza una motocicleta |
| `DELETE` | `/api/motos/:id` | Elimina una motocicleta |

Ejemplo de body para crear o editar una moto:

```json
{
  "placa": "ABC12D",
  "marca": "Yamaha",
  "modelo": "FZ25",
  "anio": 2022,
  "cilindraje": "250cc",
  "estado": "activa",
  "relieve": "medio",
  "propietario": "Juan Perez"
}
```

Estados válidos:

- `activa`
- `mantenimiento`
- `inactiva`

### Mantenimientos

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/mantenimientos` | Lista mantenimientos registrados |
| `POST` | `/api/mantenimientos` | Crea un mantenimiento |

Ejemplo de body para registrar un mantenimiento:

```json
{
  "moto_id": "1714600000000-12345",
  "tipo": "preventivo",
  "descripcion": "Cambio de aceite y revision general",
  "fecha": "2026-04-30",
  "costo": 85000,
  "tecnico": "Carlos Lopez"
}
```

Tipos válidos:

- `preventivo`
- `correctivo`
- `revision`

> Las rutas de datos requieren el header `Authorization: Bearer <token>`.

---

## 🔐 Seguridad y sesiones

- Las contraseñas no se guardan en texto plano.
- Cada contraseña se almacena como `salt:hash` usando `scrypt`.
- Los tokens se generan con `crypto.randomBytes(32)`.
- Las sesiones se almacenan en memoria del servidor.
- Si el servidor se reinicia, los usuarios siguen existiendo, pero las sesiones activas se invalidan.

---

## 🖥️ Vistas del frontend

| Ruta | Descripción |
|---|---|
| `/login.html` | Acceso y registro de usuario |
| `/home.html` | Dashboard principal |
| `/index.html` | Gestión de la motocicleta |
| `/maintenance.html` | Registro de mantenimientos |
| `/mockups.html` | Mockups académicos de baja, media y alta fidelidad |

---

## 🔄 Recorrido de uso

1. El usuario entra a `/login.html` y puede registrarse o iniciar sesión.
2. Después del acceso llega a `/home.html`, donde ve el resumen general y accesos rápidos.
3. En `/index.html` registra o edita la ficha principal de su motocicleta.
4. En `/maintenance.html` guarda los servicios realizados sobre la moto.
5. Desde cualquier vista puede cambiar entre los temas **Oscuro**, **Claro** y **Esmeralda**.

---

## 🎨 Sistema de temas

La interfaz incluye tres temas visuales seleccionables desde el encabezado:

- **Oscuro**
- **Claro**
- **Esmeralda**

La selección se guarda en `localStorage`, por lo que el usuario conserva su preferencia entre páginas y recargas.

---

## 📷 Imagen de la motocicleta

En la ficha de la moto el usuario puede:

- subir una imagen desde el equipo,
- tomar una foto desde el celular con `capture="environment"`,
- o usar una referencia visual de modelos populares en Colombia cuando no tenga foto propia.

Si no existe foto cargada, el sistema muestra la referencia visual seleccionada del modelo.

---

## 📝 Notas de desarrollo

- Los archivos `motos.json`, `mantenimientos.json` y `users.json` se crean automáticamente si no existen.
- `users.json` está excluido del repositorio mediante `.gitignore`.
- El frontend usa `sessionStorage` para conservar el token de acceso durante la sesión del navegador.
- El módulo está pensado como una implementación ligera, académica y fácil de ejecutar localmente.

---

Desarrollado como parte del proyecto **BikeTracking**.
