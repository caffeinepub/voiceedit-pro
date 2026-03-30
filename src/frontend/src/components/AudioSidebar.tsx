import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  ChevronDown,
  ChevronRight,
  Mic,
  Music2,
  SlidersHorizontal,
  Zap,
} from "lucide-react";
import { useState } from "react";

export interface AudioSettings {
  noiseReduction: number;
  eqBass: number;
  eqMid: number;
  eqTreble: number;
  pitchShift: number;
  voiceClarity: number;
  deEsser: number;
  reverbRemoval: number;
}

interface AudioSidebarProps {
  settings: AudioSettings;
  onChange: (settings: AudioSettings) => void;
  onApply: () => void;
  isApplying: boolean;
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({ title, icon, children, defaultOpen = true }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        className="flex items-center justify-between w-full px-3 py-2.5 text-left transition-colors hover:bg-white/5 rounded-md"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          <span style={{ color: "oklch(0.74 0.12 195)" }}>{icon}</span>
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "oklch(0.70 0.02 220)" }}
          >
            {title}
          </span>
        </div>
        {open ? (
          <ChevronDown
            className="w-3.5 h-3.5"
            style={{ color: "oklch(0.70 0.02 220)" }}
          />
        ) : (
          <ChevronRight
            className="w-3.5 h-3.5"
            style={{ color: "oklch(0.70 0.02 220)" }}
          />
        )}
      </button>
      {open && <div className="px-3 pb-3 space-y-4">{children}</div>}
    </div>
  );
}

function SliderControl({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  unit = "%",
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
  unit?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span
          className="text-xs font-medium"
          style={{ color: "oklch(0.70 0.02 220)" }}
        >
          {label}
        </span>
        <span
          className="text-xs font-mono"
          style={{ color: "oklch(0.74 0.12 195)" }}
        >
          {value}
          {unit}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
        className="slider-teal"
        style={{ "--teal": "oklch(0.74 0.12 195)" } as React.CSSProperties}
      />
    </div>
  );
}

function PitchControl({
  value,
  onChange,
}: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span
          className="text-xs font-medium"
          style={{ color: "oklch(0.70 0.02 220)" }}
        >
          Pitch Shift
        </span>
        <span
          className="text-xs font-mono"
          style={{ color: "oklch(0.74 0.12 195)" }}
        >
          {value > 0 ? "+" : ""}
          {value} st
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="w-7 h-7 rounded flex items-center justify-center text-sm font-bold transition-colors"
          style={{
            backgroundColor: "oklch(0.22 0.02 220)",
            color: "oklch(0.70 0.02 220)",
          }}
          onClick={() => onChange(Math.max(-12, value - 1))}
        >
          −
        </button>
        <div className="flex-1">
          <Slider
            value={[value]}
            min={-12}
            max={12}
            step={1}
            onValueChange={([v]) => onChange(v)}
            className="slider-teal"
          />
        </div>
        <button
          type="button"
          className="w-7 h-7 rounded flex items-center justify-center text-sm font-bold transition-colors"
          style={{
            backgroundColor: "oklch(0.22 0.02 220)",
            color: "oklch(0.70 0.02 220)",
          }}
          onClick={() => onChange(Math.min(12, value + 1))}
        >
          +
        </button>
      </div>
    </div>
  );
}

export function AudioSidebar({
  settings,
  onChange,
  onApply,
  isApplying,
}: AudioSidebarProps) {
  const set = (key: keyof AudioSettings) => (v: number) =>
    onChange({ ...settings, [key]: v });

  return (
    <aside
      className="flex flex-col h-full overflow-hidden"
      style={{ backgroundColor: "oklch(0.16 0.022 220)" }}
    >
      <div
        className="flex items-center gap-2 px-4 py-3 border-b"
        style={{ borderColor: "oklch(1 0 0 / 6%)" }}
      >
        <SlidersHorizontal
          className="w-4 h-4"
          style={{ color: "oklch(0.74 0.12 195)" }}
        />
        <span
          className="text-sm font-semibold"
          style={{ color: "oklch(0.92 0.01 215)" }}
        >
          Audio Enhancement
        </span>
      </div>

      <div className="flex-1 overflow-y-auto py-2 space-y-1">
        <Section title="Noise & Clarity" icon={<Mic className="w-3.5 h-3.5" />}>
          <SliderControl
            label="Noise Reduction"
            value={settings.noiseReduction}
            onChange={set("noiseReduction")}
          />
          <SliderControl
            label="Voice Clarity"
            value={settings.voiceClarity}
            onChange={set("voiceClarity")}
          />
          <SliderControl
            label="De-Esser"
            value={settings.deEsser}
            onChange={set("deEsser")}
          />
          <SliderControl
            label="Reverb Removal"
            value={settings.reverbRemoval}
            onChange={set("reverbRemoval")}
          />
        </Section>

        <Separator style={{ backgroundColor: "oklch(1 0 0 / 6%)" }} />

        <Section
          title="Equalizer"
          icon={<Music2 className="w-3.5 h-3.5" />}
          defaultOpen
        >
          <SliderControl
            label="Bass"
            value={settings.eqBass}
            min={-12}
            max={12}
            onChange={set("eqBass")}
            unit=" dB"
          />
          <SliderControl
            label="Mid"
            value={settings.eqMid}
            min={-12}
            max={12}
            onChange={set("eqMid")}
            unit=" dB"
          />
          <SliderControl
            label="Treble"
            value={settings.eqTreble}
            min={-12}
            max={12}
            onChange={set("eqTreble")}
            unit=" dB"
          />
        </Section>

        <Separator style={{ backgroundColor: "oklch(1 0 0 / 6%)" }} />

        <Section title="Pitch" icon={<Zap className="w-3.5 h-3.5" />}>
          <PitchControl
            value={settings.pitchShift}
            onChange={set("pitchShift")}
          />
        </Section>
      </div>

      <div
        className="p-3 border-t"
        style={{ borderColor: "oklch(1 0 0 / 6%)" }}
      >
        <Button
          data-ocid="audio.save_button"
          className="w-full font-semibold text-sm"
          onClick={onApply}
          disabled={isApplying}
          style={{
            backgroundColor: "oklch(0.74 0.12 195)",
            color: "oklch(0.13 0.02 220)",
          }}
        >
          {isApplying ? "Applying..." : "Apply Enhancement"}
        </Button>
      </div>
    </aside>
  );
}
