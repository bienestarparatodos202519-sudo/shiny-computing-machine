import type { GoogleSession, OfflineItem, WorkLogDraft } from "../types";

const SESSION_KEY = "rutas-saltillo-google-session";
const WORKER_KEY = "rutas-saltillo-worker-name";
const OFFLINE_QUEUE_KEY = "rutas-saltillo-offline-queue";
const ACTIVE_WORKLOG_KEY = "rutas-saltillo-active-worklog";

export function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadSession(): GoogleSession | null {
  const session = loadJson<GoogleSession | null>(SESSION_KEY, null);
  if (!session || Date.now() >= session.expiresAt) {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
  return session;
}

export function saveSession(session: GoogleSession): void {
  saveJson(SESSION_KEY, session);
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function loadWorkerName(): string {
  return localStorage.getItem(WORKER_KEY) ?? "";
}

export function saveWorkerName(workerName: string): void {
  localStorage.setItem(WORKER_KEY, workerName);
}

export function loadOfflineQueue(): OfflineItem[] {
  return loadJson<OfflineItem[]>(OFFLINE_QUEUE_KEY, []);
}

export function saveOfflineQueue(queue: OfflineItem[]): void {
  saveJson(OFFLINE_QUEUE_KEY, queue);
}

export function enqueueOfflineItem(item: OfflineItem): OfflineItem[] {
  const queue = [...loadOfflineQueue(), item];
  saveOfflineQueue(queue);
  return queue;
}

export function loadActiveWorkLog(): WorkLogDraft | null {
  return loadJson<WorkLogDraft | null>(ACTIVE_WORKLOG_KEY, null);
}

export function saveActiveWorkLog(workLog: WorkLogDraft): void {
  saveJson(ACTIVE_WORKLOG_KEY, workLog);
}

export function clearActiveWorkLog(): void {
  localStorage.removeItem(ACTIVE_WORKLOG_KEY);
}
