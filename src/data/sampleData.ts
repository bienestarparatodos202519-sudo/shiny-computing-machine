import type { Appointment, BlockedDay, Doctor, Patient, WorkDay, WorkSchedule } from '../types';

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

const workDays: WorkDay[] = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo', 'Festivos'];

const createSchedule = (enabledDays: WorkDay[], start: string, end: string): WorkSchedule[] => {
  return workDays.map((day) => ({
    day,
    enabled: enabledDays.includes(day),
    start,
    end,
  }));
};

export const doctors: Doctor[] = [
  {
    id: 'doc-psq-1',
    name: 'Dra. Elena Vargas',
    specialty: 'psiquiatra',
    schedule: createSchedule(['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'], '08:00', '15:00'),
  },
  {
    id: 'doc-psq-2',
    name: 'Dr. Mateo Rios',
    specialty: 'psiquiatra',
    schedule: createSchedule(['Lunes', 'Miercoles', 'Viernes'], '08:00', '14:00'),
  },
  {
    id: 'doc-psi-1',
    name: 'Psic. Sofia Herrera',
    specialty: 'psicologo',
    schedule: createSchedule(['Lunes', 'Martes', 'Jueves', 'Viernes'], '10:00', '18:00'),
  },
  {
    id: 'doc-psi-2',
    name: 'Psic. Daniel Cruz',
    specialty: 'psicologo',
    schedule: createSchedule(['Martes', 'Miercoles', 'Sabado'], '09:00', '16:00'),
  },
];

export const patients: Patient[] = [
  {
    id: 'pat-001',
    name: 'Camila Torres',
    fileNumber: 'EXP-1048',
    phone: '+525512345678',
    curp: 'TOCC920814MDFRRM09',
  },
  {
    id: 'pat-002',
    name: 'Luis Hernandez',
    fileNumber: 'EXP-2051',
    phone: '+525587654321',
    curp: 'HEHL880321HDFRNS04',
  },
  {
    id: 'pat-003',
    name: 'Mariana Salas',
    fileNumber: 'EXP-3110',
    phone: '+525500001111',
    curp: '',
  },
  {
    id: 'pat-004',
    name: 'Roberto Mejia',
    fileNumber: 'EXP-0862',
    phone: '5500000000',
    curp: 'MERB790506HDFJJB05',
  },
  {
    id: 'pat-005',
    name: 'Ana Paula Gomez',
    fileNumber: 'EXP-4421',
    phone: '+525599988877',
    curp: 'GOGA950901MDFMNN02',
  },
  {
    id: 'pat-006',
    name: 'Jorge Molina',
    fileNumber: 'EXP-5122',
    phone: '+525544332211',
    curp: '',
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
