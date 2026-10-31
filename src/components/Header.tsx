import React from 'react';
import { Film, Sparkles, RotateCcw, CheckCircle2, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onNewProject: () => void;
  onLoadDemo: () => void;
  isLoadingDemo: boolean;
  hasProject: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onNewProject,
  onLoadDemo,
  isLoadingDemo,
  hasProject,
}) => {
  return (
    <header className="h-16 bg-gray-900 border-b border-gray-800 px-4 sm:px-6 flex items-center justify-between z-20 shrink-0">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-yellow-500/20">
          <Film className="w-5 h-5 text-gray-950 font-bold" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-black tracking-wide text-white font-shorts">
              SHORTS <span className="text-yellow-400">MAKER</span>
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 px-2 py-0.5 rounded-full">
              Top 5 MVP
            </span>
          </div>
          <p className="text-xs text-gray-400 hidden sm:block">
            Pembuat video vertikal tren Top 5 otomatis dengan FFmpeg
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Load Demo Button */}
        <button
          onClick={onLoadDemo}
          disabled={isLoadingDemo}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-yellow-300 border border-yellow-500/30 transition-all disabled:opacity-50 hover:shadow-md cursor-pointer"
          title="Muat 5 video sampel untuk uji coba langsung"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isLoadingDemo ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">
            {isLoadingDemo ? 'Membuat Sampel...' : 'Gunakan 5 Klip Demo'}
          </span>
          <span className="sm:hidden">
            {isLoadingDemo ? 'Memuat...' : 'Demo'}
          </span>
        </button>

        {/* Reset / New Project */}
        {hasProject && (
          <button
            onClick={onNewProject}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800/80 hover:bg-red-500/20 text-gray-300 hover:text-red-400 border border-gray-700 hover:border-red-500/30 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Proyek Baru</span>
          </button>
        )}

        {/* Server status */}
        <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>FFmpeg Ready</span>
        </div>
      </div>
    </header>
  );
};
