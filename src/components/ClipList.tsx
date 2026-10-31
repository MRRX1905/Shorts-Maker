import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  ChevronUp,
  ChevronDown,
  Volume2,
  VolumeX,
  Scissors,
  Clock,
  Maximize2,
  Check,
} from 'lucide-react';
import { ClipMetadata } from '../types/project.js';

interface ClipListProps {
  clips: ClipMetadata[];
  onReorder: (newClips: ClipMetadata[]) => void;
  onUpdateClip: (clipId: string, updates: Partial<ClipMetadata>) => void;
  numberColors: string[];
}

interface SortableItemProps {
  clip: ClipMetadata;
  index: number;
  totalClips: number;
  color: string;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onOpenTrim: (clip: ClipMetadata) => void;
}

const SortableClipItem: React.FC<SortableItemProps> = ({
  clip,
  index,
  totalClips,
  color,
  onMoveUp,
  onMoveDown,
  onOpenTrim,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: clip.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isLandscape = clip.width > clip.height;
  const effectiveDuration = (clip.trimEnd != null ? clip.trimEnd : clip.duration) - (clip.trimStart || 0);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex items-center gap-3 p-3 rounded-xl border transition-all ${
        isDragging
          ? 'bg-gray-800/90 border-yellow-400 shadow-2xl z-30 scale-[1.02]'
          : 'bg-gray-900/80 border-gray-800 hover:border-gray-700 hover:bg-gray-800/40'
      }`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        type="button"
        className="text-gray-500 hover:text-yellow-400 cursor-grab active:cursor-grabbing p-1 rounded transition-colors touch-none"
        title="Geser untuk mengubah urutan"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Ranking number badge */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0 shadow-sm border border-black/30"
        style={{
          backgroundColor: color,
          color: '#FFFFFF',
          textShadow: '0 1px 2px rgba(0,0,0,0.9)',
        }}
      >
        {index + 1}
      </div>

      {/* Thumbnail */}
      <div className="relative w-14 h-16 rounded-lg overflow-hidden bg-gray-950 border border-gray-700 shrink-0">
        {clip.thumbnailUrl ? (
          <img
            src={clip.thumbnailUrl}
            alt={clip.originalName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs font-mono">
            VID
          </div>
        )}
        <div className="absolute bottom-0.5 right-0.5 px-1 rounded bg-black/80 text-[9px] font-mono text-gray-200">
          {effectiveDuration.toFixed(1)}s
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-bold text-gray-100 truncate">
            {clip.originalName}
          </p>
          {isLandscape && (
            <span className="shrink-0 text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 px-1.5 py-0.2 rounded">
              Crop 9:16
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1 text-[11px] text-gray-400">
          <span className="flex items-center gap-1 font-mono text-gray-300">
            <Clock className="w-3 h-3 text-gray-500" />
            {effectiveDuration.toFixed(1)} detik
            {(clip.trimStart > 0 || clip.trimEnd != null) && (
              <span className="text-[10px] text-yellow-400 font-sans font-semibold">
                (Dipotong)
              </span>
            )}
          </span>

          <span className="text-gray-600">•</span>
          <span className="font-mono text-gray-400">
            {clip.width}×{clip.height}
          </span>

          <span className="text-gray-600">•</span>
          <span className="flex items-center gap-1">
            {clip.hasAudio ? (
              <span title="Ada audio asli">
                <Volume2 className="w-3 h-3 text-emerald-400" />
              </span>
            ) : (
              <span title="Tanpa audio (audio senyap disisipkan)">
                <VolumeX className="w-3 h-3 text-gray-500" />
              </span>
            )}
            <span className="text-[10px] text-gray-400">
              {clip.hasAudio ? 'Audio asli' : 'Senyap'}
            </span>
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Trim button */}
        <button
          onClick={() => onOpenTrim(clip)}
          type="button"
          className="p-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-yellow-400 hover:bg-gray-800 transition-colors cursor-pointer"
          title="Atur durasi awal & akhir klip (Trim)"
        >
          <Scissors className="w-3.5 h-3.5" />
        </button>

        {/* Up / Down buttons */}
        <div className="flex flex-col">
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            type="button"
            className="p-1 rounded text-gray-400 hover:text-white disabled:opacity-20 hover:bg-gray-800 transition-colors cursor-pointer"
            title="Pindah ke atas"
          >
            <ChevronUp className="w-3 h-3" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === totalClips - 1}
            type="button"
            className="p-1 rounded text-gray-400 hover:text-white disabled:opacity-20 hover:bg-gray-800 transition-colors cursor-pointer"
            title="Pindah ke bawah"
          >
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const ClipList: React.FC<ClipListProps> = ({
  clips,
  onReorder,
  onUpdateClip,
  numberColors,
}) => {
  const [activeTrimClip, setActiveTrimClip] = useState<ClipMetadata | null>(null);
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(0);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = clips.findIndex((c) => c.id === active.id);
      const newIndex = clips.findIndex((c) => c.id === over.id);
      const reordered = arrayMove(clips, oldIndex, newIndex).map((c, i) => ({
        ...c,
        order: i + 1,
      }));
      onReorder(reordered);
    }
  };

  const moveUp = (index: number) => {
    if (index > 0) {
      const reordered = arrayMove(clips, index, index - 1).map((c, i) => ({
        ...c,
        order: i + 1,
      }));
      onReorder(reordered);
    }
  };

  const moveDown = (index: number) => {
    if (index < clips.length - 1) {
      const reordered = arrayMove(clips, index, index + 1).map((c, i) => ({
        ...c,
        order: i + 1,
      }));
      onReorder(reordered);
    }
  };

  const openTrimModal = (clip: ClipMetadata) => {
    setActiveTrimClip(clip);
    setTrimStart(clip.trimStart || 0);
    setTrimEnd(clip.trimEnd != null ? clip.trimEnd : clip.duration);
  };

  const saveTrim = () => {
    if (!activeTrimClip) return;
    onUpdateClip(activeTrimClip.id, {
      trimStart: Math.max(0, trimStart),
      trimEnd: trimEnd >= activeTrimClip.duration ? null : Math.max(trimStart + 0.1, trimEnd),
    });
    setActiveTrimClip(null);
  };

  const totalDuration = clips.reduce((acc, c) => {
    const eff = (c.trimEnd != null ? c.trimEnd : c.duration) - (c.trimStart || 0);
    return acc + Math.max(0, eff);
  }, 0);

  return (
    <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-yellow-400 text-gray-950 flex items-center justify-center text-xs font-black">
              2
            </span>
            Urutan Klip Video (1 s/d 5)
          </h2>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Tarik atau gunakan panah untuk mengatur urutan penayangan
          </p>
        </div>
        <div className="text-right">
          <span className="text-[11px] font-mono font-bold text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5 rounded-full">
            Total: {totalDuration.toFixed(1)}s / 180s
          </span>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={clips.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2.5">
            {clips.map((clip, index) => (
              <SortableClipItem
                key={clip.id}
                clip={clip}
                index={index}
                totalClips={clips.length}
                color={numberColors[index] || '#FFFFFF'}
                onMoveUp={() => moveUp(index)}
                onMoveDown={() => moveDown(index)}
                onOpenTrim={openTrimModal}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Trim Modal Dialog */}
      {activeTrimClip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Scissors className="w-4 h-4 text-yellow-400" />
                Atur Trim Klip #{activeTrimClip.order}
              </h3>
              <span className="text-xs text-gray-400 font-mono">
                Asli: {activeTrimClip.duration.toFixed(1)}s
              </span>
            </div>

            <p className="text-xs text-gray-300 font-semibold truncate mb-4">
              {activeTrimClip.originalName}
            </p>

            {/* Video preview for trim */}
            {activeTrimClip.streamUrl && (
              <div className="rounded-xl overflow-hidden bg-black aspect-video max-h-48 mb-4 border border-gray-800 flex items-center justify-center">
                <video
                  src={activeTrimClip.streamUrl}
                  controls
                  className="max-h-48 object-contain"
                />
              </div>
            )}

            {/* Sliders */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-gray-300 mb-1">
                  <span>Mulai (Trim Start):</span>
                  <span className="font-mono text-yellow-400">{trimStart.toFixed(1)}s</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={Math.max(0, (activeTrimClip.trimEnd ?? activeTrimClip.duration) - 0.5)}
                  step="0.1"
                  value={trimStart}
                  onChange={(e) => setTrimStart(parseFloat(e.target.value))}
                  className="w-full accent-yellow-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-gray-300 mb-1">
                  <span>Selesai (Trim End):</span>
                  <span className="font-mono text-yellow-400">{trimEnd.toFixed(1)}s</span>
                </div>
                <input
                  type="range"
                  min={trimStart + 0.5}
                  max={activeTrimClip.duration}
                  step="0.1"
                  value={trimEnd}
                  onChange={(e) => setTrimEnd(parseFloat(e.target.value))}
                  className="w-full accent-yellow-400 cursor-pointer"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-gray-800/80 border border-gray-700 text-center">
                <span className="text-xs text-gray-400">Durasi Terpilih: </span>
                <span className="text-xs font-mono font-bold text-white">
                  {(trimEnd - trimStart).toFixed(1)} detik
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setActiveTrimClip(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={saveTrim}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-gray-950 bg-yellow-400 hover:bg-yellow-300 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Simpan Trim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
