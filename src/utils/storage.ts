import { appointments, blockedDays, doctors, patients } from '../data/sampleData';
import type { ClinicData } from '../types';

const STORAGE_KEY = 'agenda-clinica-data-v1';

export const defaultClinicData: ClinicData = {
  patients,
  doctors,
  appointments,
  blockedDays,
};

export function loadClinicData(): ClinicData {
  const rawData = window.localStorage.getItem(STORAGE_KEY);
  if (!rawData) {
    return defaultClinicData;
  }

  try {
    const parsed = JSON.parse(rawData) as Partial<ClinicData>;
    return {
      patients: parsed.patients?.length ? parsed.patients : defaultClinicData.patients,
      doctors: parsed.doctors?.length ? parsed.doctors : defaultClinicData.doctors,
      appointments: parsed.appointments?.length ? parsed.appointments : defaultClinicData.appointments,
      blockedDays: parsed.blockedDays?.length ? parsed.blockedDays : defaultClinicData.blockedDays,
    };
  } catch {
    return defaultClinicData;
  }
}

export function saveClinicData(data: ClinicData) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function resetClinicData() {
  window.localStorage.removeItem(STORAGE_KEY);
}
