import { appointments, blockedDays, doctors, patients } from '../data/sampleData';
import type { ClinicData, Doctor, WorkDay, WorkSchedule } from '../types';

const STORAGE_KEY = 'agenda-clinica-data-v1';
const workDays: WorkDay[] = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo', 'Festivos'];

export const defaultClinicData: ClinicData = {
  patients,
  doctors,
  appointments,
  blockedDays,
};

export function createDefaultSchedule(enabledDays: string[] = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'], start = '09:00', end = '17:00'): WorkSchedule[] {
  return workDays.map((day) => ({
    day,
    enabled: enabledDays.includes(day),
    start,
    end,
  }));
}

function normalizeDoctors(items: Doctor[] | undefined): Doctor[] {
  if (!items?.length) return defaultClinicData.doctors;

  return items.map((doctor) => ({
    ...doctor,
    schedule: doctor.schedule?.length ? doctor.schedule : createDefaultSchedule(doctor.workDays, doctor.workStart, doctor.workEnd),
  }));
}

export function normalizeClinicData(data: Partial<ClinicData>): ClinicData {
  return {
    patients: data.patients?.length ? data.patients : defaultClinicData.patients,
    doctors: normalizeDoctors(data.doctors),
    appointments: data.appointments?.length ? data.appointments : defaultClinicData.appointments,
    blockedDays: data.blockedDays?.length ? data.blockedDays : defaultClinicData.blockedDays,
  };
}

export function loadClinicData(): ClinicData {
  const rawData = window.localStorage.getItem(STORAGE_KEY);
  if (!rawData) {
    return defaultClinicData;
  }

  try {
    const parsed = JSON.parse(rawData) as Partial<ClinicData>;
    return normalizeClinicData(parsed);
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
