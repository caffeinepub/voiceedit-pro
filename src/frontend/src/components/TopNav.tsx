import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, Upload, Waves } from "lucide-react";

interface TopNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onExport: () => void;
  isExporting: boolean;
  projectName?: string;
}

const NAV_LINKS = ["Dashboard", "My Projects", "Teams", "Help"];

export function TopNav({
  activeTab,
  onTabChange,
  onExport,
  isExporting,
}: TopNavProps) {
  return (
    <header
      className="flex items-center justify-between px-4 h-16 border-b"
      style={{
        backgroundColor: "oklch(0.18 0.025 220)",
        borderColor: "oklch(1 0 0 / 6%)",
      }}
    >
      <div className="flex items-center gap-2 min-w-[200px]">
        <div
          className="flex items-center justify-center w-8 h-8 rounded-md"
          style={{ backgroundColor: "oklch(0.74 0.12 195 / 15%)" }}
        >
          <Waves
            className="w-5 h-5"
            style={{ color: "oklch(0.74 0.12 195)" }}
          />
        </div>
        <span
          className="text-[17px] font-semibold tracking-tight"
          style={{ color: "oklch(0.92 0.01 215)" }}
        >
          VoiceEdit <span style={{ color: "oklch(0.74 0.12 195)" }}>Pro</span>
        </span>
      </div>

      <nav className="flex items-center gap-1">
        {NAV_LINKS.map((link) => (
          <button
            key={link}
            type="button"
            data-ocid={`nav.${link.toLowerCase().replace(" ", "_")}.link`}
            onClick={() => onTabChange(link)}
            className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
            style={{
              color:
                activeTab === link
                  ? "oklch(0.92 0.01 215)"
                  : "oklch(0.70 0.02 220)",
              backgroundColor:
                activeTab === link ? "oklch(1 0 0 / 6%)" : "transparent",
            }}
          >
            {link}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-3 min-w-[200px] justify-end">
        <div className="flex items-center gap-2">
          <Avatar className="w-7 h-7">
            <AvatarFallback
              className="text-xs font-bold"
              style={{
                backgroundColor: "oklch(0.74 0.12 195 / 20%)",
                color: "oklch(0.74 0.12 195)",
              }}
            >
              U
            </AvatarFallback>
          </Avatar>
          <div className="hidden lg:block">
            <div
              className="text-xs font-medium leading-tight"
              style={{ color: "oklch(0.92 0.01 215)" }}
            >
              User
            </div>
            <Badge
              variant="secondary"
              className="text-[10px] px-1 py-0 h-4"
              style={{
                backgroundColor: "oklch(0.74 0.12 195 / 15%)",
                color: "oklch(0.74 0.12 195)",
                border: "none",
              }}
            >
              Pro
            </Badge>
          </div>
          <ChevronDown
            className="w-3.5 h-3.5"
            style={{ color: "oklch(0.70 0.02 220)" }}
          />
        </div>

        <Button
          data-ocid="export.primary_button"
          onClick={onExport}
          disabled={isExporting}
          size="sm"
          className="gap-1.5 font-semibold text-sm"
          style={{
            backgroundColor: "oklch(0.72 0.12 75)",
            color: "oklch(0.15 0.01 75)",
            border: "1px solid oklch(0.60 0.12 75)",
          }}
        >
          <Upload className="w-3.5 h-3.5" />
          {isExporting ? "Exporting..." : "Export"}
        </Button>
      </div>
    </header>
  );
}
