import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { execFile } from 'child_process';
import { Project, ClipMetadata } from '../types.js';
import { probeVideoFile, generateThumbnail, validateProjectLimits } from '../services/validation.service.js';
import { renderWorker } from '../workers/render.worker.js';
import { deleteDirectoryRecursive } from '../services/cleanup.service.js';

const router = Router();

const uploadsDir = path.resolve(process.cwd(), 'storage', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.mp4';
    cb(null, `clip_${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 250 * 1024 * 1024, // 250MB per clip
    files: 5,
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska', 'video/avi'];
    if (allowedMimes.includes(file.mimetype) || file.originalname.match(/\.(mp4|mov|webm|mkv|avi)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Format file tidak didukung. Harap unggah video MP4, MOV, atau WebM.'));
    }
  },
});

// Helper to generate a demo clip if needed
function createDemoClip(
  color: string,
  outPath: string,
  freq: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      '-y',
      '-f', 'lavfi',
      '-i', `color=c=${color}:s=1080x1920:d=4.0`,
      '-f', 'lavfi',
      '-i', `sine=frequency=${freq}:sample_rate=44100`,
      '-t', '4.0',
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      outPath,
    ];

    execFile('ffmpeg', args, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

// POST /api/projects - Upload files and create project
router.post('/', upload.array('videos', 5), async (req: Request, res: Response): Promise<void> => {
  try {
    const files = (req.files as Express.Multer.File[]) || [];
    if (files.length === 0) {
      res.status(400).json({ error: 'Tidak ada video yang diunggah. Minimal dan maksimal 5 video.' });
      return;
    }

    const projectId = uuidv4();
    const projectDir = path.join(uploadsDir, projectId);
    fs.mkdirSync(projectDir, { recursive: true });

    let parsedMetadata: any = {};
    if (req.body.metadata) {
      try {
        parsedMetadata = JSON.parse(req.body.metadata);
      } catch (e) {
        // ignore
      }
    }

    const title = (req.body.title || parsedMetadata.title || 'TOP 5 MAU KUKIS GAK?').slice(0, 60);

    const initialDescriptions = [
      'Kembar 👯',
      'Cantik ❤️',
      'Lucu 😂',
      'Pintar 🧠',
      'Imut 🥰',
    ];

    const clips: ClipMetadata[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const targetFilePath = path.join(projectDir, file.filename);
      // Move from temp uploads to project dir
      fs.renameSync(file.path, targetFilePath);

      // FFprobe validation
      const probe = await probeVideoFile(targetFilePath);

      // Thumbnail generation
      const thumbFilename = `thumb_${path.parse(file.filename).name}.jpg`;
      const thumbPath = path.join(projectDir, thumbFilename);
      await generateThumbnail(targetFilePath, thumbPath, Math.min(1, probe.duration / 2));

      const desc =
        parsedMetadata.clips?.[i]?.description ||
        initialDescriptions[i] ||
        `Pilihan #${i + 1}`;

      clips.push({
        id: uuidv4(),
        originalName: file.originalname,
        storedFilename: file.filename,
        filePath: targetFilePath,
        size: probe.size,
        duration: probe.duration,
        width: probe.width,
        height: probe.height,
        videoCodec: probe.videoCodec,
        hasAudio: probe.hasAudio,
        audioCodec: probe.audioCodec,
        order: i + 1,
        description: desc.slice(0, 30),
        trimStart: 0,
        trimEnd: null,
        thumbnailUrl: `/api/projects/${projectId}/files/${thumbFilename}`,
        streamUrl: `/api/projects/${projectId}/files/${file.filename}`,
      });
    }

    const project: Project = {
      id: projectId,
      title,
      aspectRatio: '9:16',
      resolution: { width: 1080, height: 1920 },
      fps: 30,
      clips,
      style: {
        preset: 'top-five-trend',
        titleColor: '#FFF21A',
        outlineColor: '#111111',
        numberColors: ['#22E84A', '#F42D68', '#269BFA', '#F5E51B', '#F59E0B'],
        labelAnimation: 'pop-in-once',
        keepPreviousLabels: false,
        titleFontSize: 64,
        titlePosY: 210,
        numberFontSize: 58,
        descFontSize: 50,
        rankingStartX: 85,
        rankingStartY: 440,
        rankingSpacingY: 120,
        displayMode: 'active_only',
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    renderWorker.registerProject(project);

    res.status(201).json({
      success: true,
      project,
    });
  } catch (error: any) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: error.message || 'Gagal memproses upload video.' });
  }
});

