import React from 'react';
import { Type, Sparkles } from 'lucide-react';

interface TitleEditorProps {
  title: string;
  onChange: (newTitle: string) => void;
  titleColor?: string;
  outlineColor?: string;
}

export const TitleEditor: React.FC<TitleEditorProps> = ({
  title,
  onChange,
  titleColor = '#FFF21A',
  outlineColor = '#111111',
}) => {
  const maxLength = 60;
  const isNearLimit = title.length > 50;

  const handleUppercaseToggle = () => {
    onChange(title.toUpperCase());
  };

  return (
    <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-yellow-400 text-gray-950 flex items-center justify-center text-xs font-black">
            3
          </span>
          <h2 className="text-sm font-bold text-white">Judul Utama Video</h2>
        </div>
        <button
          type="button"
          onClick={handleUppercaseToggle}
          className="text-[10px] font-semibold text-yellow-400 hover:text-yellow-300 bg-yellow-400/10 hover:bg-yellow-400/20 px-2 py-0.5 rounded border border-yellow-400/20 transition-colors cursor-pointer"
          title="Ubah ke HURUF KAPITAL sesuai gaya tren Shorts"
        >
          KAPITAL SEMUA
        </button>
      </div>

      <p className="text-xs text-gray-400 mb-3">
        Tampil di bagian atas sepanjang video dengan gaya teks tebal, kuning, dan outline hitam.
      </p>

      <div className="relative">
        <input
          type="text"
          value={title}
          maxLength={maxLength}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Contoh: TOP 5 MAU KUKIS GAK?"
          className="w-full bg-gray-950 border border-gray-700 focus:border-yellow-400 rounded-xl px-4 py-2.5 text-sm font-bold text-white tracking-wide placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-yellow-400 transition-all"
        />
        <div className="absolute right-3 top-2.5 text-xs font-mono font-medium">
          <span className={isNearLimit ? 'text-amber-400 font-bold' : 'text-gray-500'}>
            {title.length}
          </span>
          <span className="text-gray-600">/{maxLength}</span>
        </div>
      </div>

      {/* Visual Live Preview of Title Overlay */}
      <div className="mt-4 p-3 rounded-xl bg-gradient-to-b from-gray-950 to-gray-900 border border-gray-800/80 text-center relative overflow-hidden">
        <span className="absolute top-1.5 left-2 text-[9px] uppercase tracking-wider font-mono text-gray-500">
          Tampilan Judul di Video
        </span>
        <div className="pt-3 pb-1">
          <p
            className="text-base sm:text-lg font-black tracking-wider uppercase font-shorts select-none"
            style={{
              color: titleColor,
              WebkitTextFillColor: titleColor,
              paintOrder: 'stroke fill',
              textShadow: '1.5px 1.5px 0 #000, -1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 0 1.5px 0 #000, 0 -1.5px 0 #000, 1.5px 0 0 #000, -1.5px 0 0 #000, 0 3px 5px rgba(0,0,0,0.95)',
            }}
          >
            {title.trim() ? title.toUpperCase() : 'JUDUL UTAMA AKAN MUNCUL DI SINI'}
          </p>
        </div>
      </div>
    </div>
  );
};
