# SaludGest — Sistema de Registro Básico de Pacientes

## Integrantes

* Katya Michelle Asencio Bernal - AB23007

* Ángel Josué Cortez Zaldaña - CZ23002

* Kevin Armando Rivera Henríquez - RH16042

* Gerson Balmore López Rodríguez - LR20029

* Julio César Dávila Peñate - DP21008 





Aplicación web tipo **SPA (Single Page Application)** para la gestión clínica básica de pacientes en un centro de salud. Construida con JavaScript Vanilla, HTML5 y CSS3, sin frameworks de UI.

---

## Resumen

SaludGest permite registrar, consultar, editar y eliminar pacientes directamente desde el navegador, sin necesidad de un backend. Los datos se persisten en `localStorage`. Además, integra un directorio de personal médico obtenido desde una API REST externa y genera estadísticas procesadas en segundo plano mediante un **Web Worker**.

---

## Contenido del Proyecto

```
RegistroBasicoPacientes/
├── index.html              # Estructura principal de la SPA (3 secciones: Dashboard, Pacientes, Médicos)
├── style.css               # Estilos globales con soporte de tema oscuro/claro
├── js/
│   ├── app.js              # Orquestador principal: navegación, modales, CRUD UI, gráficos
│   ├── patientService.js   # Servicio CRUD de pacientes (localStorage)
│   ├── doctorsService.js   # Consumo de API REST para personal médico (randomuser.me)
│   ├── geolocationHelper.js# Abstracción de la Geolocation API del navegador
│   └── worker.js           # Web Worker: calcula estadísticas (totales, críticos, edad promedio)
├── .env.example            # Plantilla de variables de entorno
├── package.json            # Dependencias y scripts de Vite
└── netlify.toml            # Configuración de despliegue en Netlify
```

### Módulos principales

| Módulo | Responsabilidad |
|---|---|
| `patientService.js` | CRUD completo con validación y persistencia en `localStorage` |
| `doctorsService.js` | Fetch a `randomuser.me` para poblar el directorio médico |
| `worker.js` | Procesa estadísticas (total, críticos, edad promedio, distribución por estado y tipo de sangre) sin bloquear la UI |
| `geolocationHelper.js` | Obtiene coordenadas GPS del navegador para asociarlas al ingreso del paciente |
| `app.js` | Gestiona navegación SPA, modales, formularios, Chart.js y eventos globales |

### Tecnologías y librerías

- **Vite** — servidor de desarrollo y bundler
- **Chart.js** (CDN) — gráfico de dona para distribución de estados de salud
- **Lucide Icons** (CDN) — iconografía SVG
- **Google Fonts** — tipografías Inter y Outfit
- **Web Workers API** — procesamiento de estadísticas en hilo separado
- **Geolocation API** — captura de coordenadas del usuario
- **Fetch API** — consumo de API REST externa
- **localStorage** — persistencia de pacientes sin backend
- **Netlify** — plataforma de despliegue

### Funcionalidades

- **Dashboard**: métricas en tiempo real (total de pacientes, pacientes críticos, edad promedio, ubicación GPS), gráfico de distribución por estado de salud, vista previa de médicos de guardia.
- **Gestión de Pacientes**: registrar, editar y eliminar pacientes con formulario validado (nombre, edad, género, teléfono, email, grupo sanguíneo, estado de salud, notas de ingreso y coordenadas GPS opcionales). Búsqueda en tiempo real y filtro por estado.
- **Directorio Médico**: tarjetas del personal médico cargadas desde la API REST con especialidad, estado de disponibilidad, teléfono y correo.
- **Tema claro / oscuro**: persistido en `localStorage`.

---

## Instrucciones para Ejecutar

### Requisitos previos

- [Node.js](https://nodejs.org/) v18 o superior
- npm v9 o superior

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Copia el archivo de ejemplo y completa la URL de la API de médicos:

```bash
cp .env.example .env
```

### 3. Iniciar el servidor de desarrollo

```bash
npm run dev
```

Abre tu navegador en la dirección que muestre Vite (por defecto `http://localhost:5173`).

### 4. Generar build de producción

```bash
npm run build
```

Los archivos optimizados se generan en la carpeta `dist/`.

---

## Despliegue en Netlify

El proyecto incluye `netlify.toml` preconfigurado. Basta con conectar el repositorio en [Netlify](https://netlify.com) y definir la variable de entorno `VITE_API_DOCTORS_URL` en el panel de configuración del sitio.

---

## Notas

- Los datos de pacientes se almacenan únicamente en el `localStorage` del navegador; si se limpia el almacenamiento del navegador, los registros se perderán.
- La geolocalización requiere que el usuario otorgue permisos al navegador.
- El directorio médico usa datos ficticios generados por `randomuser.me`; no representa personal médico real.
