import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { Project, RenderJob } from '../types.js';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generateSvgOverlays(
  project: Project,
  jobDir: string
): { baseSvgPath: string; descSvgPaths: string[] } {
  const numberColors = project.style?.numberColors || [
    '#22E84A',
    '#F42D68',
    '#269BFA',
    '#F5E51B',
    '#F59E0B',
  ];
  const titleColor = project.style?.titleColor || '#FFF21A';
  const outlineColor = project.style?.outlineColor || '#111111';

  // Customizable typography and positions
  const titleFontSize = project.style?.titleFontSize ?? 64;
  const titlePosY = project.style?.titlePosY ?? 210;
  const numberFontSize = project.style?.numberFontSize ?? 58;
  const descFontSize = project.style?.descFontSize ?? 50;
  const rankingStartX = project.style?.rankingStartX ?? 85;
  const rankingStartY = project.style?.rankingStartY ?? 440;
  const rankingSpacingY = project.style?.rankingSpacingY ?? 120;

  const rowYs = [0, 1, 2, 3, 4].map((i) => rankingStartY + i * rankingSpacingY);
  const descX = rankingStartX + numberFontSize + 28;

  // Base SVG containing Title & Numbers 1-5
  const baseSvgPath = path.join(jobDir, 'overlay_base.svg');

  const numbersSvg = [1, 2, 3, 4, 5]
    .map((num, i) => {
      const color = numberColors[i] || '#FFFFFF';
      const y = rowYs[i];
      return `<text x="${rankingStartX}" y="${y}" class="num" fill="${color}">${num}.</text>`;
    })
    .join('\n    ');

  const titleStrokeWidth = Math.max(6, Math.round(titleFontSize * 0.16));
  const numStrokeWidth = Math.max(5, Math.round(numberFontSize * 0.14));
  const descStrokeWidth = Math.max(5, Math.round(descFontSize * 0.15));

  const baseSvgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  <defs>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="3" dy="5" stdDeviation="5" flood-color="#000000" flood-opacity="0.95"/>
    </filter>
  </defs>
  <style>
    .title {
      font-family: 'DejaVu Sans', 'Liberation Sans', 'Noto Sans', sans-serif;
      font-size: ${titleFontSize}px;
      font-weight: 900;
      fill: ${titleColor};
      stroke: ${outlineColor};
      stroke-width: ${titleStrokeWidth}px;
      paint-order: stroke fill;
      text-anchor: middle;
      letter-spacing: 2px;
      filter: url(#shadow);
    }
    .num {
      font-family: 'DejaVu Sans', 'Liberation Sans', 'Noto Sans', sans-serif;
      font-size: ${numberFontSize}px;
      font-weight: 900;
      stroke: ${outlineColor};
      stroke-width: ${numStrokeWidth}px;
      paint-order: stroke fill;
      filter: url(#shadow);
    }
  </style>
  <!-- Background Header Gradient for optimal legibility -->
  <rect x="0" y="0" width="1080" height="${Math.max(300, titlePosY + 120)}" fill="url(#topFade)" opacity="0.3" />
  <text x="540" y="${titlePosY}" class="title">${escapeXml(project.title.toUpperCase())}</text>
  ${numbersSvg}
</svg>`;

  fs.writeFileSync(baseSvgPath, baseSvgContent, 'utf8');

  // Descriptions 1 to 5
  const descSvgPaths: string[] = [];
  project.clips.forEach((clip, i) => {
    const descPath = path.join(jobDir, `overlay_desc_${i + 1}.svg`);
    const y = rowYs[i];
    const text = escapeXml(clip.description.trim());

    const descSvgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  <defs>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="3" dy="5" stdDeviation="5" flood-color="#000000" flood-opacity="0.95"/>
    </filter>
  </defs>
  <style>
    .desc {
      font-family: 'DejaVu Sans', 'Liberation Sans', 'Noto Sans', 'Noto Color Emoji', sans-serif;
      font-size: ${descFontSize}px;
      font-weight: 800;
      fill: #FFFFFF;
      stroke: ${outlineColor};
      stroke-width: ${descStrokeWidth}px;
      paint-order: stroke fill;
      filter: url(#shadow);
    }
  </style>
  <text x="${descX}" y="${y}" class="desc">${text}</text>
</svg>`;

    fs.writeFileSync(descPath, descSvgContent, 'utf8');
    descSvgPaths.push(descPath);
  });

  return { baseSvgPath, descSvgPaths };
}

export interface RenderProgressCallback {
  (progress: number, stage: string): void;
}

