# BikeTracking

Repositorio principal del proyecto BikeTracking. Aquí conviven los entregables del proyecto académico, la implementación principal del sistema y el módulo personal de motocicletas desarrollado en paralelo.

---

## 🚀 Contenido del repositorio

- **Backend/**: implementación principal del backend del proyecto.
- **Frontend/**: implementación principal del frontend del proyecto.
- **modulo-motocicletas/**: módulo funcional independiente con Node.js + Express + frontend vanilla.
- **Documents y archivos de planeación**: cronogramas, matrices y documentos de gestión del proyecto.

---

## 📂 Estructura general

```text
BikeTracking/
├── Backend/
├── Frontend/
├── modulo-motocicletas/
├── Documents
├── Estructura de Desglose del Trabajo.xlsx
├── MATRIZ DE GESTION DE RIESGOS.xlsx
├── MATRIZ RACI.xlsx
├── Planeacion cronograma proyecto bikertracker .xlsx
├── Planeacion cronograma proyecto bikertracker corregido.xlsx
└── README.md
```

---

## 🏍️ Módulo Motocicletas

El directorio `modulo-motocicletas/` contiene un módulo ejecutable de forma independiente con las siguientes capacidades:

- Registro e inicio de sesión de usuarios.
- Gestión de motocicletas.
- Registro de mantenimientos.
- Dashboard personal.
- Tres temas visuales: Oscuro, Claro y Esmeralda.

Documentación específica del módulo:

- `modulo-motocicletas/README.md`

---

## 🛠️ Tecnologías presentes en el repositorio

- Node.js
- Express
- HTML, CSS y JavaScript
- Bootstrap
- Angular y NestJS en la implementación principal del proyecto

---

## ▶️ Ejecución rápida del módulo independiente

```bash
cd modulo-motocicletas/backend
npm install
npm start
```

Luego abre:

```text
http://localhost:3000
```

---

## 📝 Notas

- El módulo `modulo-motocicletas` puede ejecutarse sin depender del resto de carpetas del repositorio.
- La documentación detallada de endpoints, autenticación y vistas está en `modulo-motocicletas/README.md`.
- Este repositorio también conserva archivos académicos y de planificación del proyecto original.