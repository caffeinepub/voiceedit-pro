import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export type Timestamp = bigint;
export interface VideoEditorProject {
    id: ProjectId;
    owner: Principal;
    name: string;
    createdAt: Timestamp;
    description: string;
    audioSettings: AudioEnhancementSettings;
}
export interface ExportJob {
    id: bigint;
    status: ExportStatus;
    owner: Principal;
    projectId: bigint;
    outputFile?: ExternalBlob;
}
export interface AudioEnhancementSettings {
    noiseReductionLevel: bigint;
    pitchShiftSemitones: bigint;
    reverbRemovalLevel: bigint;
    voiceClarityLevel: bigint;
    deEsserLevel: bigint;
    eqBands: [bigint, bigint, bigint];
}
export type ProjectId = bigint;
export interface TrackClip {
    startTime: bigint;
    duration: bigint;
    trackType: TrackType;
    clipLabel: string;
}
export interface UserProfile {
    name: string;
}
export enum ExportStatus {
    pending = "pending",
    done = "done",
    processing = "processing"
}
export enum TrackType {
    sfx = "sfx",
    music = "music",
    video = "video",
    dialogue = "dialogue"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addTrackClip(projectId: ProjectId, clip: TrackClip): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createExportJob(projectId: ProjectId): Promise<bigint>;
    createProject(name: string, description: string): Promise<ProjectId>;
    deleteProject(id: ProjectId): Promise<void>;
    getAllProjects(): Promise<Array<VideoEditorProject>>;
    getAudioSettings(projectId: ProjectId): Promise<AudioEnhancementSettings | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getExportJob(jobId: bigint): Promise<ExportJob | null>;
    getProject(id: ProjectId): Promise<VideoEditorProject | null>;
    getProjectsOrderedByName(): Promise<Array<VideoEditorProject>>;
    getTrackClips(projectId: ProjectId): Promise<Array<TrackClip>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    removeTrackClip(projectId: ProjectId, index: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setExportJobOutputFile(jobId: bigint, file: ExternalBlob): Promise<void>;
    updateAudioSettings(projectId: ProjectId, settings: AudioEnhancementSettings): Promise<void>;
    updateExportJobStatus(jobId: bigint, status: ExportStatus): Promise<void>;
    updateProject(id: ProjectId, project: VideoEditorProject): Promise<void>;
}
