import React from 'react';
import { Download, Play, CheckCircle2, RotateCcw, Share2, Sparkles, Film } from 'lucide-react';
import { RenderJob } from '../types/project.js';

interface DownloadPanelProps {
  job: RenderJob;
  onReset: () => void;
}

export const DownloadPanel: React.FC<DownloadPanelProps> = ({ job, onReset }) => {
  const downloadUrl = job.downloadUrl || `/api/renders/${job.jobId}/download`;
  const streamUrl = job.streamUrl || `/api/renders/${job.jobId}/stream`;

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl max-w-xl mx-auto text-center relative overflow-hidden">
      {/* Success Badge */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-4">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Video Top 5 Siap Diunduh!
      </div>

      <h2 className="text-2xl font-black text-white font-shorts mb-2">
        Hore! Video Shorts Anda Telah Selesai
      </h2>
      <p className="text-xs text-gray-400 max-w-md mx-auto mb-6">
        Video telah dinormalisasi ke format vertikal 1080 × 1920 (9:16), 30 fps, H.264 + AAC dengan overlay teks dan animasi pop-in.
      </p>

      {/* Video Player */}
      <div className="relative w-full max-w-[280px] aspect-[9/16] mx-auto rounded-2xl overflow-hidden bg-black shadow-2xl border-2 border-yellow-400/40 mb-6">
        <video
          src={streamUrl}
          controls
          playsInline
          className="w-full h-full object-cover"
        />
      </div>

      {/* Video Details Card */}
      <div className="grid grid-cols-3 gap-2 bg-gray-950 p-3 rounded-2xl border border-gray-800 mb-6 text-xs">
        <div>
          <span className="text-gray-500 block text-[10px]">Resolusi</span>
          <span className="font-bold text-white font-mono">1080×1920</span>
        </div>
        <div>
          <span className="text-gray-500 block text-[10px]">Durasi</span>
          <span className="font-bold text-white font-mono">{job.duration ? `${job.duration.toFixed(1)}s` : '-'}</span>
        </div>
        <div>
          <span className="text-gray-500 block text-[10px]">Ukuran File</span>
          <span className="font-bold text-white font-mono">{formatFileSize(job.fileSize)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <a
          href={downloadUrl}
          download={job.outputFileName || 'shorts_top5.mp4'}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-gray-950 text-sm font-black tracking-wide shadow-xl shadow-yellow-400/20 transition-all hover:scale-[1.02] cursor-pointer"
        >
          <Download className="w-4 h-4 stroke-[2.5]" />
          <span>UNDUH MP4 SEKARANG</span>
        </a>

        <button
          onClick={onReset}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-semibold transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Buat Video Lain</span>
        </button>
      </div>
    </div>
  );
};
