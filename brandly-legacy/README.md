# Brandly (Legacy v1)

**Brandly** es una plataforma de edición y automatización de branding basada en un motor de renderizado asíncrono customizado. Esta versión inicial (Legacy v1) es una prueba de concepto (PoC) funcional que demuestra la viabilidad de utilizar tecnologías web (HTML/CSS/JS) combinadas con **Puppeteer** y **FFmpeg** para renderizar contenido multimedia, alejándose de soluciones más restrictivas.

Este repositorio es de código abierto bajo la licencia MIT.

## 🚀 ¿Para qué sirve?

El objetivo principal de Brandly v1 es permitir la creación, previsualización y exportación de plantillas de video e imágenes dinámicas (basadas en un formato `DesignMD`).
A través de su interfaz de edición, puedes:
- Diseñar composiciones con múltiples capas (video, imagen, texto).
- Inyectar variables de marca dinámicas.
- Previsualizar en tiempo real usando un motor web React + Vite.
- Exportar la composición final a video `.mp4` ejecutando un pipeline backend que captura la pantalla frame a frame con Puppeteer y unifica el audio/video con FFmpeg.

## 🛠 Arquitectura

El proyecto es un monorepo ligero que incluye:
- **Frontend (React + Vite):** Interfaz de usuario y el reproductor de lienzos (`LivePreviewCanvas`) para previsualizar los cambios en tiempo real.
- **Backend (Express / Electron):** API y endpoints de servidor encargados de gestionar las exportaciones pesadas, enlazando Puppeteer para las capturas de la UI y FFmpeg para la codificación.

## 📦 Instalación y Uso

### Prerrequisitos
Asegúrate de tener instalado en tu sistema:
- [Node.js](https://nodejs.org/) (v18+)
- [FFmpeg](https://ffmpeg.org/) (debe estar disponible en tu variable de entorno PATH)
- Gestor de paquetes `yarn` o `npm`.

### Pasos de Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/brandly.git
   cd brandly
   ```

2. **Instalar dependencias:**
   ```bash
   yarn install
   # o
   npm install
   ```

3. **Iniciar en entorno de Desarrollo:**
   Para iniciar tanto el servidor backend como el entorno de desarrollo frontend en simultáneo:
   ```bash
   yarn dev
   ```

4. **Variables de entorno:**
   Copia el archivo `.env.example` a `.env` y configura tus puertos y endpoints si es necesario.
   ```bash
   cp .env.example .env
   ```

## 📜 Licencia

Este proyecto se distribuye bajo la licencia **MIT**. Consulta el archivo `LICENSE` para más detalles.