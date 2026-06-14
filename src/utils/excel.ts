import readXlsxFile from 'read-excel-file/browser';
import writeXlsxFile from 'write-excel-file/browser';
import type { Sheet } from 'write-excel-file/browser';
import type { Appointment, BlockedDay, ClinicData, Doctor, Patient, Specialty, WorkDay, WorkSchedule } from '../types';

type CellValue = string | number | boolean | Date | null | undefined;
type Row = CellValue[];

const headers = {
  simple: ['Nombre de paciente', 'Expediente', 'Numero de telefono', 'Especialidad', 'Especialista'],
  patients: ['Nombre', 'Expediente', 'Telefono', 'CURP (Opcional)'],
  doctors: [
    'Nombre',
    'Especialidad',
    'Lunes Inicio',
    'Lunes Fin',
    'Martes Inicio',
    'Martes Fin',
    'Miercoles Inicio',
    'Miercoles Fin',
    'Jueves Inicio',
    'Jueves Fin',
    'Viernes Inicio',
    'Viernes Fin',
    'Sabado Inicio',
    'Sabado Fin',
    'Domingo Inicio',
    'Domingo Fin',
    'Festivos Inicio',
    'Festivos Fin',
  ],
  appointments: ['Fecha', 'Hora', 'Paciente', 'Expediente', 'Telefono', 'CURP (Opcional)', 'Especialista', 'Especialidad', 'Tipo', 'Estatus'],
  blockedDays: ['Fecha', 'Descripcion'],
};
const workDays: WorkDay[] = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo', 'Festivos'];

const normalize = (value: CellValue) => String(value ?? '').trim();
const normalizeLower = (value: CellValue) => normalize(value).toLowerCase();
const normalizeKey = (value: CellValue) => normalizeLower(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const normalizeHeader = (value: CellValue) => normalizeKey(value).replace(/\s*\(.+\)\s*$/, '');
const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const parseSpecialty = (value: CellValue): Specialty => (normalizeLower(value).includes('psicolog') ? 'psicologo' : 'psiquiatra');
const parseAppointmentType = (value: CellValue): Appointment['appointmentType'] => {
  const normalized = normalize(value);
  return normalized === 'pareja' || normalized === 'pruebas' ? normalized : 'individual';
};

const pad = (value: number) => String(value).padStart(2, '0');

const normalizeDate = (value: CellValue) => {
  if (value instanceof Date) {
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  }

  const raw = normalize(value);
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    return `${slashMatch[3]}-${pad(Number(slashMatch[2]))}-${pad(Number(slashMatch[1]))}`;
  }

  return raw.slice(0, 10);
};

const normalizeTime = (value: CellValue) => {
  if (value instanceof Date) {
    return `${pad(value.getHours())}:${pad(value.getMinutes())}`;
  }

  if (typeof value === 'number') {
    const totalMinutes = Math.round(value * 24 * 60);
    return `${pad(Math.floor(totalMinutes / 60) % 24)}:${pad(totalMinutes % 60)}`;
  }

  const raw = normalize(value);
  const match = raw.match(/^(\d{1,2}):(\d{2})/);
  if (match) {
    return `${pad(Number(match[1]))}:${match[2]}`;
  }

  return raw;
};

type ExcelRecord = Record<string, CellValue>;

const createScheduleFromRow = (row: ExcelRecord): WorkSchedule[] => {
  const legacyDays = normalize(row['dias de jornada']) ? normalize(row['dias de jornada']).split(',').map((day) => day.trim()) : [];
  const legacyStart = normalizeTime(row['hora inicio']) || '09:00';
  const legacyEnd = normalizeTime(row['hora fin']) || '17:00';
  const hasIndividualHours = workDays.some((day) => {
    const key = day.toLowerCase();
    return normalize(row[`${key} inicio`]) || normalize(row[`${key} fin`]);
  });
  const defaultEnabledDays = hasIndividualHours || legacyDays.length ? legacyDays : ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'];

  return workDays.map((day) => {
    const key = day.toLowerCase();
    const start = normalizeTime(row[`${key} inicio`]);
    const end = normalizeTime(row[`${key} fin`]);
    const enabled = Boolean(start && end) || defaultEnabledDays.includes(day);
    return {
      day,
      enabled,
      start: start || legacyStart,
      end: end || legacyEnd,
    };
  });
};

