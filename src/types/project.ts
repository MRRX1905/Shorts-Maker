export interface ClipMetadata {
  id: string;
  originalName: string;
  storedFilename: string;
  filePath: string;
  size: number;
  duration: number;
  width: number;
  height: number;
  videoCodec: string;
  hasAudio: boolean;
  audioCodec?: string;
  order: number;
  description: string;
  trimStart: number;
  trimEnd?: number | null;
  thumbnailUrl?: string;
  streamUrl?: string;
}

export interface ProjectStyle {
  preset: string;
  titleColor: string;
  outlineColor: string;
  numberColors: string[];
  labelAnimation: 'pop-in-once';
  keepPreviousLabels: boolean;
  titleFontSize?: number;
  titlePosY?: number;
  numberFontSize?: number;
  descFontSize?: number;
  rankingStartX?: number;
  rankingStartY?: number;
  rankingSpacingY?: number;
  displayMode?: 'active_only' | 'cumulative' | 'single_spotlight';
}

export interface Project {
  id: string;
  title: string;
  aspectRatio: '9:16';
  resolution: { width: number; height: number };
  fps: number;
  clips: ClipMetadata[];
  style: ProjectStyle;
  createdAt: number;
  updatedAt: number;
}

export type RenderStatus = 'queued' | 'validating' | 'processing' | 'encoding' | 'completed' | 'failed';

export interface RenderJob {
  jobId: string;
  projectId: string;
  status: RenderStatus;
  progress: number;
  currentStage: string;
  outputFilePath?: string;
  outputFileName?: string;
  fileSize?: number;
  duration?: number;
  error?: string;
  downloadUrl?: string | null;
  streamUrl?: string | null;
  createdAt: number;
  completedAt?: number;
}
