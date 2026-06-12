import type { ClinicData } from '../types';

const GOOGLE_SYNC_URL_KEY = 'agenda-clinica-google-sync-url';

export function loadGoogleSyncUrl() {
  return window.localStorage.getItem(GOOGLE_SYNC_URL_KEY) ?? '';
}

export function saveGoogleSyncUrl(url: string) {
  window.localStorage.setItem(GOOGLE_SYNC_URL_KEY, url.trim());
}

export async function pushToGoogleSheets(url: string, data: ClinicData) {
  if (!url.trim()) {
    throw new Error('Configura primero la URL de Google Sheets.');
  }

  const response = await fetch(url.trim(), {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Google Sheets no acepto la sincronizacion.');
  }
}

export async function pullFromGoogleSheets(url: string): Promise<ClinicData> {
  if (!url.trim()) {
    throw new Error('Configura primero la URL de Google Sheets.');
  }

  const response = await fetch(url.trim());
  if (!response.ok) {
    throw new Error('No se pudo leer Google Sheets.');
  }

  return (await response.json()) as ClinicData;
}
