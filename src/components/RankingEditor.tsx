import React from 'react';
import { ListOrdered, Smile } from 'lucide-react';
import { ClipMetadata } from '../types/project.js';

interface RankingEditorProps {
  clips: ClipMetadata[];
  onUpdateDescription: (clipId: string, description: string) => void;
  numberColors: string[];
}

export const RankingEditor: React.FC<RankingEditorProps> = ({
  clips,
  onUpdateDescription,
  numberColors,
}) => {
  const commonEmojis = ['👯', '❤️', '😂', '🧠', '🥰', '🔥', '🏆', '✨', '👏', '💯', '👑', '⭐'];

  const appendEmoji = (clip: ClipMetadata, emoji: string) => {
    const current = clip.description || '';
    if (current.length + emoji.length <= 30) {
      onUpdateDescription(clip.id, current + ' ' + emoji);
    }
  };

  return (
    <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-yellow-400 text-gray-950 flex items-center justify-center text-xs font-black">
            4
          </span>
          <h2 className="text-sm font-bold text-white">Deskripsi Ranking (1 s/d 5)</h2>
        </div>
        <span className="text-[10px] text-gray-400 font-medium">
          Maks 30 karakter/nomor
        </span>
      </div>

      <p className="text-xs text-gray-400 mb-4">
        Angka 1–5 selalu terlihat sejak awal. Deskripsi akan muncul bergantian saat klipnya dimulai dan tetap tampil.
      </p>

      {/* Emoji quick bar */}
      <div className="flex items-center gap-1.5 p-2 rounded-xl bg-gray-950 border border-gray-800/80 mb-4 overflow-x-auto">
        <span className="text-[10px] font-semibold text-gray-400 flex items-center gap-1 shrink-0 px-1">
          <Smile className="w-3 h-3 text-yellow-400" />
          Emoji:
        </span>
        <div className="flex items-center gap-1">
          {commonEmojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                // Append to first clip that has less than 28 chars, or currently focused
                if (clips.length > 0) {
                  appendEmoji(clips[0], emoji);
                }
              }}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-800/60 hover:bg-gray-700 hover:scale-110 text-sm transition-all cursor-pointer"
              title={`Sisipkan ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* 5 Input Rows */}
      <div className="space-y-3">
        {clips.map((clip, index) => {
          const color = numberColors[index] || '#FFFFFF';
          const desc = clip.description || '';
          const isNearLimit = desc.length > 25;

          return (
            <div
              key={clip.id}
              className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-950 border border-gray-800 hover:border-gray-700 transition-colors"
            >
              {/* Number Badge */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0 shadow-sm border border-black/40 font-shorts"
                style={{
                  backgroundColor: color,
                  color: '#FFFFFF',
                  textShadow: '0 1px 2px rgba(0,0,0,0.9)',
                }}
              >
                {index + 1}.
              </div>

              {/* Input */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  maxLength={30}
                  value={desc}
                  onChange={(e) => onUpdateDescription(clip.id, e.target.value)}
                  placeholder={`Deskripsi ranking #${index + 1}...`}
                  className="w-full bg-gray-900 border border-gray-700/80 focus:border-yellow-400 rounded-lg px-3 py-1.5 text-xs font-bold text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-yellow-400 transition-all"
                />
              </div>

              {/* Quick emojis for this specific row */}
              <div className="hidden sm:flex items-center gap-1 shrink-0">
                {['👯', '❤️', '😂', '🧠', '🥰'].map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => appendEmoji(clip, em)}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-800 text-xs transition-colors"
                    title={`Tambah ${em} ke nomor ${index + 1}`}
                  >
                    {em}
                  </button>
                ))}
              </div>

              {/* Char count */}
              <div className="text-[11px] font-mono shrink-0 w-8 text-right">
                <span className={isNearLimit ? 'text-amber-400 font-bold' : 'text-gray-500'}>
                  {desc.length}
                </span>
                <span className="text-gray-600">/30</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
