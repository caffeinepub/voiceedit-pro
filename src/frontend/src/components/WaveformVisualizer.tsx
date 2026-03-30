import {
  AudioWaveform,
  Maximize2,
  MoreHorizontal,
  Volume2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface WaveformVisualizerProps {
  audioBuffer: AudioBuffer | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  trackLabel?: string;
}

export function WaveformVisualizer({
  audioBuffer,
  currentTime,
  duration,
  isPlaying,
  trackLabel = "Dialogue Track 1 — Scene 3",
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const phaseRef = useRef(0);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setCanvasSize({ w: Math.round(width), h: Math.round(height) });
      }
    });
    ro.observe(canvas.parentElement!);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvasSize.w === 0) return;

    canvas.width = canvasSize.w;
    canvas.height = canvasSize.h;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const W = canvas.width;
      const H = canvas.height;
      const midY = H / 2;

      ctx.fillStyle = "#0B1118";
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        const y = (H / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      for (let i = 1; i < 8; i++) {
        const x = (W / 8) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }

      if (audioBuffer) {
        const data = audioBuffer.getChannelData(0);
        const step = Math.ceil(data.length / W);
        const amp = H / 2;
        ctx.beginPath();
        ctx.strokeStyle = "#27C3C7";
        ctx.lineWidth = 1.5;
        for (let i = 0; i < W; i++) {
          let min = 1.0;
          let max = -1.0;
          for (let j = 0; j < step; j++) {
            const d = data[i * step + j] ?? 0;
            if (d < min) min = d;
            if (d > max) max = d;
          }
          ctx.moveTo(i, midY + max * amp * 0.85);
          ctx.lineTo(i, midY + min * amp * 0.85);
        }
        ctx.stroke();
      } else {
        phaseRef.current += isPlaying ? 0.04 : 0.005;
        const phase = phaseRef.current;
        const barW = 2;
        const gap = 1;
        const totalBars = Math.floor(W / (barW + gap));
        for (let i = 0; i < totalBars; i++) {
          const x = i * (barW + gap);
          const t = i / totalBars;
          const amplitude =
            0.3 +
            0.25 * Math.sin(t * 12 + phase) +
            0.2 * Math.sin(t * 7 - phase * 0.7) +
            0.15 * Math.sin(t * 20 + phase * 1.3) +
            0.1 * Math.abs(Math.sin(t * 3 + phase * 0.4));
          const barH = Math.max(2, amplitude * H * 0.7);
          const alpha = 0.7 + 0.3 * Math.sin(t * 8 + phase);
          ctx.fillStyle = `rgba(39, 195, 199, ${alpha})`;
          ctx.fillRect(x, midY - barH / 2, barW, barH);
        }
      }

      if (duration > 0) {
        const px = (currentTime / duration) * W;
        ctx.strokeStyle = "#CFEFF2";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, H);
        ctx.stroke();
        ctx.fillStyle = "#CFEFF2";
        ctx.beginPath();
        ctx.moveTo(px - 5, 0);
        ctx.lineTo(px + 5, 0);
        ctx.lineTo(px, 8);
        ctx.closePath();
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [audioBuffer, currentTime, duration, isPlaying, canvasSize]);

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
          <AudioWaveform
            className="w-4 h-4"
            style={{ color: "oklch(0.74 0.12 195)" }}
          />
          <span
            className="text-sm font-semibold"
            style={{ color: "oklch(0.92 0.01 215)" }}
          >
            Waveform
          </span>
        </div>
        <button type="button" style={{ color: "oklch(0.70 0.02 220)" }}>
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      <div
        className="flex items-center justify-between px-3 py-2 border-t flex-shrink-0"
        style={{ borderColor: "oklch(1 0 0 / 6%)" }}
      >
        <div className="flex items-center gap-2">
          <Volume2
            className="w-3 h-3"
            style={{ color: "oklch(0.74 0.12 195)" }}
          />
          <span className="text-xs" style={{ color: "oklch(0.70 0.02 220)" }}>
            {trackLabel}
          </span>
        </div>
        <button type="button" style={{ color: "oklch(0.70 0.02 220)" }}>
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
