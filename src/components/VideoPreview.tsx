import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Sparkles,
  Layers,
  Clock,
} from 'lucide-react';
import { ClipMetadata, ProjectStyle } from '../types/project.js';

interface VideoPreviewProps {
  title: string;
  clips: ClipMetadata[];
  style: ProjectStyle;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  title,
  clips,
  style,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [activeClipIndex, setActiveClipIndex] = useState(0);

  // Compute timings for each clip
  const clipTimings = clips.map((clip, index) => {
    const trimStart = clip.trimStart || 0;
    const trimEnd = clip.trimEnd != null ? clip.trimEnd : clip.duration;
    const duration = Math.max(0.1, trimEnd - trimStart);
    return {
      index,
      clip,
      trimStart,
      trimEnd,
      duration,
    };
  });

  // Calculate cumulative start times
  let accumulated = 0;
  const timingsWithStart = clipTimings.map((t) => {
    const start = accumulated;
    accumulated += t.duration;
    return {
      ...t,
      startTime: start,
      endTime: accumulated,
    };
  });

  const totalDuration = accumulated > 0 ? accumulated : 1;

  // Determine current active clip based on global currentTime
  const currentTiming =
    timingsWithStart.find(
      (t) => currentTime >= t.startTime && currentTime < t.endTime
    ) || timingsWithStart[timingsWithStart.length - 1] || timingsWithStart[0];

  const currentClip = currentTiming?.clip;
  const currentClipIndex = currentTiming ? currentTiming.index : 0;

  // Keep activeClipIndex in sync
  useEffect(() => {
    setActiveClipIndex(currentClipIndex);
  }, [currentClipIndex]);

  // Sync internal video player when active clip or currentTime changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentTiming) return;

    const clipLocalTime =
      currentTiming.trimStart + (currentTime - currentTiming.startTime);

