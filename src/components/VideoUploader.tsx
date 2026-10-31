import React, { useRef, useState } from 'react';
import { UploadCloud, FileVideo, AlertCircle, CheckCircle, Info, Sparkles, Loader2 } from 'lucide-react';

interface VideoUploaderProps {
  onUpload: (files: File[]) => void;
  isUploading: boolean;
  uploadProgress: number;
  onLoadDemo: () => void;
  isLoadingDemo: boolean;
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({
  onUpload,
  isUploading,
  uploadProgress,
  onLoadDemo,
  isLoadingDemo,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFiles = (incomingList: FileList | File[]) => {
    setErrorMessage(null);
    const filesArray = Array.from(incomingList);

    // Filter video files
    const validVideos = filesArray.filter((file) => {
      const isVideoType = file.type.startsWith('video/') || file.name.match(/\.(mp4|mov|webm|mkv)$/i);
      return isVideoType;
    });

    if (validVideos.length === 0) {
      setErrorMessage('Harap pilih file video dengan format MP4, MOV, atau WebM.');
      return;
    }

    // Check individual file size (<= 250MB)
    const oversized = validVideos.find((f) => f.size > 250 * 1024 * 1024);
    if (oversized) {
      setErrorMessage(`File "${oversized.name}" melebihi batas maksimal 250 MB.`);
      return;
    }

    // Check count: Must be exactly 5
    if (validVideos.length !== 5) {
      setSelectedFiles(validVideos);
      setErrorMessage(`Wajib tepat 5 video! Anda saat ini memilih ${validVideos.length} video.`);
      return;
    }

    setSelectedFiles(validVideos);
    setErrorMessage(null);
    onUpload(validVideos);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  return (
    <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-yellow-400 text-gray-950 flex items-center justify-center text-xs font-black">
              1
            </span>
            Upload Tepat 5 Klip Video
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Format MP4, MOV, WebM • Maks 250MB/klip • Landscape akan di-crop otomatis ke 9:16
          </p>
        </div>
        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-800 text-gray-300 border border-gray-700">
          Wajib 5/5
        </span>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
          dragActive
            ? 'border-yellow-400 bg-yellow-400/5 scale-[1.01]'
            : 'border-gray-700 hover:border-gray-500 hover:bg-gray-800/40'
        } ${isUploading ? 'pointer-events-none opacity-70' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="video/mp4,video/quicktime,video/webm"
          onChange={handleChange}
          className="hidden"
        />

        {isUploading ? (
          <div className="flex flex-col items-center justify-center py-4">
            <Loader2 className="w-10 h-10 text-yellow-400 animate-spin mb-3" />
            <p className="text-sm font-semibold text-white">Mengunggah & Memvalidasi FFprobe...</p>
            <p className="text-xs text-gray-400 mt-1">
              Mengekstrak durasi, resolusi, thumbnail, dan trek audio...
            </p>
            <div className="w-full max-w-xs bg-gray-800 h-2 rounded-full overflow-hidden mt-4 border border-gray-700">
              <div
                className="bg-yellow-400 h-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <span className="text-xs font-mono text-yellow-400 mt-2">{uploadProgress}%</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform text-yellow-400">
              <UploadCloud className="w-7 h-7" />
            </div>
            <p className="text-sm font-semibold text-gray-200">
              Tarik & Letakkan 5 File Video Di Sini
            </p>
            <p className="text-xs text-gray-400 mt-1">
              atau klik untuk memilih file dari komputer Anda
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-[11px] text-gray-400">
              <span className="bg-gray-800/80 px-2 py-0.5 rounded border border-gray-700">Tepat 5 video</span>
              <span className="bg-gray-800/80 px-2 py-0.5 rounded border border-gray-700">Maks 60s/klip</span>
              <span className="bg-gray-800/80 px-2 py-0.5 rounded border border-gray-700">MP4 / MOV / WebM</span>
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{errorMessage}</p>
            {selectedFiles.length > 0 && selectedFiles.length !== 5 && (
              <p className="text-gray-400 mt-1">
                Silakan pilih ulang file agar pas berjumlah 5 klip, atau coba tombol demo di bawah.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Selected file pills if invalid count */}
      {selectedFiles.length > 0 && selectedFiles.length !== 5 && (
        <div className="mt-4 space-y-1.5">
          <p className="text-xs font-semibold text-gray-400">File terpilih saat ini ({selectedFiles.length}/5):</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {selectedFiles.map((file, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-800/70 border border-gray-700 text-xs text-gray-300 truncate"
              >
                <FileVideo className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                <span className="truncate">{file.name}</span>
                <span className="ml-auto text-[10px] text-gray-500 font-mono">
                  {(file.size / (1024 * 1024)).toFixed(1)}MB
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* One-click Demo Option */}
      <div className="mt-5 pt-4 border-t border-gray-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-950/40 p-3 rounded-xl">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Info className="w-4 h-4 text-blue-400 shrink-0" />
          <span>Belum punya 5 video vertikal siap pakai?</span>
        </div>
        <button
          onClick={onLoadDemo}
          disabled={isLoadingDemo || isUploading}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isLoadingDemo ? 'Membuat Klip Demo...' : 'Gunakan 5 Klip Contoh Otomatis'}</span>
        </button>
      </div>
    </div>
  );
};
