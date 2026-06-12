import readXlsxFile from 'read-excel-file/browser';
import writeXlsxFile from 'write-excel-file/browser';
import type { Sheet } from 'write-excel-file/browser';
import type { Appointment, BlockedDay, ClinicData, Doctor, Patient, Specialty } from '../types';

type CellValue = string | number | boolean | Date | null | undefined;
type Row = CellValue[];

const headers = {
  patients: ['Nombre', 'Expediente', 'Telefono', 'CURP'],
  doctors: ['Nombre', 'Especialidad', 'Dias de jornada', 'Hora inicio', 'Hora fin'],
  appointments: ['Fecha', 'Hora', 'Paciente', 'Expediente', 'Telefono', 'CURP', 'Especialista', 'Especialidad', 'Tipo', 'Estatus'],
  blockedDays: ['Fecha', 'Descripcion'],
};

const normalize = (value: CellValue) => String(value ?? '').trim();
const normalizeLower = (value: CellValue) => normalize(value).toLowerCase();
const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const parseSpecialty = (value: CellValue): Specialty => (normalizeLower(value).includes('psicolog') ? 'psicologo' : 'psiquiatra');

const toRows = (rows: Row[]) => {
  if (rows.length < 2) return [];
  const [headerRow, ...bodyRows] = rows;
  const titles = headerRow.map((cell) => normalizeLower(cell));

  return bodyRows
    .filter((row) => row.some((cell) => normalize(cell)))
    .map((row) => {
      const record: Record<string, string> = {};
      titles.forEach((title, index) => {
        record[title] = normalize(row[index]);
      });
      return record;
    });
};

const findSheet = (sheets: { sheet: string; data: Row[] }[], name: string) => {
  return sheets.find((sheet) => sheet.sheet.toLowerCase() === name.toLowerCase())?.data ?? [];
};

const cell = (value: CellValue) => value ?? '';

export async function exportClinicData(data: ClinicData) {
  const sheets: Sheet<Blob>[] = [
      {
        sheet: 'Pacientes',
        data: [
          headers.patients.map((header) => cell(header)),
          ...data.patients.map((patient) => [patient.name, patient.fileNumber, patient.phone, patient.curp]),
        ],
      },
      {
        sheet: 'Especialistas',
        data: [
          headers.doctors.map((header) => cell(header)),
          ...data.doctors.map((doctor) => [doctor.name, doctor.specialty, doctor.workDays.join(', '), doctor.workStart, doctor.workEnd]),
        ],
      },
      {
        sheet: 'Citas',
        data: [
          headers.appointments.map((header) => cell(header)),
          ...data.appointments.map((appointment) => [
            appointment.date,
            appointment.time,
            appointment.patientName,
            appointment.patientFileNumber,
            appointment.patientPhone,
            appointment.patientCurp ?? '',
            appointment.doctorName,
            appointment.specialty,
            appointment.appointmentType,
            appointment.status,
          ]),
        ],
      },
      {
        sheet: 'Bloqueos',
        data: [
          headers.blockedDays.map((header) => cell(header)),
          ...data.blockedDays.map((blockedDay) => [blockedDay.date, blockedDay.description]),
        ],
      },
    ];

  await writeXlsxFile(sheets).toFile(`agenda-clinica-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export async function importClinicData(file: File): Promise<Partial<ClinicData>> {
  const workbook = (await readXlsxFile(file)) as { sheet: string; data: Row[] }[];

  const patients: Patient[] = toRows(findSheet(workbook, 'Pacientes')).map((row) => ({
    id: createId('pat'),
    name: row.nombre,
    fileNumber: row.expediente,
    phone: row.telefono,
    curp: row.curp,
  }));

  const doctors: Doctor[] = toRows(findSheet(workbook, 'Especialistas')).map((row) => ({
    id: createId('doc'),
    name: row.nombre,
    specialty: parseSpecialty(row.especialidad),
    workDays: row['dias de jornada'] ? row['dias de jornada'].split(',').map((day) => day.trim()).filter(Boolean) : [],
    workStart: row['hora inicio'] || '09:00',
    workEnd: row['hora fin'] || '17:00',
  }));

  const appointments: Appointment[] = toRows(findSheet(workbook, 'Citas')).map((row) => {
    const doctor = doctors.find((item) => item.name === row.especialista);
    return {
      id: createId('apt'),
      date: row.fecha,
      time: row.hora,
      patientName: row.paciente,
      patientFileNumber: row.expediente,
      patientPhone: row.telefono,
      patientCurp: row.curp,
      doctorId: doctor?.id ?? createId('doc-ref'),
      doctorName: row.especialista,
      specialty: parseSpecialty(row.especialidad),
      appointmentType: row.tipo === 'pareja' || row.tipo === 'pruebas' ? row.tipo : 'individual',
      status: row.estatus === 'canceled' || row.estatus === 'cancelada' ? 'canceled' : 'confirmed',
    };
  });

  const blockedDays: BlockedDay[] = toRows(findSheet(workbook, 'Bloqueos')).map((row) => ({
    id: createId('block'),
    date: row.fecha,
    description: row.descripcion,
  }));

  return {
    patients,
    doctors,
    appointments,
    blockedDays,
  };
}

export async function downloadExcelTemplate() {
  const sheets: Sheet<Blob>[] = [
    { sheet: 'Pacientes', data: [headers.patients.map((header) => cell(header)), ['Nombre Paciente', 'EXP-0001', '+525500000000', 'CURP000000XXXXXX00']] },
    { sheet: 'Especialistas', data: [headers.doctors.map((header) => cell(header)), ['Dra. Ejemplo', 'psicologo', 'Lunes, Martes, Viernes', '09:00', '17:00']] },
    { sheet: 'Citas', data: [headers.appointments.map((header) => cell(header)), ['2026-06-12', '10:00', 'Nombre Paciente', 'EXP-0001', '+525500000000', 'CURP000000XXXXXX00', 'Dra. Ejemplo', 'psicologo', 'individual', 'confirmed']] },
    { sheet: 'Bloqueos', data: [headers.blockedDays.map((header) => cell(header)), ['2026-06-30', 'Capacitacion']] },
  ];

  await writeXlsxFile(sheets).toFile('plantilla-carga-masiva-agenda-clinica.xlsx');
}
