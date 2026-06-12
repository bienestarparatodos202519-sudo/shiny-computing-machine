import type { Appointment, BlockedDay, Doctor } from '../types';

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toDateKey(date);
};

export const doctors: Doctor[] = [
  {
    id: 'doc-psq-1',
    name: 'Dra. Elena Vargas',
    specialty: 'psiquiatra',
  },
  {
    id: 'doc-psq-2',
    name: 'Dr. Mateo Rios',
    specialty: 'psiquiatra',
  },
  {
    id: 'doc-psi-1',
    name: 'Psic. Sofia Herrera',
    specialty: 'psicologo',
  },
  {
    id: 'doc-psi-2',
    name: 'Psic. Daniel Cruz',
    specialty: 'psicologo',
  },
];

export const appointments: Appointment[] = [
  {
    id: 'apt-001',
    date: addDays(0),
    time: '09:00',
    patientName: 'Camila Torres',
    patientFileNumber: 'EXP-1048',
    patientPhone: '+525512345678',
    patientCurp: 'TOCC920814MDFRRM09',
    doctorId: 'doc-psq-1',
    doctorName: 'Dra. Elena Vargas',
    specialty: 'psiquiatra',
    appointmentType: 'individual',
    status: 'confirmed',
  },
  {
    id: 'apt-002',
    date: addDays(0),
    time: '10:30',
    patientName: 'Luis Hernandez',
    patientFileNumber: 'EXP-2051',
    patientPhone: '+525587654321',
    patientCurp: 'HEHL880321HDFRNS04',
    doctorId: 'doc-psi-1',
    doctorName: 'Psic. Sofia Herrera',
    specialty: 'psicologo',
    appointmentType: 'pruebas',
    status: 'confirmed',
  },
  {
    id: 'apt-003',
    date: addDays(1),
    time: '12:00',
    patientName: 'Mariana Salas',
    patientFileNumber: 'EXP-3110',
    patientPhone: '+525500001111',
    doctorId: 'doc-psi-2',
    doctorName: 'Psic. Daniel Cruz',
    specialty: 'psicologo',
    appointmentType: 'pareja',
    status: 'confirmed',
  },
  {
    id: 'apt-004',
    date: addDays(2),
    time: '08:45',
    patientName: 'Roberto Mejia',
    patientFileNumber: 'EXP-0862',
    patientPhone: '5500000000',
    patientCurp: 'MERB790506HDFJJB05',
    doctorId: 'doc-psq-2',
    doctorName: 'Dr. Mateo Rios',
    specialty: 'psiquiatra',
    appointmentType: 'individual',
    status: 'canceled',
  },
  {
    id: 'apt-005',
    date: addDays(5),
    time: '16:15',
    patientName: 'Ana Paula Gomez',
    patientFileNumber: 'EXP-4421',
    patientPhone: '+525599988877',
    patientCurp: 'GOGA950901MDFMNN02',
    doctorId: 'doc-psq-1',
    doctorName: 'Dra. Elena Vargas',
    specialty: 'psiquiatra',
    appointmentType: 'individual',
    status: 'confirmed',
  },
  {
    id: 'apt-006',
    date: addDays(-3),
    time: '13:30',
    patientName: 'Jorge Molina',
    patientFileNumber: 'EXP-5122',
    patientPhone: '+525544332211',
    doctorId: 'doc-psi-1',
    doctorName: 'Psic. Sofia Herrera',
    specialty: 'psicologo',
    appointmentType: 'individual',
    status: 'confirmed',
  },
];

export const blockedDays: BlockedDay[] = [
  {
    id: 'block-001',
    date: addDays(3),
    description: 'Capacitacion clinica',
  },
  {
    id: 'block-002',
    date: addDays(10),
    description: 'Mantenimiento de agenda',
  },
];
