import React from 'react';
import { Sliders, Move, Type, Eye, RotateCcw, Sparkles } from 'lucide-react';
import { ProjectStyle } from '../types/project.js';

interface StyleCustomizerProps {
  style: ProjectStyle;
  onChangeStyle: (newStyle: Partial<ProjectStyle>) => void;
}

export const StyleCustomizer: React.FC<StyleCustomizerProps> = ({
  style,
  onChangeStyle,
}) => {
  const titleFontSize = style.titleFontSize ?? 64;
  const titlePosY = style.titlePosY ?? 210;
  const numberFontSize = style.numberFontSize ?? 58;
  const descFontSize = style.descFontSize ?? 50;
  const rankingStartX = style.rankingStartX ?? 85;
  const rankingStartY = style.rankingStartY ?? 440;
  const rankingSpacingY = style.rankingSpacingY ?? 120;
  const keepPreviousLabels = style.keepPreviousLabels ?? false;

  const handleResetDefaults = () => {
    onChangeStyle({
      titleFontSize: 64,
      titlePosY: 210,
      numberFontSize: 58,
      descFontSize: 50,
      rankingStartX: 85,
      rankingStartY: 440,
      rankingSpacingY: 120,
      keepPreviousLabels: false,
      displayMode: 'active_only',
    });
  };

  const handleApplyPreset = (preset: 'standard' | 'compact' | 'lower') => {
    if (preset === 'standard') {
      onChangeStyle({
        titleFontSize: 64,
        titlePosY: 210,
        numberFontSize: 58,
        descFontSize: 50,
        rankingStartX: 85,
        rankingStartY: 440,
        rankingSpacingY: 120,
      });
    } else if (preset === 'compact') {
      onChangeStyle({
        titleFontSize: 56,
        titlePosY: 160,
        numberFontSize: 48,
        descFontSize: 42,
        rankingStartX: 70,
        rankingStartY: 360,
        rankingSpacingY: 95,
      });
    } else if (preset === 'lower') {
      onChangeStyle({
        titleFontSize: 60,
        titlePosY: 240,
        numberFontSize: 52,
        descFontSize: 46,
        rankingStartX: 90,
        rankingStartY: 540,
        rankingSpacingY: 110,
      });
    }
  };

  return (
    <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-yellow-400 text-gray-950 flex items-center justify-center text-xs font-black">
            <Sliders className="w-3 h-3" />
          </span>
          <h2 className="text-sm font-bold text-white">Ukuran Teks & Posisi Overlay</h2>
        </div>
        <button
          type="button"
          onClick={handleResetDefaults}
          className="flex items-center gap-1 text-[11px] font-semibold text-gray-400 hover:text-yellow-400 bg-gray-800 hover:bg-gray-700/80 px-2 py-0.5 rounded-lg border border-gray-700 transition-colors cursor-pointer"
          title="Kembalikan ke ukuran dan posisi standar"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>

      {/* 1. Aturan Tampilan Deskripsi (Hilang di video selanjutnya) */}
      <div className="p-3 rounded-xl bg-gray-950 border border-gray-800/80 mb-4">
        <label className="text-xs font-bold text-white flex items-center justify-between mb-2">
          <span className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-yellow-400" />
            Perilaku Deskripsi Ranking
          </span>
          <span className="text-[10px] font-mono text-yellow-400 uppercase">
            {keepPreviousLabels ? 'Menumpuk' : 'Bergantian (Hilang)'}
          </span>
        </label>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() =>
              onChangeStyle({
                keepPreviousLabels: false,
                displayMode: 'active_only',
              })
            }
            className={`p-2 rounded-lg text-left text-xs transition-all border cursor-pointer ${
              !keepPreviousLabels
                ? 'bg-yellow-400/10 border-yellow-400 text-yellow-300 font-bold'
                : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-0.5">
              <span>Hilang di Klip Berikut</span>
              {!keepPreviousLabels && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />}
            </div>
            <p className="text-[10px] text-gray-500 font-normal leading-tight">
              Deskripsi sebelumnya hilang saat video berikutnya diputar.
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              onChangeStyle({
                keepPreviousLabels: true,
                displayMode: 'cumulative',
              })
            }
            className={`p-2 rounded-lg text-left text-xs transition-all border cursor-pointer ${
              keepPreviousLabels
                ? 'bg-yellow-400/10 border-yellow-400 text-yellow-300 font-bold'
                : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-0.5">
              <span>Tetap Tampil (Kumulatif)</span>
              {keepPreviousLabels && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />}
            </div>
            <p className="text-[10px] text-gray-500 font-normal leading-tight">
              Deskripsi yang sudah muncul tetap terlihat sampai akhir video.
            </p>
          </button>
        </div>
      </div>

      {/* Preset Cepat */}
      <div className="flex items-center gap-1.5 mb-4 text-[11px]">
        <span className="text-gray-400 font-medium shrink-0">Preset:</span>
        <button
          type="button"
          onClick={() => handleApplyPreset('standard')}
          className="px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 cursor-pointer"
        >
          Standar
        </button>
        <button
          type="button"
          onClick={() => handleApplyPreset('compact')}
          className="px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 cursor-pointer"
        >
          Rapat/Kompak
        </button>
        <button
          type="button"
          onClick={() => handleApplyPreset('lower')}
          className="px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 cursor-pointer"
        >
          Agak Bawah
        </button>
      </div>

      {/* Sliders: Ukuran Teks */}
      <div className="space-y-3.5 border-t border-gray-800 pt-3">
        <h3 className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
          <Type className="w-3.5 h-3.5 text-yellow-400" />
          Ukuran Huruf (Font Size)
        </h3>

        {/* Title Font Size */}
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Ukuran Judul Utama:</span>
            <span className="font-mono font-bold text-yellow-400">{titleFontSize}px</span>
          </div>
          <input
            type="range"
            min="40"
            max="96"
            step="2"
            value={titleFontSize}
            onChange={(e) => onChangeStyle({ titleFontSize: parseInt(e.target.value, 10) })}
            className="w-full accent-yellow-400 cursor-pointer"
          />
        </div>

        {/* Ranking Numbers Font Size */}
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Ukuran Angka 1-5:</span>
            <span className="font-mono font-bold text-yellow-400">{numberFontSize}px</span>
          </div>
          <input
            type="range"
            min="34"
            max="80"
            step="2"
            value={numberFontSize}
            onChange={(e) => onChangeStyle({ numberFontSize: parseInt(e.target.value, 10) })}
            className="w-full accent-yellow-400 cursor-pointer"
          />
        </div>

        {/* Description Font Size */}
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Ukuran Teks Deskripsi:</span>
            <span className="font-mono font-bold text-yellow-400">{descFontSize}px</span>
          </div>
          <input
            type="range"
            min="30"
            max="70"
            step="2"
            value={descFontSize}
            onChange={(e) => onChangeStyle({ descFontSize: parseInt(e.target.value, 10) })}
            className="w-full accent-yellow-400 cursor-pointer"
          />
        </div>
      </div>

      {/* Sliders: Posisi & Tata Letak */}
      <div className="space-y-3.5 border-t border-gray-800 pt-3 mt-4">
        <h3 className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
          <Move className="w-3.5 h-3.5 text-yellow-400" />
          Posisi & Jarak (1080 × 1920)
        </h3>

        {/* Posisi Y Judul */}
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Posisi Judul (Tinggi Y):</span>
            <span className="font-mono font-bold text-yellow-400">{titlePosY}px</span>
          </div>
          <input
            type="range"
            min="100"
            max="420"
            step="5"
            value={titlePosY}
            onChange={(e) => onChangeStyle({ titlePosY: parseInt(e.target.value, 10) })}
            className="w-full accent-yellow-400 cursor-pointer"
          />
        </div>

        {/* Posisi Y Ranking Awal */}
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Posisi Awal Baris Ranking (Y):</span>
            <span className="font-mono font-bold text-yellow-400">{rankingStartY}px</span>
          </div>
          <input
            type="range"
            min="260"
            max="700"
            step="10"
            value={rankingStartY}
            onChange={(e) => onChangeStyle({ rankingStartY: parseInt(e.target.value, 10) })}
            className="w-full accent-yellow-400 cursor-pointer"
          />
        </div>

        {/* Jarak Antar Baris Ranking */}
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Jarak Antar Baris (Spacing):</span>
            <span className="font-mono font-bold text-yellow-400">{rankingSpacingY}px</span>
          </div>
          <input
            type="range"
            min="80"
            max="180"
            step="5"
            value={rankingSpacingY}
            onChange={(e) => onChangeStyle({ rankingSpacingY: parseInt(e.target.value, 10) })}
            className="w-full accent-yellow-400 cursor-pointer"
          />
        </div>

        {/* Posisi X Ranking Kiri */}
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Posisi Margin Kiri (X):</span>
            <span className="font-mono font-bold text-yellow-400">{rankingStartX}px</span>
          </div>
          <input
            type="range"
            min="40"
            max="260"
            step="5"
            value={rankingStartX}
            onChange={(e) => onChangeStyle({ rankingStartX: parseInt(e.target.value, 10) })}
            className="w-full accent-yellow-400 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
