import api from "../api/api";

/** Student creates a new project. Backend calculates hash internally. */
export const createProject = async (data) => {
  const response = await api.post("/student/projects", data);
  return response.data;
};

/** Student: get all my projects (or filter by studentId for org view). */
export const getStudentProjects = async (studentId) => {
  const url = studentId ? `/student/projects?studentId=${studentId}` : "/student/projects";
  const response = await api.get(url);
  return response.data.projects || response.data || [];
};

export const getMyProjects = () => getStudentProjects();

/** Organisation: get projects pending their verification. */
export const getPendingProjects = async () => {
  const response = await api.get("/student/projects/pending");
  return response.data.projects || [];
};

/** Organisation: get a specific candidate's projects. */
export const getCandidateProjects = async (studentId) => {
  const response = await api.get(`/student/candidates/${studentId}/projects`);
  return response.data.projects || [];
};

/**
 * Update project status (approve / reject / update).
 * Backend handles blockchain write.
 */
export const updateProjectStatus = async (id, status, txHash, rejectionReason, extraData = {}) => {
  const response = await api.put("/student/projects/status", {
    id,
    status,
    txHash,
    rejectionReason,
    ...extraData,
  });
  return response.data;
};

// ─── GitHub OAuth Services ───────────────────────────────────────────────────

/**
 * Initiates GitHub OAuth.
 * Returns { authUrl, state } to redirect user to official GitHub authorization.
 */
export const getGitHubConnectUrl = async (returnUrl = "/student/project/add") => {
  const response = await api.get(`/student/github/connect?returnUrl=${encodeURIComponent(returnUrl)}`);
  return response.data; // { success: true, authUrl, state }
};

/**
 * Retrieves the current student's GitHub OAuth connection status.
 */
export const getGitHubStatus = async () => {
  const response = await api.get("/student/github/status");
  return response.data; // { success: true, connected, username, avatarUrl, githubUrl, connectedAt }
};

/**
 * Fetches repositories for the authenticated GitHub account.
 * Repositories are fetched by the backend using the securely stored OAuth token.
 */
export const fetchAuthenticatedGitHubRepos = async () => {
  const response = await api.get("/student/github/repos");
  return response.data.repos || [];
};

/**
 * Disconnects the student's connected GitHub account.
 */
export const disconnectGitHub = async () => {
  const response = await api.post("/student/github/disconnect");
  return response.data;
};

/**
 * Alias for fetching repos (maintains compatibility).
 */
export const fetchGitHubRepositories = async () => {
  return fetchAuthenticatedGitHubRepos();
};