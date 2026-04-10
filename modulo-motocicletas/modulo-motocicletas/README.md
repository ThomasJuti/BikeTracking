# Modulo de Gestion de Motocicletas

Proyecto fullstack con:
- Frontend: HTML, CSS, JavaScript, Bootstrap 5
- Backend: Node.js + Express
- Persistencia: archivo JSON local

## Estructura

- `frontend/`: interfaz de usuario
- `backend/server.js`: API REST y servidor web
- `backend/data/motos.json`: datos persistidos

## Requisitos

1. Instalar Node.js LTS (incluye npm): https://nodejs.org/
2. Tener disponible `node -v` y `npm -v` en terminal

## Ejecutar el proyecto

1. Ir al backend:

```bash
cd backend
```

2. Instalar dependencias:

```bash
npm install
```

3. Iniciar en modo normal:

```bash
npm start
```

Modo desarrollo (auto-reload):

```bash
npm run dev
```

4. Abrir en navegador:

```text
http://localhost:3000
```

## Endpoints API

- `GET /api/health`
- `GET /api/motos`
- `GET /api/motos/:id`
- `POST /api/motos`
- `PUT /api/motos/:id`
- `DELETE /api/motos/:id`

## Modelo de motocicleta

```json
{
  "id": "1712711111-12345",
  "placa": "ABC123",
  "marca": "Yamaha",
  "modelo": "FZ",
  "anio": 2022,
  "cilindraje": "150cc",
  "estado": "activa",
  "propietario": "Juan Perez",
  "fechaRegistro": "2026-04-09T23:10:11.000Z"
}
```

## Notas

- El backend valida placa unica, anio valido y campos obligatorios.
- La interfaz incluye listado, busqueda, filtro por estado, crear, editar y eliminar.
- Si ya tenias datos, permanecen en `backend/data/motos.json`.