export function executeRender(
  project: Project,
  jobDir: string,
  outputFilePath: string,
  onProgress: RenderProgressCallback
): Promise<{ outputFilePath: string; totalDuration: number }> {
  return new Promise((resolve, reject) => {
    onProgress(5, 'Menyiapkan overlay dan konfigurasi FFmpeg...');

    // 1. Calculate effective clip durations & start timestamps
    const clipTimings: { clipIndex: number; startTrim: number; endTrim: number; duration: number; startTime: number }[] = [];
    let cumulativeTime = 0;

    project.clips.forEach((clip, index) => {
      const trimStart = clip.trimStart || 0;
      const trimEnd = clip.trimEnd != null ? clip.trimEnd : clip.duration;
      const effectiveDuration = Math.max(0.1, trimEnd - trimStart);

      clipTimings.push({
        clipIndex: index,
        startTrim: trimStart,
        endTrim: trimEnd,
        duration: effectiveDuration,
        startTime: cumulativeTime,
      });

      cumulativeTime += effectiveDuration;
    });

    const totalDuration = cumulativeTime;

    // 2. Generate SVGs
    const { baseSvgPath, descSvgPaths } = generateSvgOverlays(project, jobDir);

    // 3. Build FFmpeg command arguments safely using an array
    const args: string[] = ['-y'];

    // Add inputs: 5 clips
    project.clips.forEach((clip) => {
      args.push('-i', clip.filePath);
    });

    // Add overlay inputs: base + 5 descriptions (inputs 5, 6, 7, 8, 9, 10)
    args.push('-i', baseSvgPath);
    descSvgPaths.forEach((p) => {
      args.push('-i', p);
    });

    // Build filter complex
    const filterComplexParts: string[] = [];

    // Clip normalization
    project.clips.forEach((clip, i) => {
      const timing = clipTimings[i];
      const vFilter = `[${i}:v]trim=start=${timing.startTrim}:end=${timing.endTrim},setpts=PTS-STARTPTS,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920:(in_w-1080)/2:(in_h-1920)/2,setsar=1,fps=30[v${i}]`;
      filterComplexParts.push(vFilter);

      if (clip.hasAudio) {
        const aFilter = `[${i}:a]atrim=start=${timing.startTrim}:end=${timing.endTrim},asetpts=PTS-STARTPTS,aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[a${i}]`;
        filterComplexParts.push(aFilter);
      } else {
        // Generate silent audio of exact duration
        const aFilter = `anullsrc=channel_layout=stereo:sample_rate=44100,atrim=duration=${timing.duration.toFixed(3)}[a${i}]`;
        filterComplexParts.push(aFilter);
      }
    });

    // Concat 5 video and audio streams
    const concatInputList = project.clips.map((_, i) => `[v${i}][a${i}]`).join('');
    filterComplexParts.push(`${concatInputList}concat=n=5:v=1:a=1[v_concat][a_concat]`);

    // Overlay chain
    const baseOverlayInputIndex = 5;
    filterComplexParts.push(`[v_concat][${baseOverlayInputIndex}:v]overlay=0:0[v_ov0]`);

    let prevVideoNode = 'v_ov0';
    const keepPrevious = project.style?.keepPreviousLabels === true;

    descSvgPaths.forEach((_, i) => {
      const timing = clipTimings[i];
      const descInputIndex = 6 + i;
      const nextVideoNode = i === descSvgPaths.length - 1 ? 'v_final' : `v_ov${i + 1}`;
      const tStart = timing.startTime.toFixed(3);
      const tEnd = (timing.startTime + timing.duration).toFixed(3);

      // Enable condition: disappear on next clip if keepPrevious is false (default)
      const enableCondition = keepPrevious ? `gte(t,${tStart})` : `between(t,${tStart},${tEnd})`;

      // Pop-in animation: pop from slight left offset over 0.28s, then stable
      const overlayExpr = `overlay=x='if(lt(t,${tStart}),NAN,if(lt(t,${(timing.startTime + 0.28).toFixed(3)}),25*(1-(t-${tStart})/0.28),0))':y=0:enable='${enableCondition}'`;
      filterComplexParts.push(`[${prevVideoNode}][${descInputIndex}:v]${overlayExpr}[${nextVideoNode}]`);
      prevVideoNode = nextVideoNode;
    });

    args.push('-filter_complex', filterComplexParts.join(';\n'));
    args.push(
      '-map', '[v_final]',
      '-map', '[a_concat]',
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '22',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-movflags', '+faststart',
      outputFilePath
    );

    onProgress(15, 'Memulai proses encoding video...');

    const ffmpegProc = spawn('ffmpeg', args);

    ffmpegProc.stderr.on('data', (data) => {
      const output = data.toString();

      // Check for time=HH:MM:SS.xx in ffmpeg log to compute real progress
      const match = output.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
      if (match) {
        const hours = parseFloat(match[1]);
        const minutes = parseFloat(match[2]);
        const seconds = parseFloat(match[3]);
        const currentTime = hours * 3600 + minutes * 60 + seconds;

        const percent = Math.min(98, Math.max(15, Math.round(15 + (currentTime / totalDuration) * 80)));
        onProgress(percent, `Menggabungkan klip & overlay (${currentTime.toFixed(1)}s / ${totalDuration.toFixed(1)}s)...`);
      }
    });

    ffmpegProc.on('error', (err) => {
      reject(new Error(`Gagal menjalankan FFmpeg: ${err.message}`));
    });

    ffmpegProc.on('close', (code) => {
      if (code === 0) {
        onProgress(100, 'Render berhasil diselesaikan!');
        resolve({ outputFilePath, totalDuration });
      } else {
        reject(new Error(`FFmpeg keluar dengan status error code ${code}`));
      }
    });
  });
}
