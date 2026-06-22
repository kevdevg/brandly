# Brandly (Legacy v1)

**Brandly** is a branding automation and editing platform powered by a custom asynchronous rendering engine. This initial release serves as a functional Proof of Concept (PoC) demonstrating the viability of using web technologies (HTML/CSS/JS) combined with **Puppeteer** and **FFmpeg** to render multimedia content, bypassing more restrictive solutions.

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

## 📜 License & Credits

This project is open-source and distributed under the **MIT License**.

### What you can do:
- **Commercial use**: You are free to use this project for commercial purposes.
- **Modification**: You can modify the code to fit your needs.
- **Distribution**: You can distribute the original or modified code.
- **Private use**: You can use the code privately without distributing it.

### Conditions:
- **License and copyright notice**: You must include the original copyright notice and a copy of the license in any substantial uses or modifications.

### Disclaimer:
- **No Warranty**: The software is provided "as is", without warranty of any kind.

### Third-Party Credits
This project was built standing on the shoulders of giants. We heavily drew inspiration from **[Remotion](https://www.remotion.dev/)** for programmatic video concepts. We also extensively use **[Puppeteer](https://pptr.dev/)**, **[FFmpeg](https://ffmpeg.org/)**, **[React](https://react.dev/)**, **[Tailwind CSS](https://tailwindcss.com/)**, and **[dnd-kit](https://dndkit.com/)**. Please refer to the `LICENSE` file for full attribution and third-party credits.

---

## 🥚 Easter Egg: Why is there Pokémon code here?

If you explore the root directory, you might notice some unusual files like `manage.py`, `backend_endpoint.py`, `schema.sql`, and folders named `pokemon` and `pokeproject`. 

**What is this doing in a branding automation engine?**
During the early stress-testing phase of Brandly v1, we needed a massive, structured dataset to test the asynchronous rendering engine at scale. We chose **Pokémon**! 

These Python/Django files and Celery workers were originally built as a mock backend to dynamically feed thousands of Pokédex entries and stats into our `DesignMD` templates. This allowed us to benchmark how well the Puppeteer/FFmpeg pipeline could handle parallel rendering of thousands of unique "Pokémon Trading Card" videos. We decided to leave this legacy testing code in the repository as a fun nod to the project's origins and as a potential reference for how to hook up a Django/Celery backend to the Brandly renderer.
