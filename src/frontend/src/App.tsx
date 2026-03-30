import { Toaster } from "@/components/ui/sonner";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { type AudioSettings, AudioSidebar } from "./components/AudioSidebar";
import { ProjectSelector } from "./components/ProjectSelector";
import { TimelineEditor } from "./components/TimelineEditor";
import { TopNav } from "./components/TopNav";
import { VideoPreview } from "./components/VideoPreview";
import { WaveformVisualizer } from "./components/WaveformVisualizer";
import {
  useCreateExportJob,
  useCreateProject,
  useGetAllProjects,
  useUpdateAudioSettings,
} from "./hooks/useQueries";

const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  noiseReduction: 60,
  eqBass: 2,
  eqMid: 0,
  eqTreble: -1,
  pitchShift: 0,
  voiceClarity: 45,
  deEsser: 30,
  reverbRemoval: 55,
};

export default function App() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(
    DEFAULT_AUDIO_SETTINGS,
  );
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<bigint | null>(
    null,
  );

  const { data: projects = [], isLoading: loadingProjects } =
    useGetAllProjects();
  const createProject = useCreateProject();
  const updateAudioSettings = useUpdateAudioSettings();
  const createExportJob = useCreateExportJob();

  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handleStop = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  const handleSkipForward = useCallback(() => {
    setCurrentTime((prev) => Math.min(duration || 245, prev + 10));
  }, [duration]);

  const handleSkipBack = useCallback(() => {
    setCurrentTime((prev) => Math.max(0, prev - 10));
  }, []);

  const handleSeek = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handleVideoLoaded = useCallback((url: string) => {
    setVideoUrl(url);
    setCurrentTime(0);
    setIsPlaying(false);

    // Extract audio waveform
    fetch(url)
      .then((r) => r.arrayBuffer())
      .then((buffer) => {
        const audioCtx = new AudioContext();
        return audioCtx.decodeAudioData(buffer);
      })
      .then((ab) => setAudioBuffer(ab))
      .catch(() => {
        // Not all video files have extractable audio — silently continue
      });
  }, []);

  const handleApplyAudio = async () => {
    if (!selectedProjectId) {
      toast.error("Select or create a project first");
      return;
    }
    try {
      await updateAudioSettings.mutateAsync({
        projectId: selectedProjectId,
        settings: {
          noiseReductionLevel: BigInt(audioSettings.noiseReduction),
          eqBands: [
            BigInt(audioSettings.eqBass + 12),
            BigInt(audioSettings.eqMid + 12),
            BigInt(audioSettings.eqTreble + 12),
          ],
          pitchShiftSemitones: BigInt(audioSettings.pitchShift),
          voiceClarityLevel: BigInt(audioSettings.voiceClarity),
          deEsserLevel: BigInt(audioSettings.deEsser),
          reverbRemovalLevel: BigInt(audioSettings.reverbRemoval),
        },
      });
      toast.success("Audio enhancement settings saved!");
    } catch {
      toast.error("Failed to save settings");
    }
  };

  const handleExport = async () => {
    if (!selectedProjectId) {
      toast.error("Select or create a project first");
      return;
    }
    try {
      const jobId = await createExportJob.mutateAsync(selectedProjectId);
      toast.success(`Export job #${jobId} created!`);
    } catch {
      toast.error("Failed to create export job");
    }
  };

  const handleCreateProject = async (name: string, description: string) => {
    try {
      const id = await createProject.mutateAsync({ name, description });
      setSelectedProjectId(id);
      toast.success(`Project "${name}" created!`);
    } catch {
      toast.error("Failed to create project");
    }
  };

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{
        background:
          "linear-gradient(160deg, oklch(0.13 0.02 220) 0%, oklch(0.15 0.022 215) 100%)",
      }}
    >
      <Toaster position="top-right" />

      {/* Top Nav */}
      <TopNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onExport={handleExport}
        isExporting={createExportJob.isPending}
      />

      {/* Sub-bar with project selector */}
      <div
        className="flex items-center gap-3 px-4 h-10 border-b flex-shrink-0"
        style={{
          backgroundColor: "oklch(0.15 0.022 220)",
          borderColor: "oklch(1 0 0 / 6%)",
        }}
      >
        <span className="text-xs" style={{ color: "oklch(0.60 0.02 220)" }}>
          Project:
        </span>
        <ProjectSelector
          projects={projects}
          selectedId={selectedProjectId}
          onSelect={setSelectedProjectId}
          onCreate={handleCreateProject}
          isCreating={createProject.isPending}
          isLoading={loadingProjects}
        />
        {selectedProjectId && (
          <span
            className="text-xs font-mono"
            style={{ color: "oklch(0.74 0.12 195 / 70%)" }}
          >
            ID: {selectedProjectId.toString()}
          </span>
        )}
      </div>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden" style={{ gap: "0" }}>
        {/* Left Sidebar */}
        <div
          className="flex-shrink-0 border-r overflow-hidden"
          style={{
            width: "280px",
            borderColor: "oklch(1 0 0 / 6%)",
          }}
        >
          <AudioSidebar
            settings={audioSettings}
            onChange={setAudioSettings}
            onApply={handleApplyAudio}
            isApplying={updateAudioSettings.isPending}
          />
        </div>

        {/* Center + Right content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top section: Video + Waveform */}
          <div
            className="flex flex-1 overflow-hidden"
            style={{
              minHeight: 0,
              gap: "1px",
              backgroundColor: "oklch(1 0 0 / 4%)",
            }}
          >
            {/* Center: Video Preview */}
            <div
              className="flex-1 p-3 overflow-hidden"
              style={{ backgroundColor: "oklch(0.13 0.02 220)" }}
            >
              <VideoPreview
                currentTime={currentTime}
                duration={duration}
                isPlaying={isPlaying}
                onPlayPause={handlePlayPause}
                onStop={handleStop}
                onSkipForward={handleSkipForward}
                onSkipBack={handleSkipBack}
                onTimeUpdate={setCurrentTime}
                onDurationChange={setDuration}
                onVideoLoaded={handleVideoLoaded}
                videoUrl={videoUrl}
              />
            </div>

            {/* Right: Waveform */}
            <div
              className="p-3 overflow-hidden flex-shrink-0"
              style={{
                width: "360px",
                backgroundColor: "oklch(0.13 0.02 220)",
              }}
            >
              <WaveformVisualizer
                audioBuffer={audioBuffer}
                currentTime={currentTime}
                duration={duration > 0 ? duration : 245}
                isPlaying={isPlaying}
              />
            </div>
          </div>

          {/* Bottom: Timeline */}
          <div
            className="flex-shrink-0 border-t"
            style={{
              height: "200px",
              borderColor: "oklch(1 0 0 / 6%)",
              backgroundColor: "oklch(0.13 0.02 220)",
              padding: "8px 12px",
            }}
          >
            <TimelineEditor
              currentTime={currentTime}
              duration={duration}
              onSeek={handleSeek}
              isPlaying={isPlaying}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer
        className="flex-shrink-0 flex items-center justify-center py-1.5 border-t text-xs"
        style={{
          borderColor: "oklch(1 0 0 / 6%)",
          backgroundColor: "oklch(0.14 0.02 220)",
          color: "oklch(0.55 0.02 220)",
        }}
      >
        © {new Date().getFullYear()}. Built with{" "}
        <span style={{ color: "oklch(0.74 0.12 195)", margin: "0 3px" }}>
          ♥
        </span>{" "}
        using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "oklch(0.74 0.12 195)" }}
          className="ml-1 hover:underline"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
