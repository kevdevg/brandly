import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import multer from "multer";

// ═══ Uploads directory ═══
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// ─── Multer: memory storage for transcription (existing) ───
const memoryUpload = multer({ storage: multer.memoryStorage() });

// ─── Multer: disk storage for persistent media uploads ───
const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.bin';
    const id = crypto.randomUUID();
    cb(null, `${id}${ext}`);
  },
});

const mediaUpload = multer({
  storage: diskStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB max
  },
  fileFilter: (_req, file, cb) => {
    const allowed = /^(image|video|audio)\//;
    if (allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Add JSON parser with generous limit for render payloads (timelineElements can be large)
  app.use(express.json({ limit: '50mb' }));

  // ═══ Serve uploaded media files ═══
  app.use("/api/media", express.static(UPLOADS_DIR, {
    maxAge: "1d",
    immutable: true,
  }));

  // ═══ Upload media file (persistent storage) ═══
  app.post("/api/upload", mediaUpload.single("file"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const url = `/api/media/${req.file.filename}`;
    console.log(`📁 Uploaded: ${req.file.originalname} → ${url} (${(req.file.size / 1024).toFixed(1)} KB)`);

    res.json({
      url,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  });

  // ═══ Transcription (existing) ═══
  app.post("/api/transcribe", memoryUpload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      if (!process.env.GROQ_API_KEY) {
        return res.status(500).json({ error: "GROQ_API_KEY not configured" });
      }

      const blob = new Blob([req.file.buffer], { type: req.file.mimetype || "audio/mpeg" });
      const formData = new FormData();
      formData.append("file", blob, req.file.originalname || "audio.mp3");
      formData.append("model", "whisper-large-v3");
      formData.append("response_format", "verbose_json");
      formData.append("timestamp_granularities[]", "word");

      const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const err = await response.text();
        console.error("Groq API error:", err);
        return res.status(response.status).json({ error: err });
      }

      const data = await response.json();
      // Return both text and word-level timestamps
      res.json({
        text: data.text,
        words: data.words || [],  // [{ word, start, end }]
        segments: data.segments || [],
      });
    } catch (error) {
      console.error("Transcription error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ═══ Stock Media Proxy (Pexels) ═══
  const PEXELS_API_KEY = process.env.PEXELS_API_KEY || '';

  app.get("/api/stock/photos", async (req, res) => {
    if (!PEXELS_API_KEY) {
      return res.status(501).json({ error: "PEXELS_API_KEY not configured" });
    }
    try {
      const { q, page = "1", per_page = "20" } = req.query;
      const endpoint = q
        ? `https://api.pexels.com/v1/search?query=${encodeURIComponent(String(q))}&page=${page}&per_page=${per_page}`
        : `https://api.pexels.com/v1/curated?page=${page}&per_page=${per_page}`;
      
      const response = await fetch(endpoint, {
        headers: { Authorization: PEXELS_API_KEY },
      });
      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/stock/videos", async (req, res) => {
    if (!PEXELS_API_KEY) {
      return res.status(501).json({ error: "PEXELS_API_KEY not configured" });
    }
    try {
      const { q, page = "1", per_page = "15" } = req.query;
      const endpoint = q
        ? `https://api.pexels.com/videos/search?query=${encodeURIComponent(String(q))}&page=${page}&per_page=${per_page}`
        : `https://api.pexels.com/videos/popular?page=${page}&per_page=${per_page}`;

      const response = await fetch(endpoint, {
        headers: { Authorization: PEXELS_API_KEY },
      });
      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Download a stock file to uploads/ for persistent use
  app.post("/api/stock/download", async (req, res) => {
    try {
      const { url, filename } = req.body;
      if (!url || !filename) {
        return res.status(400).json({ error: "url and filename required" });
      }

      const ext = path.extname(filename) || '.jpg';
      const safeFilename = `stock-${crypto.randomUUID()}${ext}`;
      const outputPath = path.join(UPLOADS_DIR, safeFilename);

      const response = await fetch(url);
      if (!response.ok) throw new Error(`Download failed: ${response.status}`);

      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(outputPath, buffer);

      res.json({ url: `/api/media/${safeFilename}` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ═══ Render Queue ═══
  const RENDERS_DIR = path.join(process.cwd(), "renders");
  if (!fs.existsSync(RENDERS_DIR)) {
    fs.mkdirSync(RENDERS_DIR, { recursive: true });
  }

  // Serve rendered files
  app.use("/api/renders", express.static(RENDERS_DIR, {
    maxAge: "1h",
  }));

  // Lazy-load render queue (heavy dependencies)
  let renderQueue: typeof import("./src/server/renderQueue") | null = null;
  async function getRenderQueue() {
    if (!renderQueue) {
      renderQueue = await import("./src/server/renderQueue");
    }
    return renderQueue;
  }

  // Start a render job
  app.post("/api/render/start", async (req, res) => {
    try {
      const { format, width, height, fps, durationInFrames, compositionId, inputProps } = req.body;

      if (!format || !width || !height || !compositionId) {
        return res.status(400).json({ error: "Missing required fields: format, width, height, compositionId" });
      }

      const rq = await getRenderQueue();
      const job = rq.createJob({
        format,
        width,
        height,
        fps: fps || 30,
        durationInFrames: durationInFrames || 150,
        compositionId,
        inputProps: inputProps || {},
      });

      console.log(`🎬 Job created: ${job.id} (${format} ${width}x${height})`);
      res.json(job);
    } catch (err: any) {
      console.error("Render start error:", err);
      res.status(500).json({ error: err.message || "Failed to create render job" });
    }
  });

  // List all jobs
  app.get("/api/render/jobs", async (_req, res) => {
    try {
      const rq = await getRenderQueue();
      const jobs = rq.getAllJobs();
      // Strip inputProps (too large for list)
      const sanitized = jobs.map(({ inputProps, ...rest }) => rest);
      res.json(sanitized);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get a single job by ID (used by batch exporter polling)
  app.get("/api/render/jobs/:id", async (req, res) => {
    try {
      const rq = await getRenderQueue();
      const job = rq.getJob(req.params.id);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      // Strip inputProps (too large)
      const { inputProps, ...rest } = job;
      res.json(rest);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete a job
  app.delete("/api/render/jobs/:id", async (req, res) => {
    try {
      const rq = await getRenderQueue();
      const deleted = rq.deleteJob(req.params.id);
      res.json({ deleted });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // SSE — Real-time job progress
  app.get("/api/render/events", async (req, res) => {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });

    // Send initial heartbeat
    res.write("data: {\"type\":\"connected\"}\n\n");

    const clientId = crypto.randomUUID();
    const rq = await getRenderQueue();

    const cleanup = rq.addSSEClient(clientId, (data: string) => {
      res.write(`data: ${data}\n\n`);
    });

    // Heartbeat every 30s to keep connection alive
    const heartbeat = setInterval(() => {
      res.write(": heartbeat\n\n");
    }, 30000);

    req.on("close", () => {
      clearInterval(heartbeat);
      cleanup();
    });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
