import Time "mo:core/Time";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  // COMPONENTS
  // ==========
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  // TYPES
  // =====
  type ProjectId = Nat;
  type Timestamp = Int;

  public type UserProfile = {
    name : Text;
  };

  type AudioEnhancementSettings = {
    noiseReductionLevel : Nat; // 0-100
    eqBands : (Nat, Nat, Nat); // bass, mid, treble (0-100)
    pitchShiftSemitones : Int; // -12 to +12
    voiceClarityLevel : Nat; // 0-100
    deEsserLevel : Nat; // 0-100
    reverbRemovalLevel : Nat; // 0-100
  };

  type VideoEditorProject = {
    id : ProjectId;
    owner : Principal;
    name : Text;
    description : Text;
    createdAt : Timestamp;
    audioSettings : AudioEnhancementSettings;
  };

  type TrackType = {
    #video;
    #dialogue;
    #music;
    #sfx;
  };

  type TrackClip = {
    trackType : TrackType;
    startTime : Nat; // milliseconds
    duration : Nat; // milliseconds
    clipLabel : Text;
  };

  type ExportStatus = {
    #pending;
    #processing;
    #done;
  };

  type ExportJob = {
    id : Nat;
    projectId : Nat;
    owner : Principal;
    status : ExportStatus;
    outputFile : ?Storage.ExternalBlob;
  };

  // MODULES
  // =======
  module VideoEditorProject {
    public func compareByTimestamp(a : VideoEditorProject, b : VideoEditorProject) : Order.Order {
      Nat.compare(a.id, b.id);
    };

    public func compareByName(a : VideoEditorProject, b : VideoEditorProject) : Order.Order {
      switch (Text.compare(a.name, b.name)) {
        case (#equal) { Nat.compare(a.id, b.id) };
        case (order) { order };
      };
    };
  };

  // STATE
  // =====
  let userProfiles = Map.empty<Principal, UserProfile>();
  let projects = Map.empty<ProjectId, VideoEditorProject>();
  var nextProjectId = 1;

  let trackClips = Map.empty<ProjectId, [TrackClip]>();
  let exportJobs = Map.empty<ProjectId, ExportJob>();

  // USER PROFILE MANAGEMENT
  // =======================
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // PROJECT MANAGEMENT
  // ==================
  public shared ({ caller }) func createProject(name : Text, description : Text) : async ProjectId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create projects");
    };

    let projectId = nextProjectId;
    nextProjectId += 1;

    let project : VideoEditorProject = {
      id = projectId;
      owner = caller;
      name;
      description;
      createdAt = Time.now();
      audioSettings = {
        noiseReductionLevel = 50;
        eqBands = (50, 50, 50);
        pitchShiftSemitones = 0;
        voiceClarityLevel = 50;
        deEsserLevel = 50;
        reverbRemovalLevel = 50;
      };
    };

    projects.add(projectId, project);
    projectId;
  };

  public query ({ caller }) func getProject(id : ProjectId) : async ?VideoEditorProject {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view projects");
    };

    let project = switch (projects.get(id)) {
      case (null) { return null };
      case (?p) { p };
    };

    // Users can only view their own projects, admins can view all
    if (project.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own projects");
    };

    ?project;
  };

  public query ({ caller }) func getAllProjects() : async [VideoEditorProject] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view projects");
    };

    // Admins can see all projects, regular users only see their own
    let filteredProjects = if (AccessControl.isAdmin(accessControlState, caller)) {
      projects.values().toArray();
    } else {
      projects.values().filter(func(p : VideoEditorProject) : Bool {
        p.owner == caller
      }).toArray();
    };

    filteredProjects.sort(VideoEditorProject.compareByTimestamp);
  };

  public query ({ caller }) func getProjectsOrderedByName() : async [VideoEditorProject] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view projects");
    };

    // Admins can see all projects, regular users only see their own
    let filteredProjects = if (AccessControl.isAdmin(accessControlState, caller)) {
      projects.values().toArray();
    } else {
      projects.values().filter(func(p : VideoEditorProject) : Bool {
        p.owner == caller
      }).toArray();
    };

    filteredProjects.sort(VideoEditorProject.compareByName);
  };

  public shared ({ caller }) func updateProject(id : ProjectId, project : VideoEditorProject) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update projects");
    };

    let existingProject = switch (projects.get(id)) {
      case (null) { Runtime.trap("Project does not exist") };
      case (?p) { p };
    };

    // Users can only update their own projects, admins can update all
    if (existingProject.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only update your own projects");
    };

    // Preserve the original owner
    let updatedProject = {
      project with owner = existingProject.owner
    };

    projects.add(id, updatedProject);
  };

  public shared ({ caller }) func deleteProject(id : ProjectId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete projects");
    };

    let project = switch (projects.get(id)) {
      case (null) { Runtime.trap("Project does not exist") };
      case (?p) { p };
    };

    // Users can only delete their own projects, admins can delete all
    if (project.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only delete your own projects");
    };

    projects.remove(id);
    trackClips.remove(id);
    exportJobs.remove(id);
  };

  // AUDIO ENHANCEMENT SETTINGS
  // =========================
  public shared ({ caller }) func updateAudioSettings(projectId : ProjectId, settings : AudioEnhancementSettings) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update audio settings");
    };

    let project = switch (projects.get(projectId)) {
      case (null) { Runtime.trap("Project does not exist") };
      case (?p) { p };
    };

    // Users can only update settings for their own projects, admins can update all
    if (project.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only update settings for your own projects");
    };

    let updatedProject : VideoEditorProject = {
      project with audioSettings = settings
    };

    projects.add(projectId, updatedProject);
  };

  public query ({ caller }) func getAudioSettings(projectId : ProjectId) : async ?AudioEnhancementSettings {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view audio settings");
    };

    let project = switch (projects.get(projectId)) {
      case (null) { return null };
      case (?p) { p };
    };

    // Users can only view settings for their own projects, admins can view all
    if (project.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view settings for your own projects");
    };

    ?project.audioSettings;
  };

  // TRACKS
  // ======
  public shared ({ caller }) func addTrackClip(projectId : ProjectId, clip : TrackClip) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add track clips");
    };

    let project = switch (projects.get(projectId)) {
      case (null) { Runtime.trap("Project does not exist") };
      case (?p) { p };
    };

    // Users can only add clips to their own projects, admins can add to all
    if (project.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only add clips to your own projects");
    };

    let currentClips = switch (trackClips.get(projectId)) {
      case (null) { [] };
      case (?clips) { clips };
    };

    trackClips.add(projectId, currentClips.concat([clip]));
  };

  public shared ({ caller }) func removeTrackClip(projectId : ProjectId, index : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove track clips");
    };

    let project = switch (projects.get(projectId)) {
      case (null) { Runtime.trap("Project does not exist") };
      case (?p) { p };
    };

    // Users can only remove clips from their own projects, admins can remove from all
    if (project.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only remove clips from your own projects");
    };

    let currentClips = switch (trackClips.get(projectId)) {
      case (null) { Runtime.trap("No clips found for this project") };
      case (?clips) { clips };
    };

    if (index >= currentClips.size()) {
      Runtime.trap("Invalid clip index");
    };

    let filteredClips = currentClips.enumerate().filter(
      func((i, _)) { i != index }
    ).map(
      func((_, clip)) { clip }
    ).toArray();

    trackClips.add(projectId, filteredClips);
  };

  public query ({ caller }) func getTrackClips(projectId : ProjectId) : async [TrackClip] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view track clips");
    };

    let project = switch (projects.get(projectId)) {
      case (null) { Runtime.trap("Project does not exist") };
      case (?p) { p };
    };

    // Users can only view clips from their own projects, admins can view all
    if (project.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view clips from your own projects");
    };

    switch (trackClips.get(projectId)) {
      case (null) { [] };
      case (?clips) { clips };
    };
  };

  // EXPORT JOBS
  // ===========
  public shared ({ caller }) func createExportJob(projectId : ProjectId) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create export jobs");
    };

    let project = switch (projects.get(projectId)) {
      case (null) { Runtime.trap("Project does not exist") };
      case (?p) { p };
    };

    // Users can only create export jobs for their own projects, admins can create for all
    if (project.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only create export jobs for your own projects");
    };

    let exportJob : ExportJob = {
      id = projectId;
      projectId;
      owner = caller;
      status = #pending;
      outputFile = null;
    };

    exportJobs.add(projectId, exportJob);
    projectId;
  };

  public shared ({ caller }) func updateExportJobStatus(jobId : Nat, status : ExportStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update export jobs");
    };

    let exportJob = switch (exportJobs.get(jobId)) {
      case (null) { Runtime.trap("Export job does not exist") };
      case (?job) { job };
    };

    // Users can only update their own export jobs, admins can update all
    if (exportJob.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only update your own export jobs");
    };

    let updatedExportJob : ExportJob = {
      exportJob with status
    };

    exportJobs.add(jobId, updatedExportJob);
  };

  public shared ({ caller }) func setExportJobOutputFile(jobId : Nat, file : Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update export jobs");
    };

    let exportJob = switch (exportJobs.get(jobId)) {
      case (null) { Runtime.trap("Export job does not exist") };
      case (?job) { job };
    };

    // Users can only update their own export jobs, admins can update all
    if (exportJob.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only update your own export jobs");
    };

    let updatedExportJob : ExportJob = {
      exportJob with
      status = #done;
      outputFile = ?file;
    };

    exportJobs.add(jobId, updatedExportJob);
  };

  public query ({ caller }) func getExportJob(jobId : Nat) : async ?ExportJob {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view export jobs");
    };

    let exportJob = switch (exportJobs.get(jobId)) {
      case (null) { return null };
      case (?job) { job };
    };

    // Users can only view their own export jobs, admins can view all
    if (exportJob.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own export jobs");
    };

    ?exportJob;
  };
};
