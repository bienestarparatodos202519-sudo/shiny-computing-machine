import type {
  EvidenceDraft,
  GoogleSession,
  OfflineItem,
  SyncResult,
  WorkLogDraft,
} from "../types";
import {
  loadOfflineQueue,
  loadSession,
  saveOfflineQueue,
  saveSession,
} from "./storage";

export const ADMIN_EMAIL = "bienestarparatodos202519@gmail.com";

const GOOGLE_TOKEN_TTL_MS = 50 * 60 * 1000;
const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
].join(" ");

const EVIDENCE_SHEET = "Evidencias de Rutas";
const WORKLOG_SHEET = "Bitacoras de Trabajo";

type TokenResponse = {
  access_token?: string;
  expires_in?: number;
  error?: string;
};

type TokenClient = {
  requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: TokenResponse) => void;
          }) => TokenClient;
        };
      };
    };
  }
}

export function getStoredValidSession(): GoogleSession | null {
  return loadSession();
}

export async function signInWithGoogle(): Promise<GoogleSession> {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("Configura VITE_GOOGLE_CLIENT_ID para iniciar sesion con Google.");
  }

  await loadGoogleIdentityScript();

  const accessToken = await new Promise<string>((resolve, reject) => {
    const client = window.google?.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: GOOGLE_SCOPES,
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error ?? "Google no devolvio un token de acceso."));
          return;
        }
        resolve(response.access_token);
      },
    });

    client?.requestAccessToken({ prompt: "consent" });
  });

  const profile = await getGoogleProfile(accessToken);
  const session: GoogleSession = {
    accessToken,
    expiresAt: Date.now() + GOOGLE_TOKEN_TTL_MS,
    email: profile.email,
    name: profile.name,
  };

  saveSession(session);
  return session;
}

export async function submitEvidence(draft: EvidenceDraft): Promise<string> {
  const session = requireSession();
  const spreadsheetId = await getMasterSpreadsheetId(session);
  await ensureSpreadsheetStructure(session, spreadsheetId);
  const photoUrl = await uploadPhotoToDrive(session, draft);

  await appendValues(session, spreadsheetId, EVIDENCE_SHEET, [
    formatMexicoDateTime(draft.createdAt),
    draft.workerName,
    draft.startAddress,
    draft.routeSequence.join(" > "),
    draft.accumulatedDistanceKm.toFixed(2),
    draft.notes,
    photoUrl,
    draft.coordinates ? `${draft.coordinates.lat}, ${draft.coordinates.lng}` : "",
  ]);

  return photoUrl;
}

export async function submitWorkLog(draft: WorkLogDraft): Promise<void> {
  const session = requireSession();
  const spreadsheetId = await getMasterSpreadsheetId(session);
  await ensureSpreadsheetStructure(session, spreadsheetId);

  await appendValues(session, spreadsheetId, WORKLOG_SHEET, [
    formatMexicoDateTime(draft.createdAt),
    draft.workerName,
    formatMexicoTime(draft.startTime),
    formatMexicoTime(draft.endTime),
    formatDuration(draft.durationMs),
    draft.visitedStops.join(", "),
    draft.distanceKm.toFixed(2),
    draft.comments,
  ]);
}

export async function syncOfflineQueue(): Promise<SyncResult> {
  const queue = loadOfflineQueue();
  const remaining: OfflineItem[] = [];
  const errors: string[] = [];
  let synced = 0;

  for (const item of queue) {
    try {
      if (item.type === "evidence") {
        await submitEvidence(item.payload);
      } else {
        await submitWorkLog(item.payload);
      }
      synced += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      remaining.push({ ...item, lastError: message });
      errors.push(`${item.type}: ${message}`);
    }
  }

  saveOfflineQueue(remaining);
  return { synced, failed: remaining.length, errors };
}

async function getMasterSpreadsheetId(session: GoogleSession): Promise<string> {
  const existing = await fetchMasterSpreadsheetId();
  if (existing) return existing;

  if (session.email?.toLowerCase() !== ADMIN_EMAIL) {
    throw new Error(
      "No se encontro hoja maestra. Inicia sesion como administrador una vez o configura el backend /api/master-spreadsheet.",
    );
  }

  const spreadsheetId = await createMasterSpreadsheet(session);
  await registerMasterSpreadsheetId(spreadsheetId);
  return spreadsheetId;
}

async function fetchMasterSpreadsheetId(): Promise<string | null> {
  try {
    const response = await apiFetch("/api/master-spreadsheet", { method: "GET" });
    if (!response.ok) return null;
    const payload = (await response.json()) as { spreadsheetId?: string };
    return payload.spreadsheetId ?? null;
  } catch {
    return null;
  }
}

async function registerMasterSpreadsheetId(spreadsheetId: string): Promise<void> {
  try {
    await apiFetch("/api/master-spreadsheet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spreadsheetId }),
    });
  } catch {
    localStorage.setItem("rutas-saltillo-master-spreadsheet-id", spreadsheetId);
  }
}

async function createMasterSpreadsheet(session: GoogleSession): Promise<string> {
  const response = await googleFetch(session, "https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    body: JSON.stringify({
      properties: { title: "Rutas Saltillo - Bitacora Maestra" },
      sheets: [
        { properties: { title: EVIDENCE_SHEET } },
        { properties: { title: WORKLOG_SHEET } },
      ],
    }),
  });

  const payload = (await response.json()) as { spreadsheetId?: string };
  if (!payload.spreadsheetId) {
    throw new Error("Google Sheets no devolvio el ID de la hoja maestra.");
  }

  return payload.spreadsheetId;
}

