import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import projectsRouter from './server/src/routes/projects.js';
import rendersRouter from './server/src/routes/renders.js';
import { cleanupExpiredFiles } from './server/src/services/cleanup.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  // Ensure storage directories exist
  const uploadsDir = path.resolve(__dirname, 'storage', 'uploads');
  const jobsDir = path.resolve(__dirname, 'storage', 'jobs');
  const outputsDir = path.resolve(__dirname, 'storage', 'outputs');
  fs.mkdirSync(uploadsDir, { recursive: true });
  fs.mkdirSync(jobsDir, { recursive: true });
  fs.mkdirSync(outputsDir, { recursive: true });

  // Middleware for body parsing
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // Periodic cleanup of expired files (> 2 hours old)
  setInterval(() => {
    cleanupExpiredFiles([uploadsDir, jobsDir, outputsDir], 2 * 60 * 60 * 1000);
  }, 30 * 60 * 1000);

  // Mount API endpoints
  app.use('/api/projects', projectsRouter);
  app.use('/api/renders', rendersRouter);

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'Shorts Maker API',
      timestamp: Date.now(),
    });
  });

  // Setup Vite in dev or static in production
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Shorts Maker] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Shorts Maker] Failed to start server:', err);
  process.exit(1);
});
