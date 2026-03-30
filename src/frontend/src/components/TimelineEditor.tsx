import { Film, MessageSquare, MoreHorizontal, Music, Zap } from "lucide-react";
import { useEffect, useRef } from "react";

interface Clip {
  id: string;
  track: "video" | "dialogue" | "music" | "sfx";
  start: number;
  duration: number;
  label: string;
}

interface TimelineEditorProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  isPlaying: boolean;
}

const DEMO_CLIPS: Clip[] = [
  { id: "v1", track: "video", start: 0, duration: 245, label: "Main Scene" },
  {
    id: "d1",
    track: "dialogue",
    start: 5,
    duration: 45,
    label: "Opening Line",
  },
  {
    id: "d2",
    track: "dialogue",
    start: 60,
    duration: 80,
    label: "Scene 2 Dialogue",
  },
  { id: "d3", track: "dialogue", start: 160, duration: 60, label: "Closing" },
  { id: "m1", track: "music", start: 0, duration: 120, label: "Intro Theme" },
  { id: "m2", track: "music", start: 130, duration: 115, label: "Outro Music" },
  { id: "s1", track: "sfx", start: 45, duration: 8, label: "Door Creak" },
  { id: "s2", track: "sfx", start: 100, duration: 5, label: "Impact" },
  { id: "s3", track: "sfx", start: 180, duration: 12, label: "Ambient Wind" },
];

const TRACKS = [
  { key: "video" as const, label: "Video", Icon: Film },
  { key: "dialogue" as const, label: "Dialogue", Icon: MessageSquare },
  { key: "music" as const, label: "Music", Icon: Music },
  { key: "sfx" as const, label: "SFX", Icon: Zap },
];

const TRACK_COLORS: Record<string, string> = {
  video: "#2F7DBE",
  dialogue: "#2A6FA8",
  music: "#6D55B6",
  sfx: "#5B47A0",
};

const RULER_HEIGHT = 24;
const TRACK_HEIGHT = 40;
const LABEL_WIDTH = 120;

