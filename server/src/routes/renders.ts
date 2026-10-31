import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { renderWorker } from '../workers/render.worker.js';

const router = Router();

// GET /api/renders/:jobId - Check job status and progress
router.get('/:jobId', (req: Request, res: Response): void => {
  const { jobId } = req.params;
  const job = renderWorker.getJob(jobId);

  if (!job) {
    res.status(404).json({ error: 'Job render tidak ditemukan.' });
    return;
  }

  res.json({
    jobId: job.jobId,
    projectId: job.projectId,
    status: job.status,
    progress: job.progress,
    currentStage: job.currentStage,
    error: job.error,
    fileSize: job.fileSize,
    duration: job.duration,
    downloadUrl: job.status === 'completed' ? `/api/renders/${job.jobId}/download` : null,
    streamUrl: job.status === 'completed' ? `/api/renders/${job.jobId}/stream` : null,
    createdAt: job.createdAt,
    completedAt: job.completedAt,
  });
});

// GET /api/renders/:jobId/stream - Stream rendered MP4 for in-browser playback
router.get('/:jobId/stream', (req: Request, res: Response): void => {
  const { jobId } = req.params;
  const job = renderWorker.getJob(jobId);

  if (!job || job.status !== 'completed' || !job.outputFilePath) {
    res.status(404).send('Render output not ready or not found.');
    return;
  }

  if (!fs.existsSync(job.outputFilePath)) {
    res.status(404).send('File hasil render tidak ditemukan.');
    return;
  }

  const stat = fs.statSync(job.outputFilePath);
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(job.outputFilePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Length', stat.size);
    fs.createReadStream(job.outputFilePath).pipe(res);
  }
});

// GET /api/renders/:jobId/download - Download MP4
router.get('/:jobId/download', (req: Request, res: Response): void => {
  const { jobId } = req.params;
  const job = renderWorker.getJob(jobId);

  if (!job || job.status !== 'completed' || !job.outputFilePath) {
    res.status(404).json({ error: 'Render belum selesai atau file tidak ditemukan.' });
    return;
  }

  if (!fs.existsSync(job.outputFilePath)) {
    res.status(404).json({ error: 'File hasil render tidak ditemukan di storage.' });
    return;
  }

  const downloadFilename = job.outputFileName || `shorts_top5_${job.jobId.slice(0, 8)}.mp4`;

  res.download(job.outputFilePath, downloadFilename, (err) => {
    if (err) {
      console.error('Error during file download:', err);
    }
  });
});

export default router;
