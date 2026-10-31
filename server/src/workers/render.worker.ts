import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Project, RenderJob } from '../types.js';
import { validateProjectLimits } from '../services/validation.service.js';
import { executeRender } from '../services/ffmpeg.service.js';

class RenderWorker {
  private jobs: Map<string, RenderJob> = new Map();
  private queue: string[] = [];
  private activeJobsCount = 0;
  private maxConcurrent = 2;
  private projectStore: Map<string, Project> = new Map();

  private storageDir: string;
  private jobsDir: string;
  private outputsDir: string;

  constructor() {
    this.storageDir = path.resolve(process.cwd(), 'storage');
    this.jobsDir = path.join(this.storageDir, 'jobs');
    this.outputsDir = path.join(this.storageDir, 'outputs');

    fs.mkdirSync(this.jobsDir, { recursive: true });
    fs.mkdirSync(this.outputsDir, { recursive: true });
  }

  public registerProject(project: Project) {
    this.projectStore.set(project.id, project);
  }

  public getProject(projectId: string): Project | undefined {
    return this.projectStore.get(projectId);
  }

  public deleteProject(projectId: string): boolean {
    return this.projectStore.delete(projectId);
  }

  public createJob(projectId: string): RenderJob {
    const project = this.projectStore.get(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found.`);
    }

    const jobId = uuidv4();
    const job: RenderJob = {
      jobId,
      projectId,
      status: 'queued',
      progress: 0,
      currentStage: 'Menunggu giliran antrean render...',
      createdAt: Date.now(),
    };

    this.jobs.set(jobId, job);
    this.queue.push(jobId);
    this.processNext();

    return job;
  }

  public getJob(jobId: string): RenderJob | undefined {
    return this.jobs.get(jobId);
  }

  private async processNext() {
    if (this.activeJobsCount >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const jobId = this.queue.shift();
    if (!jobId) return;

    const job = this.jobs.get(jobId);
    if (!job) return;

    this.activeJobsCount++;
    await this.runJob(job);
    this.activeJobsCount--;

    // Process next in queue
    this.processNext();
  }

  private async runJob(job: RenderJob) {
    const project = this.projectStore.get(job.projectId);
    if (!project) {
      job.status = 'failed';
      job.error = 'Proyek tidak ditemukan.';
      return;
    }

    // 1. Validating
    job.status = 'validating';
    job.progress = 5;
    job.currentStage = 'Memvalidasi kelayakan klip video & format teks...';

    const validation = validateProjectLimits(project.title, project.clips);
    if (!validation.valid) {
      job.status = 'failed';
      job.error = validation.errors.join(' ');
      return;
    }

    // 2. Processing
    job.status = 'processing';
    job.progress = 10;
    job.currentStage = 'Menyiapkan canvas 1080x1920 dan aset grafis...';

    const jobSpecificDir = path.join(this.jobsDir, job.jobId);
    fs.mkdirSync(jobSpecificDir, { recursive: true });

    const outputFileName = `shorts-${Date.now()}-${job.jobId.slice(0, 8)}.mp4`;
    const outputFilePath = path.join(this.outputsDir, outputFileName);

    try {
      job.status = 'encoding';
      const result = await executeRender(
        project,
        jobSpecificDir,
        outputFilePath,
        (progress, stage) => {
          job.progress = progress;
          job.currentStage = stage;
        }
      );

      const stat = fs.statSync(result.outputFilePath);
      job.status = 'completed';
      job.progress = 100;
      job.currentStage = 'Video Top 5 berhasil selesai dibuat!';
      job.outputFilePath = result.outputFilePath;
      job.outputFileName = outputFileName;
      job.fileSize = stat.size;
      job.duration = result.totalDuration;
      job.completedAt = Date.now();
    } catch (err: any) {
      job.status = 'failed';
      job.error = err.message || 'Terjadi kesalahan saat memproses video dengan FFmpeg.';
      console.error(`[RenderWorker] Render error for job ${job.jobId}:`, err);
    } finally {
      // Clean up intermediate svg files in job folder to save space
      try {
        if (fs.existsSync(jobSpecificDir)) {
          fs.rmSync(jobSpecificDir, { recursive: true, force: true });
        }
      } catch (e) {
        // ignore cleanup error
      }
    }
  }
}

export const renderWorker = new RenderWorker();
