import { CalendarView } from './components/CalendarView';
import type { Appointment, BlockedDay, Doctor, Specialty } from './types';

const doctors: Doctor[] = [
  { id: 'doc-ana', name: 'Dra. Ana Herrera', specialty: 'psiquiatra' },
  { id: 'doc-luis', name: 'Dr. Luis Medina', specialty: 'psiquiatra' },
  { id: 'doc-marta', name: 'Psic. Marta Rojas', specialty: 'psicologo' },
  { id: 'doc-sofia', name: 'Psic. Sofia Vargas', specialty: 'psicologo' },
];

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDays = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return formatDate(date);
};

const makeAppointment = (
  id: string,
  offset: number,
  time: string,
  patientName: string,
  doctor: Doctor,
  status: Appointment['status'],
  reason: string,
  notes: string,
): Appointment => ({
  id,
  date: addDays(offset),
  time,
  patientName,
  patientPhone: '+34 600 123 456',
  patientFileNumber: `EXP-${id.slice(-3).toUpperCase()}`,
  specialty: doctor.specialty as Specialty,
  doctorId: doctor.id,
  doctorName: doctor.name,
  status,
  reason,
  notes,
});

const appointments: Appointment[] = [
  makeAppointment('appt-101', 0, '09:00', 'Lucia Fernandez', doctors[0], 'scheduled', 'Seguimiento farmacologico', 'Revisar tolerancia y ajustar dosis si procede.'),
  makeAppointment('appt-102', 0, '10:30', 'Mateo Ruiz', doctors[2], 'completed', 'Terapia cognitivo conductual', 'Trabajar registro de ansiedad y tareas de exposicion.'),
  makeAppointment('appt-103', 1, '12:00', 'Valentina Gomez', doctors[1], 'scheduled', 'Primera consulta', 'Traer informes previos y escala de sintomas.'),
  makeAppointment('appt-104', 2, '08:45', 'Diego Navarro', doctors[3], 'scheduled', 'Sesion familiar', 'Confirmar asistencia de acudiente.'),
  makeAppointment('appt-105', 4, '11:15', 'Emma Torres', doctors[0], 'canceled', 'Control mensual', 'Cancelada por paciente. Reprogramar.'),
  makeAppointment('appt-106', 6, '16:00', 'Hugo Castillo', doctors[2], 'scheduled', 'Psicoeducacion', 'Entregar pautas de higiene del sueno.'),
  makeAppointment('appt-107', -3, '15:30', 'Clara Molina', doctors[1], 'completed', 'Evaluacion diagnostica', 'Registrar evolucion en expediente.'),
];

const blockedDays: BlockedDay[] = [
  { date: addDays(3), description: 'Jornada administrativa' },
  { date: addDays(10), description: 'Capacitacion clinica' },
];

export default function App() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_32%),linear-gradient(135deg,#f8fafc,#eef2ff_58%,#faf5ff)] p-4 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <CalendarView appointments={appointments} doctors={doctors} blockedDays={blockedDays} />
      </div>
    </main>
  );
}
