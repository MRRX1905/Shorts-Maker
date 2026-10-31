import React, { useState, useEffect, useRef } from 'react';
import { Header } from '../components/Header.js';
import { VideoUploader } from '../components/VideoUploader.js';
import { ClipList } from '../components/ClipList.js';
import { TitleEditor } from '../components/TitleEditor.js';
import { RankingEditor } from '../components/RankingEditor.js';
import { StyleCustomizer } from '../components/StyleCustomizer.js';
import { VideoPreview } from '../components/VideoPreview.js';
import { RenderProgress } from '../components/RenderProgress.js';
import { DownloadPanel } from '../components/DownloadPanel.js';
import { Project, ClipMetadata, RenderJob, ProjectStyle } from '../types/project.js';
import { Play, Sparkles, AlertCircle, CheckCircle2, ChevronRight, Sliders, Film, Type } from 'lucide-react';

export const EditorPage: React.FC = () => {
  const [project, setProject] = useState<Project | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);

  // Render Job State
  const [activeJob, setActiveJob] = useState<RenderJob | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  // Mobile active tab: 'clips' | 'text' | 'style' | 'preview' | 'render'
  const [activeTab, setActiveTab] = useState<'clips' | 'text' | 'style' | 'preview' | 'render'>('clips');

  // Desktop right-panel tab: 'content' | 'style'
  const [rightPanelTab, setRightPanelTab] = useState<'content' | 'style'>('content');

  const pollIntervalRef = useRef<any>(null);

  // Handle uploading 5 files
  const handleUploadFiles = async (files: File[]) => {
    setIsUploading(true);
    setUploadProgress(10);

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('videos', file);
    });

    formData.append(
      'metadata',
      JSON.stringify({
        title: project?.title || 'TOP 5 MAU KUKIS GAK?',
      })
    );

    try {
      setUploadProgress(35);
      const res = await fetch('/api/projects', {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(80);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal mengunggah video.');
      }

      const data = await res.json();
      setProject(data.project);
      setUploadProgress(100);
      setActiveTab('text');
    } catch (err: any) {
      alert(`Gagal upload: ${err.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle 1-click Demo generation
  const handleLoadDemo = async () => {
    setIsLoadingDemo(true);
    try {
      const res = await fetch('/api/projects/demo', {
        method: 'POST',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal memuat demo.');
      }
      const data = await res.json();
      setProject(data.project);
      setActiveTab('preview');
    } catch (err: any) {
      alert(`Error demo: ${err.message}`);
    } finally {
      setIsLoadingDemo(false);
    }
  };

  // Sync project updates to server
  const syncProjectChanges = async (updatedProject: Project) => {
    setProject(updatedProject);
    try {
      await fetch(`/api/projects/${updatedProject.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: updatedProject.title,
          clips: updatedProject.clips,
          style: updatedProject.style,
        }),
      });
    } catch (e) {
      console.error('Failed to sync project:', e);
    }
  };

  const handleTitleChange = (newTitle: string) => {
    if (!project) return;
    const updated = { ...project, title: newTitle };
    syncProjectChanges(updated);
  };

  const handleClipsReorder = (newClips: ClipMetadata[]) => {
    if (!project) return;
    const updated = { ...project, clips: newClips };
    syncProjectChanges(updated);
  };

  const handleUpdateClip = (clipId: string, updates: Partial<ClipMetadata>) => {
    if (!project) return;
    const updatedClips = project.clips.map((c) =>
      c.id === clipId ? { ...c, ...updates } : c
    );
    const updated = { ...project, clips: updatedClips };
    syncProjectChanges(updated);
  };

  const handleUpdateDescription = (clipId: string, description: string) => {
    if (!project) return;
    const updatedClips = project.clips.map((c) =>
      c.id === clipId ? { ...c, description } : c
    );
    const updated = { ...project, clips: updatedClips };
    syncProjectChanges(updated);
  };

  const handleUpdateStyle = (newStyle: Partial<ProjectStyle>) => {
    if (!project) return;
    const updated = {
      ...project,
      style: { ...project.style, ...newStyle },
    };
    syncProjectChanges(updated);
  };

  // Start Render
  const handleStartRender = async () => {
    if (!project) return;
    setRenderError(null);

    try {
      const res = await fetch(`/api/projects/${project.id}/render`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        const msg = data.details ? data.details.join(' ') : data.error;
        throw new Error(msg || 'Gagal memulai render.');
      }

      const data = await res.json();
      const initialJob: RenderJob = {
        jobId: data.jobId,
        projectId: project.id,
        status: data.status || 'queued',
        progress: 5,
        currentStage: 'Menyiapkan proses render FFmpeg...',
        createdAt: Date.now(),
      };

      setActiveJob(initialJob);
      setIsRendering(true);
      startPollingJob(data.jobId);
    } catch (err: any) {
      setRenderError(err.message);
    }
  };

  const startPollingJob = (jobId: string) => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/renders/${jobId}`);
        if (!res.ok) return;

        const jobData: RenderJob = await res.json();
        setActiveJob(jobData);

        if (jobData.status === 'completed' || jobData.status === 'failed') {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      } catch (err) {
        console.error('Error polling render status:', err);
      }
    }, 800);
  };

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const handleNewProject = () => {
    if (confirm('Mulai proyek baru? Proyek yang belum disimpan akan direset.')) {
      setProject(null);
      setActiveJob(null);
      setIsRendering(false);
    }
  };

  // Calculate project readiness
  const isTitleValid = !!(project?.title && project.title.trim().length > 0 && project.title.length <= 60);
  const has5Clips = project?.clips?.length === 5;
  const areAllDescFilled =
    has5Clips &&
    project.clips.every((c) => c.description && c.description.trim().length > 0 && c.description.length <= 30);

  const totalDuration =
    project?.clips?.reduce((acc, c) => {
      const eff = (c.trimEnd != null ? c.trimEnd : c.duration) - (c.trimStart || 0);
      return acc + Math.max(0, eff);
    }, 0) || 0;

  const isDurationValid = totalDuration > 0 && totalDuration <= 180;
  const isReadyToRender = isTitleValid && has5Clips && areAllDescFilled && isDurationValid;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans selection:bg-yellow-400 selection:text-black">
      <Header
        onNewProject={handleNewProject}
        onLoadDemo={handleLoadDemo}
        isLoadingDemo={isLoadingDemo}
        hasProject={!!project}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto p-4 sm:p-6 overflow-hidden">
        {/* If completed, show DownloadPanel prominently */}
        {activeJob && activeJob.status === 'completed' ? (
          <div className="my-auto py-8">
            <DownloadPanel
              job={activeJob}
              onReset={() => {
                setActiveJob(null);
              }}
            />
          </div>
        ) : !project ? (
          // Initial Screen: Upload 5 videos or load demo
          <div className="max-w-2xl mx-auto my-auto w-full py-8">
            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-xs font-bold mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                Tren Top 5 Otomatis • FFmpeg Powered
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white font-shorts tracking-tight">
                Buat Video Shorts <span className="text-yellow-400">Top 5</span> Dalam Hitungan Menit
              </h2>
              <p className="text-sm text-gray-400 mt-2 max-w-lg mx-auto">
                Unggah 5 video vertikal atau landscape, tentukan judul dan deskripsi, lalu sistem akan menyusun dan merender video vertikal 1080×1920 30fps secara otomatis.
              </p>
            </div>

            <VideoUploader
              onUpload={handleUploadFiles}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              onLoadDemo={handleLoadDemo}
              isLoadingDemo={isLoadingDemo}
            />
          </div>
        ) : (
          // Project Editor Screen (Desktop 3-Column / Mobile Tabbed)
          <div className="flex-1 flex flex-col min-h-0">
            {/* Mobile Tab Switcher */}
            <div className="lg:hidden grid grid-cols-5 gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 mb-4 text-[11px]">
              <button
                type="button"
                onClick={() => setActiveTab('clips')}
                className={`py-1.5 font-bold rounded-lg transition-all ${
                  activeTab === 'clips'
                    ? 'bg-yellow-400 text-gray-950'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                1. Klip
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('text')}
                className={`py-1.5 font-bold rounded-lg transition-all ${
                  activeTab === 'text'
                    ? 'bg-yellow-400 text-gray-950'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                2. Teks
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('style')}
                className={`py-1.5 font-bold rounded-lg transition-all ${
                  activeTab === 'style'
                    ? 'bg-yellow-400 text-gray-950'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                3. Posisi
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`py-1.5 font-bold rounded-lg transition-all ${
                  activeTab === 'preview'
                    ? 'bg-yellow-400 text-gray-950'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                4. Preview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('render')}
                className={`py-1.5 font-bold rounded-lg transition-all ${
                  activeTab === 'render'
                    ? 'bg-yellow-400 text-gray-950'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                5. Render
              </button>
            </div>

            {/* Desktop Layout: 3 Columns */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 items-start">
              {/* Left Column: Clips Order & Trim (Col 1-4) */}
              <div
                className={`lg:col-span-4 space-y-4 overflow-y-auto max-h-[calc(100vh-140px)] pr-1 ${
                  activeTab === 'clips' ? 'block' : 'hidden lg:block'
                }`}
              >
                <ClipList
                  clips={project.clips}
                  onReorder={handleClipsReorder}
                  onUpdateClip={handleUpdateClip}
                  numberColors={project.style.numberColors}
                />
              </div>

              {/* Middle Column: 9:16 Video Preview (Col 5-8) */}
              <div
                className={`lg:col-span-4 flex flex-col items-center justify-start ${
                  activeTab === 'preview' ? 'block' : 'hidden lg:flex'
                }`}
              >
                <VideoPreview
                  title={project.title}
                  clips={project.clips}
                  style={project.style}
                />
              </div>

              {/* Right Column: Title & Descriptions Editor OR Style/Position Customizer (Col 9-12) */}
              <div
                className={`lg:col-span-4 space-y-4 overflow-y-auto max-h-[calc(100vh-140px)] pl-1 ${
                  activeTab === 'text' || activeTab === 'style' || activeTab === 'render' ? 'block' : 'hidden lg:block'
                }`}
              >
                {/* Desktop Switcher Tabs */}
                <div className="hidden lg:flex items-center bg-gray-900 border border-gray-800 rounded-xl p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => setRightPanelTab('content')}
                    className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      rightPanelTab === 'content'
                        ? 'bg-yellow-400 text-gray-950 shadow'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <Type className="w-3.5 h-3.5" />
                    <span>Teks & Ranking</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRightPanelTab('style')}
                    className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      rightPanelTab === 'style'
                        ? 'bg-yellow-400 text-gray-950 shadow'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Ukuran & Posisi</span>
                  </button>
                </div>

                {/* Show Content Tab (Teks Judul & Deskripsi) */}
                {(activeTab === 'text' || (!['style', 'clips', 'preview'].includes(activeTab) && rightPanelTab === 'content')) && (
                  <>
                    <TitleEditor
                      title={project.title}
                      onChange={handleTitleChange}
                      titleColor={project.style.titleColor}
                      outlineColor={project.style.outlineColor}
                    />

                    <RankingEditor
                      clips={project.clips}
                      onUpdateDescription={handleUpdateDescription}
                      numberColors={project.style.numberColors}
                    />
                  </>
                )}

                {/* Show Style & Position Customizer */}
                {(activeTab === 'style' || (!['text', 'clips', 'preview'].includes(activeTab) && rightPanelTab === 'style')) && (
                  <StyleCustomizer
                    style={project.style}
                    onChangeStyle={handleUpdateStyle}
                  />
                )}

                {/* Render Launch Card */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-xl">
                  <h3 className="text-sm font-bold text-white mb-2 flex items-center justify-between">
                    <span>Status Kesiapan Render</span>
                    <span className="text-xs font-mono font-bold text-yellow-400">
                      {totalDuration.toFixed(1)}s / 180s
                    </span>
                  </h3>

                  {/* Checklist */}
                  <div className="space-y-1.5 text-xs text-gray-300 mb-4">
                    <div className="flex items-center gap-2">
                      {has5Clips ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                      )}
                      <span>Tepat 5 klip video ({project.clips.length}/5)</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isTitleValid ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                      )}
                      <span>Judul utama terisi (1-60 karakter)</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {areAllDescFilled ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      <span>5 deskripsi ranking terisi lengkap</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isDurationValid ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                      )}
                      <span>Total durasi di bawah 180 detik</span>
                    </div>
                  </div>

                  {renderError && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 mb-4">
                      {renderError}
                    </div>
                  )}

                  {/* Big Render Button */}
                  <button
                    onClick={handleStartRender}
                    disabled={!isReadyToRender || isRendering}
                    type="button"
                    className="w-full py-3.5 px-4 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-gray-950 font-black text-sm tracking-wide shadow-xl shadow-yellow-400/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer font-shorts"
                  >
                    <Film className="w-4 h-4 fill-black stroke-black" />
                    <span>RENDER VIDEO TOP 5 (MP4)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Render Progress Modal */}
      {activeJob && activeJob.status !== 'completed' && (
        <RenderProgress
          job={activeJob}
          onRetry={handleStartRender}
          onDismiss={() => setActiveJob(null)}
        />
      )}
    </div>
  );
};