export function TimelineEditor({
  currentTime,
  duration: propDuration,
  onSeek,
  isPlaying,
}: TimelineEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const totalDuration = propDuration > 0 ? propDuration : 245;

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = RULER_HEIGHT + TRACKS.length * TRACK_HEIGHT;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const W = canvas.width;
      const timelineW = W - LABEL_WIDTH;

      ctx.clearRect(0, 0, W, canvas.height);
      ctx.fillStyle = "#0E1A24";
      ctx.fillRect(0, 0, W, canvas.height);
      ctx.fillStyle = "#141F29";
      ctx.fillRect(0, 0, LABEL_WIDTH, canvas.height);
      ctx.fillStyle = "#182633";
      ctx.fillRect(LABEL_WIDTH, 0, timelineW, RULER_HEIGHT);

      const markerInterval =
        totalDuration <= 60 ? 5 : totalDuration <= 300 ? 30 : 60;
      ctx.fillStyle = "#9AA9B8";
      ctx.font = "10px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      for (let t = 0; t <= totalDuration; t += markerInterval) {
        const x = LABEL_WIDTH + (t / totalDuration) * timelineW;
        const m = Math.floor(t / 60);
        const s = t % 60;
        ctx.fillText(
          `${m}:${s.toString().padStart(2, "0")}`,
          x,
          RULER_HEIGHT - 6,
        );
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, RULER_HEIGHT - 4);
        ctx.lineTo(x, RULER_HEIGHT);
        ctx.stroke();
      }

      for (let idx = 0; idx < TRACKS.length; idx++) {
        const track = TRACKS[idx];
        const y = RULER_HEIGHT + idx * TRACK_HEIGHT;
        const isEven = idx % 2 === 0;
        ctx.fillStyle = isEven ? "rgba(255,255,255,0.015)" : "transparent";
        ctx.fillRect(LABEL_WIDTH, y, timelineW, TRACK_HEIGHT);
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, y + TRACK_HEIGHT);
        ctx.lineTo(W, y + TRACK_HEIGHT);
        ctx.stroke();
        ctx.fillStyle = "#9AA9B8";
        ctx.font = "11px Plus Jakarta Sans, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(track.label, 36, y + TRACK_HEIGHT / 2 + 4);
        ctx.fillStyle = TRACK_COLORS[track.key];
        ctx.beginPath();
        ctx.arc(16, y + TRACK_HEIGHT / 2, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const clip of DEMO_CLIPS) {
        const trackIdx = TRACKS.findIndex((t) => t.key === clip.track);
        if (trackIdx < 0) continue;
        const y = RULER_HEIGHT + trackIdx * TRACK_HEIGHT;
        const x = LABEL_WIDTH + (clip.start / totalDuration) * timelineW;
        const w = (clip.duration / totalDuration) * timelineW;
        const color = TRACK_COLORS[clip.track];

        ctx.fillStyle = `${color}CC`;
        ctx.beginPath();
        roundRect(ctx, x + 1, y + 5, Math.max(4, w - 2), TRACK_HEIGHT - 10, 4);
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        roundRect(ctx, x + 1, y + 5, Math.max(4, w - 2), TRACK_HEIGHT - 10, 4);
        ctx.stroke();

        if (w > 30) {
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          ctx.font = "10px Plus Jakarta Sans, sans-serif";
          ctx.textAlign = "left";
          ctx.save();
          ctx.rect(x + 2, y + 5, w - 4, TRACK_HEIGHT - 10);
          ctx.clip();
          ctx.fillText(clip.label, x + 6, y + TRACK_HEIGHT / 2 + 4);
          ctx.restore();
        }
      }

      const phX = LABEL_WIDTH + (currentTime / totalDuration) * timelineW;
      ctx.strokeStyle = "#27C3C7";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(phX, 0);
      ctx.lineTo(phX, canvas.height);
      ctx.stroke();
      ctx.fillStyle = "#27C3C7";
      ctx.beginPath();
      ctx.moveTo(phX - 6, 0);
      ctx.lineTo(phX + 6, 0);
      ctx.lineTo(phX, 10);
      ctx.closePath();
      ctx.fill();

      if (isPlaying) {
        animRef.current = requestAnimationFrame(draw);
      }
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [currentTime, totalDuration, isPlaying]);

  const handleSeek = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left - LABEL_WIDTH;
    const timelineW = canvas.width - LABEL_WIDTH;
    if (x < 0) return;
    const t = (x / timelineW) * totalDuration;
    onSeek(Math.min(totalDuration, Math.max(0, t)));
  };

  return (
    <div
      className="flex flex-col h-full rounded-xl overflow-hidden border"
      style={{
        backgroundColor: "oklch(0.15 0.022 220)",
        borderColor: "oklch(1 0 0 / 6%)",
        boxShadow: "0 2px 12px 0 rgba(0,0,0,0.4)",
      }}
    >
      <div
        className="flex items-center justify-between px-4 h-11 border-b flex-shrink-0"
        style={{ borderColor: "oklch(1 0 0 / 6%)" }}
      >
        <span
          className="text-sm font-semibold"
          style={{ color: "oklch(0.92 0.01 215)" }}
        >
          Timeline Editor
        </span>
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-mono"
            style={{ color: "oklch(0.70 0.02 220)" }}
          >
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </span>
          <button type="button" style={{ color: "oklch(0.70 0.02 220)" }}>
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div
          ref={containerRef}
          className="flex-1 overflow-x-auto overflow-y-hidden relative"
        >
          <canvas
            ref={canvasRef}
            role="slider"
            aria-label="Timeline scrubber"
            aria-valuenow={currentTime}
            aria-valuemin={0}
            aria-valuemax={totalDuration}
            tabIndex={0}
            className="cursor-pointer"
            data-ocid="timeline.canvas_target"
            onClick={(e) => handleSeek(e.clientX)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight")
                onSeek(Math.min(totalDuration, currentTime + 5));
              if (e.key === "ArrowLeft") onSeek(Math.max(0, currentTime - 5));
            }}
          />
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