const scheduleValue = (schedule: WorkSchedule[] | undefined, day: WorkDay, type: 'start' | 'end') => {
  const entry = schedule?.find((item) => item.day === day);
  if (!entry?.enabled) return '';
  return type === 'start' ? entry.start : entry.end;
};

const toRows = (rows: Row[]): ExcelRecord[] => {
  if (rows.length < 2) return [];
  const [headerRow, ...bodyRows] = rows;
  const titles = headerRow.map((cell) => normalizeHeader(cell));

  return bodyRows
    .filter((row) => row.some((cell) => normalize(cell)))
    .map((row) => {
      const record: ExcelRecord = {};
      titles.forEach((title, index) => {
        record[title] = row[index];
      });
      return record;
    });
};

const findSheet = (sheets: { sheet: string; data: Row[] }[], names: string[]) => {
  const expectedNames = names.map((name) => normalizeKey(name));
  return sheets.find((sheet) => expectedNames.includes(normalizeKey(sheet.sheet)))?.data ?? [];
};

const findSimpleSheet = (sheets: { sheet: string; data: Row[] }[]) => {
  const namedSheet = findSheet(sheets, ['Carga Masiva', 'Carga', 'Registros', 'Datos']);
  if (namedSheet.length) return namedSheet;

  return sheets.find((sheet) => {
    const headerRow = sheet.data[0] ?? [];
    const headers = headerRow.map((cell) => normalizeHeader(cell));
    return headers.includes('nombre de paciente') && headers.includes('expediente') && headers.includes('especialidad') && headers.includes('especialista');
  })?.data ?? [];
};

const valueOf = (row: ExcelRecord, aliases: string[]) => {
  for (const alias of aliases) {
    const value = row[normalizeHeader(alias)];
    if (normalize(value)) return value;
  }
  return '';
};

const sheetNames = {
  patients: ['Pacientes', 'Paciente', 'Patients'],
  doctors: ['Especialistas', 'Especialista', 'Doctores', 'Doctor', 'Doctors'],
  appointments: ['Citas', 'Cita', 'Appointments', 'Appointment'],
  blockedDays: ['Bloqueos', 'Bloqueo', 'Dias bloqueados', 'Dias de bloqueo', 'Blocked days'],
};

const simplePatientsFromRows = (rows: ExcelRecord[]): Patient[] => {
  return rows.map((row) => ({
    id: createId('pat'),
    name: normalize(valueOf(row, ['Nombre de paciente', 'Paciente', 'Nombre'])),
    fileNumber: normalize(valueOf(row, ['Expediente', 'Numero de expediente', 'Número de expediente'])),
    phone: normalize(valueOf(row, ['Numero de telefono', 'Número de teléfono', 'Telefono', 'Teléfono'])),
    curp: normalize(valueOf(row, ['CURP', 'CURP Opcional'])),
  })).filter((patient) => patient.name && patient.fileNumber);
};

const simpleDoctorsFromRows = (rows: ExcelRecord[]): Doctor[] => {
  const uniqueDoctors = new Map<string, Doctor>();
  rows.forEach((row) => {
    const name = normalize(valueOf(row, ['Especialista', 'Doctor', 'Medico', 'Médico']));
    if (!name) return;
    const specialty = parseSpecialty(valueOf(row, ['Especialidad']));
    uniqueDoctors.set(`${name}-${specialty}`, {
      id: createId('doc'),
      name,
      specialty,
      schedule: createScheduleFromRow(row),
    });
  });
  return Array.from(uniqueDoctors.values());
};

