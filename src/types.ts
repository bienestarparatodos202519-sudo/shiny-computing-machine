export type Specialty = 'psiquiatra' | 'psicologo';
export type AppointmentViewRange = 'all' | 'day' | 'week' | 'month';

export interface Doctor {
  id: string;
  name: string;
  specialty: Specialty;
  workDays: string[];
  workStart: string;
  workEnd: string;
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
