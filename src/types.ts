export type Specialty = 'psiquiatra' | 'psicologo';

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