async function ensureSpreadsheetStructure(
  session: GoogleSession,
  spreadsheetId: string,
): Promise<void> {
  const response = await googleFetch(
    session,
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
  );
  const spreadsheet = (await response.json()) as {
    sheets?: Array<{ properties?: { title?: string } }>;
  };
  const titles = new Set(spreadsheet.sheets?.map((sheet) => sheet.properties?.title));
  const requests = [EVIDENCE_SHEET, WORKLOG_SHEET]
    .filter((title) => !titles.has(title))
    .map((title) => ({ addSheet: { properties: { title } } }));

  if (requests.length > 0) {
    await googleFetch(
      session,
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: "POST",
        body: JSON.stringify({ requests }),
      },
    );
  }

  await writeHeaders(session, spreadsheetId, EVIDENCE_SHEET, [
    "Marca temporal",
    "Nombre del Trabajador",
    "Origen de Salida",
    "Secuencia de Ruta",
    "Distancia Acumulada",
    "Observaciones",
    "URL de Fotografia",
    "Geolocalizacion",
  ]);
  await writeHeaders(session, spreadsheetId, WORKLOG_SHEET, [
    "Fecha de Registro",
    "Nombre del Trabajador",
    "Hora de Inicio",
    "Hora de Termino",
    "Duracion Total",
    "Avance de Paradas",
    "Distancia de Avance (km)",
    "Comentarios",
  ]);
}

async function writeHeaders(
  session: GoogleSession,
  spreadsheetId: string,
  sheetName: string,
  headers: string[],
): Promise<void> {
  const range = encodeURIComponent(`'${sheetName}'!A1:H1`);
  await googleFetch(
    session,
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW`,
    {
      method: "PUT",
      body: JSON.stringify({ values: [headers] }),
    },
  );
}

async function appendValues(
  session: GoogleSession,
  spreadsheetId: string,
  sheetName: string,
  values: string[],
): Promise<void> {
  const range = encodeURIComponent(`'${sheetName}'!A:H`);
  await googleFetch(
    session,
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      body: JSON.stringify({ values: [values] }),
    },
  );
}

async function uploadPhotoToDrive(session: GoogleSession, draft: EvidenceDraft): Promise<string> {
  const boundary = `rutas_saltillo_${crypto.randomUUID()}`;
  const metadata = {
    name: `${draft.createdAt.slice(0, 10)}-${draft.workerName}-${draft.photoName}`,
    mimeType: draft.photoType,
  };
  const body = new Blob(
    [
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(
        metadata,
      )}\r\n`,
      `--${boundary}\r\nContent-Type: ${draft.photoType}\r\n\r\n`,
      dataUrlToBlob(draft.photoDataUrl),
      `\r\n--${boundary}--`,
    ],
    { type: `multipart/related; boundary=${boundary}` },
  );

  const uploadResponse = await googleFetch(
    session,
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink",
    {
      method: "POST",
      headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
      body,
    },
  );
  const file = (await uploadResponse.json()) as { id?: string; webViewLink?: string };
  if (!file.id) throw new Error("Google Drive no devolvio ID de archivo.");

  await googleFetch(session, `https://www.googleapis.com/drive/v3/files/${file.id}/permissions`, {
    method: "POST",
    body: JSON.stringify({ role: "reader", type: "anyone" }),
  });

  return file.webViewLink ?? `https://drive.google.com/file/d/${file.id}/view`;
}

async function getGoogleProfile(accessToken: string): Promise<{ email?: string; name?: string }> {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) return {};
  return (await response.json()) as { email?: string; name?: string };
}

async function googleFetch(
  session: GoogleSession,
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessToken}`,
      ...init.headers,
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Google API ${response.status}: ${detail || response.statusText}`);
  }

  return response;
}

async function apiFetch(path: string, init: RequestInit): Promise<Response> {
  const apiBase = getApiBaseUrl();
  if (apiBase === null) {
    throw new Error("No hay servidor API configurado para el paquete nativo.");
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8_000);
  try {
    const url = apiBase ? `${apiBase}${path}` : path;
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
}

function getApiBaseUrl(): string | null {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  if (window.location.protocol === "http:" || window.location.protocol === "https:") return "";
  return localStorage.getItem("rutas-saltillo-api-base-url");
}

function loadGoogleIdentityScript(): Promise<void> {
  if (window.google?.accounts.oauth2) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("No cargo Google Identity.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No cargo Google Identity."));
    document.head.appendChild(script);
  });
}

function requireSession(): GoogleSession {
  const session = loadSession();
  if (!session) {
    throw new Error("Inicia sesion con Google antes de sincronizar.");
  }
  return session;
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [metadata, base64] = dataUrl.split(",");
  const mime = metadata.match(/data:(.*);base64/)?.[1] ?? "application/octet-stream";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: mime });
}

function formatMexicoDateTime(value: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "America/Mexico_City",
  }).format(new Date(value));
}

function formatMexicoTime(value: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    timeStyle: "medium",
    timeZone: "America/Mexico_City",
  }).format(new Date(value));
}

function formatDuration(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}
