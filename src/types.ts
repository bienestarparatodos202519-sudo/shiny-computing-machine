export type Specialty = 'psiquiatra' | 'psicologo';
export type AppointmentViewRange = 'all' | 'day' | 'week' | 'month';
export type WorkDay = 'Lunes' | 'Martes' | 'Miercoles' | 'Jueves' | 'Viernes' | 'Sabado' | 'Domingo' | 'Festivos';

export interface WorkSchedule {
  day: WorkDay;
  enabled: boolean;
  start: string;
  end: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: Specialty;
  schedule: WorkSchedule[];
  workDays?: string[];
  workStart?: string;
  workEnd?: string;
}

export interface Patient {
  id: string;
  name: string;
  fileNumber: string;
  phone: string;
  curp: string;
}

export interface Appointment {
  id: string;
  date: string;
  time: string;
  patientName: string;
  patientFileNumber: string;
  patientPhone: string;
  patientCurp?: string;
  doctorId: string;
  doctorName: string;
  specialty: Specialty;
  appointmentType: 'individual' | 'pareja' | 'pruebas';
  status: 'confirmed' | 'canceled';
}

export interface BlockedDay {
  id: string;
  date: string;
  description: string;
}

export interface ClinicData {
  patients: Patient[];
  doctors: Doctor[];
  appointments: Appointment[];
  blockedDays: BlockedDay[];
}
