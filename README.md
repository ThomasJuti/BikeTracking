# BikeTracking - Sistema de Gestión de Motocicletas

**BikeTracking** es una aplicación web moderna desarrollada con Angular y NestJS, diseñada para ayudar a los motociclistas a gestionar el mantenimiento de sus vehículos de manera eficiente.
**Documentacion**
- https://docs.google.com/document/d/1N7DbTvqLEeiZ9v5IzPBZ9PAiKhZJIFqsXD-VERdryaI/edit?tab=t.0
## 🚀 Características Principales

- **Gestión de Motocicletas**: Registro, edición y eliminación de motocicletas con detalles como placa, marca, modelo, año, cilindraje, estado y propietario.
- **Registro de Mantenimientos**: Control detallado de servicios de mantenimiento, incluyendo tipo, descripción, fecha, costo y técnico responsable.
- **Dashboard Interactivo**: Visualización clara del estado actual de la motocicleta y próximos mantenimientos sugeridos.
- **Diseño Moderno**: Interfaz de usuario intuitiva y responsive desarrollada con Tailwind CSS.

## 🛠️ Tecnologías Utilizadas

### Frontend
- **Framework**: Angular 21
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Arquitectura**: Standalone Components

### Backend
- **Framework**: NestJS
- **Lenguaje**: TypeScript
- **Base de Datos**: PostgreSQL
- **ORM**: Prisma

## 📂 Estructura del Proyecto

```
BikeTracking/
├── Backend/              # API REST con NestJS
│   ├── src/
│   │   ├── motos/        # Módulo de motocicletas
│   │   ├── mantenimientos/ # Módulo de mantenimientos
│   │   └── ...
│   └── package.json
│
└── Frontend/             # Aplicación web con Angular
    ├── src/
    │   ├── app/
    │   │   ├── modules/
    │   │   │   └── motocicletas/
    │   │   │       ├── pages/
    │   │   │       │   ├── mi-moto/          # Gestión de la motocicleta
    │   │   │       │   └── mantenimiento/    # Registro de mantenimientos
    │   │   │       └── components/         # Componentes reutilizables
    │   │   └── ...
    │   └── ...
    └── package.json
```

## 🚀 Instalación y Ejecución

### Requisitos Previos
- Node.js (v18 o superior)
- npm
- PostgreSQL (opcional, se puede usar SQLite para desarrollo)

### 1. Backend

```bash
# Navegar al directorio del backend
cd Backend

# Instalar dependencias
npm install

# Crear base de datos (si usas PostgreSQL)
npx prisma migrate dev --name init

# Ejecutar la aplicación
npm run start:dev
```

### 2. Frontend

```bash
# Navegar al directorio del frontend
cd Frontend

# Instalar dependencias
npm install

# Ejecutar la aplicación
npm run start
```

La aplicación estará disponible en `http://localhost:4200`.

## 📝 Notas de Desarrollo

- El backend expone endpoints en `/api/motos` y `/api/mantenimientos`.
- El frontend se comunica con el backend a través de `http://localhost:3000/api`.
- Se ha implementado un sistema de validación de datos en ambos lados para asegurar la integridad de la información.



**¡Gracias por usar BikeTracking!** 
