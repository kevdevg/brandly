# Brandly (Legacy v1)

**Brandly** is a branding automation and editing platform powered by a custom asynchronous rendering engine. This initial release (Legacy v1) serves as a functional Proof of Concept (PoC) demonstrating the viability of using web technologies (HTML/CSS/JS) combined with **Puppeteer** and **FFmpeg** to render multimedia content, bypassing more restrictive solutions.

This repository is open source under the MIT License.

## 🚀 What is it for?

The main goal of Brandly v1 is to enable the creation, real-time preview, and export of dynamic video and image templates (based on a `DesignMD` format).
Through its editing interface, you can:
- Design compositions with multiple layers (video, image, text).
- Inject dynamic brand variables.
- Preview in real time using a React + Vite web engine.
- Export the final composition to an `.mp4` video by running a backend pipeline that captures the screen frame-by-frame with Puppeteer and merges audio/video streams using FFmpeg.

## 🛠 Architecture

The project is a lightweight monorepo containing:
- **Frontend (React + Vite):** The user interface and the canvas player (`LivePreviewCanvas`) to preview changes in real time.
- **Backend (Express / Electron):** API and server endpoints responsible for handling heavy export tasks, bridging Puppeteer for UI capturing and FFmpeg for encoding.

## 📦 Installation and Usage

### Prerequisites
Make sure you have the following installed on your system:
- [Node.js](https://nodejs.org/) (v18+)
- [FFmpeg](https://ffmpeg.org/) (must be available in your system's PATH)
- A package manager like `yarn` or `npm`.

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/kevdevg/brandly.git
   cd brandly
   ```

2. **Install dependencies:**
   ```bash
   yarn install
   # or
   npm install
   ```

3. **Start the Development Environment:**
   To start both the backend server and the frontend development environment simultaneously:
   ```bash
   yarn dev
   ```

4. **Environment Variables:**
   Copy the `.env.example` file to `.env` and configure your ports and endpoints if necessary.
   ```bash
   cp .env.example .env
   ```

## 📜 License

This project is distributed under the **MIT** License. See the `LICENSE` file for more details.