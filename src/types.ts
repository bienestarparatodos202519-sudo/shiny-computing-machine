export type Specialty = 'psiquiatra' | 'psicologo';

export type AppointmentStatus = 'scheduled' | 'completed' | 'canceled';

export interface Doctor {
  id: string;
  name: string;
  specialty: Specialty;
}

export interface Appointment {
  id: string;
  date: string;
  time: string;
  patientName: string;
  patientPhone: string;
  patientFileNumber: string;
  specialty: Specialty;
  doctorId: string;
  doctorName: string;
  status: AppointmentStatus;
  reason: string;
  notes: string;
}

export interface BlockedDay {
  date: string;
  description: string;
}
