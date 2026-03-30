import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AudioEnhancementSettings,
  VideoEditorProject,
} from "../backend.d";
import { useActor } from "./useActor";

export function useGetAllProjects() {
  const { actor, isFetching } = useActor();
  return useQuery<VideoEditorProject[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllProjects();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetProject(projectId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<VideoEditorProject | null>({
    queryKey: ["project", projectId?.toString()],
    queryFn: async () => {
      if (!actor || projectId === null) return null;
      return actor.getProject(projectId);
    },
    enabled: !!actor && !isFetching && projectId !== null,
  });
}

export function useGetAudioSettings(projectId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<AudioEnhancementSettings | null>({
    queryKey: ["audioSettings", projectId?.toString()],
    queryFn: async () => {
      if (!actor || projectId === null) return null;
      return actor.getAudioSettings(projectId);
    },
    enabled: !!actor && !isFetching && projectId !== null,
  });
}

export function useCreateProject() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      description,
    }: { name: string; description: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createProject(name, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateAudioSettings() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      settings,
    }: {
      projectId: bigint;
      settings: AudioEnhancementSettings;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateAudioSettings(projectId, settings);
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({
        queryKey: ["audioSettings", projectId.toString()],
      });
    },
  });
}

export function useCreateExportJob() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (projectId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.createExportJob(projectId);
    },
  });
}