// POST /api/projects/demo - Generate 5 demo vertical clips instantly
router.post('/demo', async (_req: Request, res: Response): Promise<void> => {
  try {
    const projectId = uuidv4();
    const projectDir = path.join(uploadsDir, projectId);
    fs.mkdirSync(projectDir, { recursive: true });

    const demoItems = [
      { color: '#1E3A8A', title: 'Top 1: Kembar 👯', desc: 'Kembar 👯', freq: 440 },
      { color: '#831843', title: 'Top 2: Cantik ❤️', desc: 'Cantik ❤️', freq: 523 },
      { color: '#065F46', title: 'Top 3: Lucu 😂', desc: 'Lucu 😂', freq: 587 },
      { color: '#78350F', title: 'Top 4: Pintar 🧠', desc: 'Pintar 🧠', freq: 659 },
      { color: '#4C1D95', title: 'Top 5: Imut 🥰', desc: 'Imut 🥰', freq: 784 },
    ];

    const clips: ClipMetadata[] = await Promise.all(
      demoItems.map(async (item, i) => {
        const filename = `demo_clip_${i + 1}.mp4`;
        const filePath = path.join(projectDir, filename);

        await createDemoClip(item.color, filePath, item.freq);
        const probe = await probeVideoFile(filePath);

        const thumbFilename = `thumb_${i + 1}.jpg`;
        const thumbPath = path.join(projectDir, thumbFilename);
        await generateThumbnail(filePath, thumbPath, 1.0);

        return {
          id: uuidv4(),
          originalName: `Klip_Tren_${i + 1}.mp4`,
          storedFilename: filename,
          filePath,
          size: probe.size,
          duration: probe.duration,
          width: probe.width,
          height: probe.height,
          videoCodec: probe.videoCodec,
          hasAudio: probe.hasAudio,
          audioCodec: probe.audioCodec,
          order: i + 1,
          description: item.desc,
          trimStart: 0,
          trimEnd: null,
          thumbnailUrl: `/api/projects/${projectId}/files/${thumbFilename}`,
          streamUrl: `/api/projects/${projectId}/files/${filename}`,
        };
      })
    );

    const project: Project = {
      id: projectId,
      title: 'TOP 5 MAU KUKIS GAK?',
      aspectRatio: '9:16',
      resolution: { width: 1080, height: 1920 },
      fps: 30,
      clips,
      style: {
        preset: 'top-five-trend',
        titleColor: '#FFF21A',
        outlineColor: '#111111',
        numberColors: ['#22E84A', '#F42D68', '#269BFA', '#F5E51B', '#F59E0B'],
        labelAnimation: 'pop-in-once',
        keepPreviousLabels: false,
        titleFontSize: 64,
        titlePosY: 210,
        numberFontSize: 58,
        descFontSize: 50,
        rankingStartX: 85,
        rankingStartY: 440,
        rankingSpacingY: 120,
        displayMode: 'active_only',
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    renderWorker.registerProject(project);

    res.status(201).json({
      success: true,
      project,
    });
  } catch (error: any) {
    console.error('Error generating demo project:', error);
    res.status(500).json({ error: error.message || 'Gagal membuat proyek demo.' });
  }
});

// GET /api/projects/:id - Retrieve project details
router.get('/:id', (req: Request, res: Response): void => {
  const project = renderWorker.getProject(req.params.id);
  if (!project) {
    res.status(404).json({ error: 'Proyek tidak ditemukan.' });
    return;
  }
  res.json({ project });
});

// PATCH /api/projects/:id - Update metadata, ordering, descriptions, trim
router.patch('/:id', (req: Request, res: Response): void => {
  const project = renderWorker.getProject(req.params.id);
  if (!project) {
    res.status(404).json({ error: 'Proyek tidak ditemukan.' });
    return;
  }

  const { title, clips, style } = req.body;

  if (typeof title === 'string') {
    project.title = title.slice(0, 60);
  }

  if (Array.isArray(clips)) {
    // Update clips descriptions and order
    const clipMap = new Map(project.clips.map((c) => [c.id, c]));
    const updatedClips: ClipMetadata[] = [];

    clips.forEach((incomingClip: any, index: number) => {
      const existing = clipMap.get(incomingClip.id);
      if (existing) {
        existing.order = index + 1;
        if (incomingClip.description !== undefined) {
          existing.description = String(incomingClip.description).slice(0, 30);
        }
        if (typeof incomingClip.trimStart === 'number') {
          existing.trimStart = Math.max(0, incomingClip.trimStart);
        }
        if (incomingClip.trimEnd !== undefined) {
          existing.trimEnd = incomingClip.trimEnd === null ? null : Math.max(existing.trimStart + 0.1, incomingClip.trimEnd);
        }
        updatedClips.push(existing);
      }
    });

    if (updatedClips.length === project.clips.length) {
      project.clips = updatedClips;
    }
  }

  if (style) {
    project.style = { ...project.style, ...style };
  }

  project.updatedAt = Date.now();
  renderWorker.registerProject(project);

  res.json({ success: true, project });
});

// POST /api/projects/:id/validate - Validate project ready for render
router.post('/:id/validate', (req: Request, res: Response): void => {
  const project = renderWorker.getProject(req.params.id);
  if (!project) {
    res.status(404).json({ error: 'Proyek tidak ditemukan.' });
    return;
  }

  const validation = validateProjectLimits(project.title, project.clips);
  res.json({
    valid: validation.valid,
    errors: validation.errors,
  });
});

// POST /api/projects/:id/render - Start render job
router.post('/:id/render', (req: Request, res: Response): void => {
  const project = renderWorker.getProject(req.params.id);
  if (!project) {
    res.status(404).json({ error: 'Proyek tidak ditemukan.' });
    return;
  }

  const validation = validateProjectLimits(project.title, project.clips);
  if (!validation.valid) {
    res.status(400).json({
      error: 'Proyek belum memenuhi kriteria render.',
      details: validation.errors,
    });
    return;
  }

  try {
    const job = renderWorker.createJob(project.id);
    res.status(202).json({
      success: true,
      jobId: job.jobId,
      status: job.status,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal memulai job render.' });
  }
});

// GET /api/projects/:id/files/:filename - Stream clip or thumbnail file
router.get('/:id/files/:filename', (req: Request, res: Response): void => {
  const { id, filename } = req.params;
  // Prevent path traversal
  const safeFilename = path.basename(filename);
  const filePath = path.join(uploadsDir, id, safeFilename);

  if (!fs.existsSync(filePath)) {
    res.status(404).send('File not found');
    return;
  }

  const stat = fs.statSync(filePath);
  const range = req.headers.range;

  if (range) {
    // Handle HTTP 206 Partial Content for smooth video scrubbing in browser
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': filename.endsWith('.jpg') ? 'image/jpeg' : 'video/mp4',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    res.sendFile(filePath);
  }
});

// DELETE /api/projects/:id - Delete project and clean up files
router.delete('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  renderWorker.deleteProject(id);
  const projectDir = path.join(uploadsDir, id);
  deleteDirectoryRecursive(projectDir);

  res.json({ success: true, message: 'Proyek dan file sementara berhasil dihapus.' });
});

export default router;
