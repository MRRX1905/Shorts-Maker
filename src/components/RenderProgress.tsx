import React from 'react';
import { Loader2, AlertCircle, CheckCircle2, Film, Layers, Clock, Cpu } from 'lucide-react';
import { RenderJob } from '../types/project.js';

interface RenderProgressProps {
  job: RenderJob | null;
  onRetry: () => void;
  onDismiss: () => void;
}

export const RenderProgress: React.FC<RenderProgressProps> = ({
  job,
  onRetry,
  onDismiss,
}) => {
  if (!job) return null;

  const isFailed = job.status === 'failed';
  const isCompleted = job.status === 'completed';

  const stages = [
    { key: 'queued', label: 'Antrean', icon: Clock },
    { key: 'validating', label: 'Validasi', icon: Layers },
    { key: 'processing', label: 'Canvas 9:16', icon: Film },
    { key: 'encoding', label: 'FFmpeg Encode', icon: Cpu },
    { key: 'completed', label: 'Selesai', icon: CheckCircle2 },
  ];

  const getStageIndex = (status: string) => {
    switch (status) {
      case 'queued':
        return 0;
      case 'validating':
        return 1;
      case 'processing':
        return 2;
      case 'encoding':
        return 3;
      case 'completed':
        return 4;
      default:
        return 0;
    }
  };

  const currentIdx = getStageIndex(job.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative overflow-hidden">
        {/* Glow ambient */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center">
          {/* Status Icon */}
          <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-xl">
            {isFailed ? (
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                <AlertCircle className="w-8 h-8" />
              </div>
            ) : isCompleted ? (
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            )}
          </div>

          <h3 className="text-xl font-black text-white font-shorts">
            {isFailed
              ? 'Render Video Gagal'
              : isCompleted
              ? 'Render Berhasil Diselesaikan!'
              : 'Sedang Merender Video Top 5...'}
          </h3>

          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            {isFailed
              ? job.error || 'Terjadi kesalahan saat encoding.'
              : job.currentStage || 'Menjalankan proses FFmpeg...'}
          </p>

          {/* Progress Bar & Percentage */}
          {!isFailed && (
            <div className="mt-6 mb-6">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-gray-300 mb-2">
                <span className="text-gray-400 font-sans">Progres Encoding:</span>
                <span className="text-yellow-400 text-sm">{job.progress}%</span>
              </div>
              <div className="w-full h-3 bg-gray-950 rounded-full overflow-hidden p-0.5 border border-gray-800">
                <div
                  className="h-full bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-300 rounded-full transition-all duration-300 shadow-md shadow-yellow-500/30"
                  style={{ width: `${Math.max(4, job.progress)}%` }}
                />
              </div>
            </div>
          )}

          {/* Stage Steps */}
          {!isFailed && (
            <div className="grid grid-cols-5 gap-1 pt-2 border-t border-gray-800">
              {stages.map((st, i) => {
                const Icon = st.icon;
                const isPassed = currentIdx >= i;
                const isCurrent = currentIdx === i;

                return (
                  <div key={st.key} className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1 text-xs transition-all ${
                        isPassed
                          ? 'bg-yellow-400 text-gray-950 font-bold'
                          : 'bg-gray-800 text-gray-500'
                      } ${isCurrent ? 'ring-2 ring-yellow-400/50 scale-105' : ''}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span
                      className={`text-[10px] font-medium truncate ${
                        isPassed ? 'text-gray-200' : 'text-gray-600'
                      }`}
                    >
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Error actions */}
          {isFailed && (
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={onDismiss}
                className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={onRetry}
                className="px-5 py-2 rounded-xl text-xs font-bold text-gray-950 bg-yellow-400 hover:bg-yellow-300 transition-all cursor-pointer shadow-lg shadow-yellow-400/20"
              >
                Coba Render Ulang
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