const simpleAppointmentsFromRows = (rows: ExcelRecord[], doctors: Doctor[]): Appointment[] => {
  return rows
    .filter((row) => normalize(valueOf(row, ['Fecha'])) && normalize(valueOf(row, ['Hora'])))
    .map((row) => {
      const doctorName = normalize(valueOf(row, ['Especialista', 'Doctor', 'Medico', 'Médico']));
      const doctor = doctors.find((item) => item.name === doctorName);
      return {
        id: createId('apt'),
        date: normalizeDate(valueOf(row, ['Fecha'])),
        time: normalizeTime(valueOf(row, ['Hora'])),
        patientName: normalize(valueOf(row, ['Nombre de paciente', 'Paciente', 'Nombre'])),
        patientFileNumber: normalize(valueOf(row, ['Expediente', 'Numero de expediente', 'Número de expediente'])),
        patientPhone: normalize(valueOf(row, ['Numero de telefono', 'Número de teléfono', 'Telefono', 'Teléfono'])),
        patientCurp: normalize(valueOf(row, ['CURP', 'CURP Opcional'])),
        doctorId: doctor?.id ?? createId('doc-ref'),
        doctorName,
        specialty: parseSpecialty(valueOf(row, ['Especialidad'])),
        appointmentType: parseAppointmentType(valueOf(row, ['Tipo'])),
        status: normalize(valueOf(row, ['Estatus'])) === 'canceled' || normalize(valueOf(row, ['Estatus'])) === 'cancelada' ? 'canceled' : 'confirmed',
      };
    });
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
          ...data.doctors.map((doctor) => [
            doctor.name,
            doctor.specialty,
            ...workDays.flatMap((day) => [scheduleValue(doctor.schedule, day, 'start'), scheduleValue(doctor.schedule, day, 'end')]),
          ]),
        ],
      },
      {
        sheet: 'Citas',
        data: [
          headers.appointments.map((header) => cell(header)),
          ...data.appointments.map((appointment) => [
            normalizeDate(appointment.date),
            normalizeTime(appointment.time),
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

  const simpleRows = toRows(findSimpleSheet(workbook));
  if (simpleRows.length) {
    const patients = simplePatientsFromRows(simpleRows);
    const doctors = simpleDoctorsFromRows(simpleRows);
    const appointments = simpleAppointmentsFromRows(simpleRows, doctors);

    if (patients.length + doctors.length + appointments.length > 0) {
      return {
        patients,
        doctors,
        appointments,
        blockedDays: [],
      };
    }
  }

  const patientRows = toRows(findSheet(workbook, sheetNames.patients));
  const patients: Patient[] = patientRows.map((row) => ({
    id: createId('pat'),
    name: normalize(row.nombre),
    fileNumber: normalize(row.expediente),
    phone: normalize(row.telefono),
    curp: normalize(row.curp),
  }));

  const doctorRows = toRows(findSheet(workbook, sheetNames.doctors));
  const doctors: Doctor[] = doctorRows.map((row) => ({
    id: createId('doc'),
    name: normalize(row.nombre),
    specialty: parseSpecialty(row.especialidad),
    schedule: createScheduleFromRow(row),
  }));

  const appointmentRows = toRows(findSheet(workbook, sheetNames.appointments));
  const appointments: Appointment[] = appointmentRows.map((row) => {
    const doctorName = normalize(row.especialista);
    const doctor = doctors.find((item) => item.name === doctorName);
    return {
      id: createId('apt'),
      date: normalizeDate(row.fecha),
      time: normalizeTime(row.hora),
      patientName: normalize(row.paciente),
      patientFileNumber: normalize(row.expediente),
      patientPhone: normalize(row.telefono),
      patientCurp: normalize(row.curp),
      doctorId: doctor?.id ?? createId('doc-ref'),
      doctorName,
      specialty: parseSpecialty(row.especialidad),
      appointmentType: parseAppointmentType(row.tipo),
      status: normalize(row.estatus) === 'canceled' || normalize(row.estatus) === 'cancelada' ? 'canceled' : 'confirmed',
    };
  });

  const blockedDayRows = toRows(findSheet(workbook, sheetNames.blockedDays));
  const blockedDays: BlockedDay[] = blockedDayRows.map((row) => ({
    id: createId('block'),
    date: normalizeDate(row.fecha),
    description: normalize(row.descripcion),
  }));

  if (patients.length + doctors.length + appointments.length + blockedDays.length === 0) {
    throw new Error('No se encontraron registros para importar. Verifica que el Excel tenga hojas Pacientes, Especialistas, Citas o Bloqueos con encabezados de la plantilla.');
  }

  return {
    patients,
    doctors,
    appointments,
    blockedDays,
  };
}

export async function downloadExcelTemplate() {
  const sheets: Sheet<Blob>[] = [
    {
      sheet: 'Carga Masiva',
      data: [
        headers.simple.map((header) => cell(header)),
        ['Nombre Paciente', 'EXP-0001', '+525500000000', 'psicologo', 'Dra. Ejemplo'],
      ],
    },
  ];

  await writeXlsxFile(sheets).toFile('plantilla-carga-masiva-agenda-clinica.xlsx');
}
