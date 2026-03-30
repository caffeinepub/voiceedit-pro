import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, FolderOpen, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import type { VideoEditorProject } from "../backend.d";

interface ProjectSelectorProps {
  projects: VideoEditorProject[];
  selectedId: bigint | null;
  onSelect: (id: bigint) => void;
  onCreate: (name: string, description: string) => void;
  isCreating: boolean;
  isLoading: boolean;
}

export function ProjectSelector({
  projects,
  selectedId,
  onSelect,
  onCreate,
  isCreating,
  isLoading,
}: ProjectSelectorProps) {
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const selected = projects.find((p) => p.id === selectedId);

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate(name.trim(), description.trim());
    setName("");
    setDescription("");
    setDialogOpen(false);
  };

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            data-ocid="project.select"
            variant="ghost"
            size="sm"
            className="gap-1.5 text-sm max-w-[200px]"
            style={{ color: "oklch(0.70 0.02 220)" }}
          >
            <FolderOpen
              className="w-3.5 h-3.5"
              style={{ color: "oklch(0.74 0.12 195)" }}
            />
            <span className="truncate">
              {isLoading ? "Loading..." : (selected?.name ?? "Select Project")}
            </span>
            <ChevronDown className="w-3 h-3 ml-auto" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-56"
          style={{
            backgroundColor: "oklch(0.20 0.025 220)",
            borderColor: "oklch(1 0 0 / 10%)",
          }}
        >
          {projects.map((p) => (
            <DropdownMenuItem
              key={p.id.toString()}
              onClick={() => {
                onSelect(p.id);
                setOpen(false);
              }}
              style={{ color: "oklch(0.92 0.01 215)" }}
            >
              {p.name}
            </DropdownMenuItem>
          ))}
          {projects.length > 0 && <DropdownMenuSeparator />}
          <DropdownMenuItem
            data-ocid="project.open_modal_button"
            onClick={() => {
              setOpen(false);
              setDialogOpen(true);
            }}
            style={{ color: "oklch(0.74 0.12 195)" }}
          >
            <Plus className="w-3.5 h-3.5 mr-2" />
            New Project
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          style={{
            backgroundColor: "oklch(0.18 0.025 220)",
            borderColor: "oklch(1 0 0 / 10%)",
          }}
          data-ocid="project.dialog"
        >
          <DialogHeader>
            <DialogTitle style={{ color: "oklch(0.92 0.01 215)" }}>
              New Project
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label style={{ color: "oklch(0.70 0.02 220)" }}>
                Project Name
              </Label>
              <Input
                data-ocid="project.input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Audio Project"
                style={{
                  backgroundColor: "oklch(0.16 0.022 220)",
                  borderColor: "oklch(1 0 0 / 10%)",
                  color: "oklch(0.92 0.01 215)",
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label style={{ color: "oklch(0.70 0.02 220)" }}>
                Description
              </Label>
              <Input
                data-ocid="project.textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                style={{
                  backgroundColor: "oklch(0.16 0.022 220)",
                  borderColor: "oklch(1 0 0 / 10%)",
                  color: "oklch(0.92 0.01 215)",
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              data-ocid="project.cancel_button"
              onClick={() => setDialogOpen(false)}
              style={{ color: "oklch(0.70 0.02 220)" }}
            >
              Cancel
            </Button>
            <Button
              data-ocid="project.confirm_button"
              onClick={handleCreate}
              disabled={!name.trim() || isCreating}
              style={{
                backgroundColor: "oklch(0.74 0.12 195)",
                color: "oklch(0.13 0.02 220)",
              }}
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