    // If video source doesn't match current clip's stream
    if (currentClip?.streamUrl && video.src !== window.location.origin + currentClip.streamUrl && !video.src.endsWith(currentClip.streamUrl)) {
      video.src = currentClip.streamUrl;
      video.currentTime = clipLocalTime;
      if (isPlaying) {
        video.play().catch(() => {});
      }
    } else {
      // Small drift correction
      if (Math.abs(video.currentTime - clipLocalTime) > 0.4) {
        video.currentTime = clipLocalTime;
      }
    }
  }, [currentTime, currentClipIndex]);

  // Animation frame loop for playback progression
  useEffect(() => {
    let animFrame: number;
    let lastTimestamp = performance.now();

    const loop = (timestamp: number) => {
      if (isPlaying) {
        const delta = (timestamp - lastTimestamp) / 1000;
        setCurrentTime((prev) => {
          const next = prev + delta;
          if (next >= totalDuration) {
            setIsPlaying(false);
            return totalDuration;
          }
          return next;
        });
      }
      lastTimestamp = timestamp;
      if (isPlaying) {
        animFrame = requestAnimationFrame(loop);
      }
    };

    if (isPlaying) {
      lastTimestamp = performance.now();
      animFrame = requestAnimationFrame(loop);
      videoRef.current?.play().catch(() => {});
    } else {
      videoRef.current?.pause();
    }

    return () => cancelAnimationFrame(animFrame);
  }, [isPlaying, totalDuration]);

  const togglePlay = () => {
    if (currentTime >= totalDuration) {
      setCurrentTime(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleRestart = () => {
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const handleScrub = (newTime: number) => {
    setCurrentTime(newTime);
  };

  const jumpToClip = (index: number) => {
    const timing = timingsWithStart[index];
    if (timing) {
      setCurrentTime(timing.startTime);
      setIsPlaying(true);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m}:${s < 10 ? '0' : ''}${s}.${ms}`;
  };

  const numberColors = style.numberColors || [
    '#22E84A',
    '#F42D68',
    '#269BFA',
    '#F5E51B',
    '#F59E0B',
  ];

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      {/* 9:16 Phone Aspect Frame */}
      <div
        ref={containerRef}
        className="@container relative w-full aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-gray-800 ring-1 ring-gray-700/50 flex flex-col justify-between select-none"
      >
        {/* Background Video Layer */}
        {currentClip?.streamUrl ? (
          <video
            ref={videoRef}
            src={currentClip.streamUrl}
            muted={isMuted}
            playsInline
            loop={false}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-gray-500">
            <Layers className="w-12 h-12 mb-2 text-gray-700" />
            <p className="text-xs font-semibold">Belum Ada Video</p>
          </div>
        )}

        {/* Top Dark Gradient for Text Contrast */}
        <div className="absolute top-0 inset-x-0 h-44 bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-none z-10" />

        {/* 1. TOP TITLE OVERLAY (detik 0 sampai akhir) */}
        <div
          className="absolute inset-x-0 z-20 px-3 text-center pointer-events-none transform -translate-y-1/2"
          style={{
            top: `${((style.titlePosY ?? 210) / 1920) * 100}%`,
          }}
        >
          <h2
            className="font-black uppercase tracking-wider font-shorts leading-tight select-none inline-block max-w-full break-words"
            style={{
              color: style.titleColor || '#FFF21A',
              WebkitTextFillColor: style.titleColor || '#FFF21A',
              fontSize: `calc(${((style.titleFontSize ?? 64) / 1080) * 100}cqw)`,
              paintOrder: 'stroke fill',
              textShadow: '0 0 1px #000, 2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 2px 0 #000, 0 -2px 0 #000, 2px 0 0 #000, -2px 0 0 #000, 0 4px 6px rgba(0,0,0,0.95)',
            }}
          >
            {title ? title.toUpperCase() : 'JUDUL TOP 5'}
          </h2>
        </div>

        {/* 2. RANKING 1-5 OVERLAY (Angka 1-5 dan Deskripsi dengan koordinat & ukuran dinamis) */}
        {clips.map((clip, index) => {
          const timing = timingsWithStart[index];
          const hasStarted = timing ? currentTime >= timing.startTime : false;
          const isPast = timing ? currentTime >= timing.endTime : false;
          const keepPrevious = style.keepPreviousLabels === true;
          const isVisible = keepPrevious ? hasStarted : hasStarted && !isPast;
          const isCurrentClip = currentClipIndex === index;

          const timeSinceStart = timing ? currentTime - timing.startTime : 0;
          const isJustPopped = hasStarted && timeSinceStart < 0.32;
          const color = numberColors[index] || '#FFFFFF';

          const rankingStartY = style.rankingStartY ?? 440;
          const rankingSpacingY = style.rankingSpacingY ?? 120;
          const rankingStartX = style.rankingStartX ?? 85;
          const numberFontSize = style.numberFontSize ?? 58;
          const descFontSize = style.descFontSize ?? 50;

          const rowYPercent = ((rankingStartY + index * rankingSpacingY) / 1920) * 100;
          const rowXPercent = (rankingStartX / 1080) * 100;

          return (
            <div
              key={clip.id}
              className="absolute z-20 flex items-center gap-2.5 transform -translate-y-1/2 pointer-events-none"
              style={{
                top: `${rowYPercent}%`,
                left: `${rowXPercent}%`,
                right: '4%',
              }}
            >
              {/* Number: ALWAYS VISIBLE FROM DETIK 0 */}
              <div
                className={`font-black shrink-0 font-shorts tracking-tight transition-opacity ${
                  isCurrentClip ? 'opacity-100 scale-105' : 'opacity-90'
                }`}
                style={{
                  color,
                  WebkitTextFillColor: color,
                  fontSize: `calc(${((numberFontSize) / 1080) * 100}cqw)`,
                  paintOrder: 'stroke fill',
                  textShadow: '0 0 1px #000, 2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 2px 0 #000, 0 -2px 0 #000, 2px 0 0 #000, -2px 0 0 #000, 0 3px 5px rgba(0,0,0,0.95)',
                }}
              >
                {index + 1}.
              </div>

              {/* Description: Visible only on active clip if keepPrevious is false */}
              {isVisible ? (
                <div
                  className={`font-black text-white font-shorts tracking-wide truncate transition-transform ${
                    isJustPopped ? 'scale-110 translate-x-1 duration-150' : 'scale-100 duration-200'
                  }`}
                  style={{
                    color: '#FFFFFF',
                    WebkitTextFillColor: '#FFFFFF',
                    fontSize: `calc(${((descFontSize) / 1080) * 100}cqw)`,
                    paintOrder: 'stroke fill',
                    textShadow: '0 0 1px #000, 2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 2px 0 #000, 0 -2px 0 #000, 2px 0 0 #000, -2px 0 0 #000, 0 3px 5px rgba(0,0,0,0.95)',
                  }}
                >
                  {clip.description || `Pilihan #${index + 1}`}
                </div>
              ) : null}
            </div>
          );
        })}

        {/* Overlay Current Active Clip Indicator badge */}
        <div className="relative z-20 pb-4 px-4 flex items-center justify-between text-white/90 text-xs">
          <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 font-mono text-[11px] font-bold">
            Klip #{currentClipIndex + 1} ({currentClip?.originalName?.slice(0, 15)}...)
          </span>
          <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 font-mono text-[11px]">
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </span>
        </div>

        {/* Play/Pause Center Tap Area */}
        <button
          onClick={togglePlay}
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
        >
          <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-2xl">
            {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
          </div>
        </button>
      </div>

      {/* Media Controller Bar */}
      <div className="w-full bg-gray-900 border border-gray-800 rounded-2xl p-4 mt-3 shadow-lg">
        {/* Visual Multi-Segment Timeline */}
        <div className="relative mb-3">
          <div className="w-full h-3 bg-gray-950 rounded-full overflow-hidden flex border border-gray-800">
            {timingsWithStart.map((t, i) => {
              const segWidthPercent = (t.duration / totalDuration) * 100;
              const color = numberColors[i] || '#FFFFFF';
              const isCurrent = currentClipIndex === i;

              return (
                <div
                  key={t.clip.id}
                  onClick={() => jumpToClip(i)}
                  style={{ width: `${segWidthPercent}%` }}
                  className={`h-full border-r border-gray-900 relative cursor-pointer hover:brightness-125 transition-all ${
                    isCurrent ? 'opacity-100' : 'opacity-60'
                  }`}
                  title={`Klip ${i + 1}: ${t.duration.toFixed(1)}s (Mulai ${t.startTime.toFixed(1)}s)`}
                >
                  <div
                    className="h-full"
                    style={{ backgroundColor: color }}
                  />
                </div>
              );
            })}
          </div>

          {/* Scrub input over timeline */}
          <input
            type="range"
            min="0"
            max={totalDuration}
            step="0.05"
            value={currentTime}
            onChange={(e) => handleScrub(parseFloat(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
          />

          {/* Scrub Needle */}
          <div
            className="absolute top-[-2px] bottom-[-2px] w-1 bg-white shadow-lg pointer-events-none rounded-full"
            style={{
              left: `${(currentTime / totalDuration) * 100}%`,
              transform: 'translateX(-50%)',
            }}
          />
        </div>

        {/* Playback Controls & Quick Jump Buttons */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={togglePlay}
              type="button"
              className="w-9 h-9 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-gray-950 flex items-center justify-center font-bold transition-all shadow-md cursor-pointer"
              title={isPlaying ? 'Jeda' : 'Putar'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>

            <button
              onClick={handleRestart}
              type="button"
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
              title="Mulai Ulang dari Detik 0"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsMuted(!isMuted)}
              type="button"
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
              title={isMuted ? 'Bunyikan' : 'Bisukan'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>

          {/* Jump to clip buttons [1] [2] [3] [4] [5] */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-gray-500 font-mono hidden sm:inline mr-1">
              Lompat:
            </span>
            {clips.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => jumpToClip(i)}
                className={`w-6 h-6 rounded-md text-xs font-black font-shorts transition-all cursor-pointer ${
                  currentClipIndex === i
                    ? 'ring-2 ring-white scale-110 shadow-lg'
                    : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: numberColors[i],
                  color: '#FFFFFF',
                  textShadow: '0 1px 2px rgba(0,0,0,0.9)',
                }}
                title={`Lompat ke klip #${i + 1}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
