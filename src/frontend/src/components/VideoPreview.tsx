import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Film,
  MoreHorizontal,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Square,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface VideoPreviewProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onStop: () => void;
  onSkipForward: () => void;
  onSkipBack: () => void;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (dur: number) => void;
  onVideoLoaded: (url: string) => void;
  videoUrl: string | null;
}

function formatTimecode(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const f = Math.floor((seconds % 1) * 30);
  return [
    h.toString().padStart(2, "0"),
    m.toString().padStart(2, "0"),
    s.toString().padStart(2, "0"),
    f.toString().padStart(2, "0"),
  ].join(":");
}

export function VideoPreview({
  currentTime,
  duration,
  isPlaying,
  onPlayPause,
  onStop,
  onSkipForward,
  onSkipBack,
  onTimeUpdate,
  onDurationChange,
  onVideoLoaded,
  videoUrl,
}: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;
    video.src = videoUrl;
    video.load();
  }, [videoUrl]);

  const handleFileSelect = useCallback(
    (file: File) => {
      const url = URL.createObjectURL(file);
      onVideoLoaded(url);
    },
    [onVideoLoaded],
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("video/")) {
      handleFileSelect(file);
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className="flex flex-col h-full rounded-xl overflow-hidden border"
      style={{
        backgroundColor: "oklch(0.16 0.022 220)",
        borderColor: "oklch(1 0 0 / 6%)",
        boxShadow: "0 2px 12px 0 rgba(0,0,0,0.4)",
      }}
    >
      <div
        className="flex items-center justify-between px-4 h-11 border-b flex-shrink-0"
        style={{ borderColor: "oklch(1 0 0 / 6%)" }}
      >
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4" style={{ color: "oklch(0.74 0.12 195)" }} />
          <span
            className="text-sm font-semibold"
            style={{ color: "oklch(0.92 0.01 215)" }}
          >
            Video Preview
          </span>
        </div>
        <button type="button" style={{ color: "oklch(0.70 0.02 220)" }}>
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      <div className="relative flex-1 bg-black overflow-hidden">
        {videoUrl ? (
          <>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              onTimeUpdate={(e) => onTimeUpdate(e.currentTarget.currentTime)}
              onDurationChange={(e) =>
                onDurationChange(e.currentTarget.duration)
              }
            >
              <track kind="captions" />
            </video>
            <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-md font-mono text-sm font-bold"
              style={{
                backgroundColor: "rgba(0,0,0,0.7)",
                color: "oklch(0.92 0.01 215)",
                textShadow: "0 1px 4px rgba(0,0,0,0.8)",
              }}
            >
              {formatTimecode(currentTime)}
            </div>
          </>
        ) : (
          <button
            type="button"
            data-ocid="video.dropzone"
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center gap-4 cursor-pointer transition-colors w-full",
              isDragOver && "bg-white/5",
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "oklch(0.74 0.12 195 / 10%)" }}
            >
              <Upload
                className="w-7 h-7"
                style={{ color: "oklch(0.74 0.12 195)" }}
              />
            </div>
            <div className="text-center">
              <p
                className="text-sm font-medium"
                style={{ color: "oklch(0.92 0.01 215)" }}
              >
                Drop video file here
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: "oklch(0.70 0.02 220)" }}
              >
                or click to browse • MP4, MOV, AVI, MKV
              </p>
            </div>
            <div
              className="border-2 border-dashed rounded-xl absolute inset-4 pointer-events-none"
              style={{ borderColor: "oklch(0.74 0.12 195 / 20%)" }}
            />
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          data-ocid="video.upload_button"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
        />
      </div>

      <div className="h-1 bg-white/5 flex-shrink-0">
        <div
          className="h-full transition-all"
          style={{
            width: `${progress}%`,
            backgroundColor: "oklch(0.74 0.12 195)",
          }}
        />
      </div>

      <div
        className="flex items-center justify-center gap-2 px-4 py-3 flex-shrink-0 border-t"
        style={{ borderColor: "oklch(1 0 0 / 6%)" }}
      >
        <Button
          data-ocid="video.secondary_button"
          variant="ghost"
          size="icon"
          className="w-8 h-8"
          onClick={onSkipBack}
          style={{ color: "oklch(0.70 0.02 220)" }}
        >
          <SkipBack className="w-4 h-4" />
        </Button>
        <Button
          data-ocid="video.primary_button"
          size="icon"
          className="w-10 h-10 rounded-full"
          onClick={onPlayPause}
          style={{
            backgroundColor: "oklch(0.74 0.12 195)",
            color: "oklch(0.13 0.02 220)",
          }}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5" />
          )}
        </Button>
        <Button
          data-ocid="video.cancel_button"
          variant="ghost"
          size="icon"
          className="w-8 h-8"
          onClick={onStop}
          style={{ color: "oklch(0.70 0.02 220)" }}
        >
          <Square className="w-4 h-4" />
        </Button>
        <Button
          data-ocid="video.toggle"
          variant="ghost"
          size="icon"
          className="w-8 h-8"
          onClick={onSkipForward}
          style={{ color: "oklch(0.70 0.02 220)" }}
        >
          <SkipForward className="w-4 h-4" />
        </Button>
        <span
          className="text-xs font-mono ml-2"
          style={{ color: "oklch(0.70 0.02 220)" }}
        >
          {formatTimecode(currentTime)} / {formatTimecode(duration)}
        </span>
      </div>
    </div>
  );
}
