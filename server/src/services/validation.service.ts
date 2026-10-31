import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import { ClipMetadata } from '../types.js';

export interface ProbeResult {
  duration: number;
  width: number;
  height: number;
  videoCodec: string;
  hasAudio: boolean;
  audioCodec?: string;
  size: number;
}

export function probeVideoFile(filePath: string): Promise<ProbeResult> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      return reject(new Error(`File not found: ${filePath}`));
    }

    const stat = fs.statSync(filePath);
    const args = [
      '-v', 'error',
      '-show_entries', 'format=duration,size:stream=index,codec_type,codec_name,width,height,duration',
      '-of', 'json',
      filePath,
    ];

    execFile('ffprobe', args, (error, stdout, stderr) => {
      if (error) {
        return reject(new Error(`FFprobe failed: ${stderr || error.message}`));
      }

      try {
        const data = JSON.parse(stdout);
        const streams = data.streams || [];
        const videoStream = streams.find((s: any) => s.codec_type === 'video');
        const audioStream = streams.find((s: any) => s.codec_type === 'audio');

        if (!videoStream) {
          return reject(new Error('File tidak mengandung trek video yang valid.'));
        }

        const duration = parseFloat(data.format?.duration || videoStream.duration || '0');
        const width = parseInt(videoStream.width || '0', 10);
        const height = parseInt(videoStream.height || '0', 10);
        const videoCodec = videoStream.codec_name || 'unknown';
        const hasAudio = !!audioStream;
        const audioCodec = audioStream?.codec_name;

        if (isNaN(duration) || duration <= 0) {
          return reject(new Error('Durasi video tidak terdeteksi atau 0 detik.'));
        }

        resolve({
          duration,
          width,
          height,
          videoCodec,
          hasAudio,
          audioCodec,
          size: stat.size,
        });
      } catch (parseError: any) {
        reject(new Error(`Gagal membaca metadata video: ${parseError.message}`));
      }
    });
  });
}

export function generateThumbnail(videoPath: string, outputThumbPath: string, atSecond: number = 0.5): Promise<string> {
  return new Promise((resolve, reject) => {
    const parentDir = path.dirname(outputThumbPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    const args = [
      '-y',
      '-ss', atSecond.toString(),
      '-i', videoPath,
      '-vframes', '1',
      '-vf', 'scale=360:640:force_original_aspect_ratio=decrease',
      outputThumbPath,
    ];

    execFile('ffmpeg', args, (error) => {
      if (error) {
        // Retry at second 0 if second 0.5 fails on very short video
        const retryArgs = [
          '-y',
          '-ss', '0',
          '-i', videoPath,
          '-vframes', '1',
          '-vf', 'scale=360:640:force_original_aspect_ratio=decrease',
          outputThumbPath,
        ];
        execFile('ffmpeg', retryArgs, (retryErr) => {
          if (retryErr) {
            return reject(retryErr);
          }
          resolve(outputThumbPath);
        });
        return;
      }
      resolve(outputThumbPath);
    });
  });
}

export function validateProjectLimits(
  title: string,
  clips: ClipMetadata[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!title || title.trim().length === 0) {
    errors.push('Judul utama wajib diisi.');
  } else if (title.trim().length > 60) {
    errors.push('Judul utama maksimal 60 karakter.');
  }

  if (clips.length !== 5) {
    errors.push(`Jumlah video harus tepat 5 klip. Saat ini ada ${clips.length} klip.`);
  }

  let totalDuration = 0;
  clips.forEach((clip, index) => {
    const num = index + 1;
    if (!clip.description || clip.description.trim().length === 0) {
      errors.push(`Deskripsi nomor ${num} wajib diisi.`);
    } else if (clip.description.trim().length > 30) {
      errors.push(`Deskripsi nomor ${num} maksimal 30 karakter.`);
    }

    const effectiveDuration = (clip.trimEnd != null ? clip.trimEnd : clip.duration) - (clip.trimStart || 0);
    if (effectiveDuration <= 0) {
      errors.push(`Durasi klip ${num} tidak valid.`);
    } else if (effectiveDuration > 60) {
      errors.push(`Durasi klip ${num} maksimal 60 detik (saat ini ${effectiveDuration.toFixed(1)}s).`);
    }

    totalDuration += effectiveDuration;
  });

  if (totalDuration > 180) {
    errors.push(`Total durasi klip (${totalDuration.toFixed(1)} detik) melebihi batas maksimal 180 detik.`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
