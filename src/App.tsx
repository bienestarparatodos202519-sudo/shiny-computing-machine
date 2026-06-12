import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { CalendarView } from './components/CalendarView';
import type { Appointment, AppointmentStatus, BlockedDay, Doctor, Specialty } from './types';

const STORAGE_KEY = 'agenda-medica-registros-v1';

const defaultDoctors: Doctor[] = [
  { id: 'psiquiatra', name: 'Psiquiatra', specialty: 'psiquiatra' },
  { id: 'psicologo', name: 'Psicologo', specialty: 'psicologo' },
];

type FormState = {
  id: string | null;
  date: string;
  time: string;
  patientName: string;
  patientFileNumber: string;
  patientCurp: string;
  patientPhone: string;
  specialty: Specialty;
  doctorName: string;
  reason: string;
  notes: string;
  status: AppointmentStatus;
};

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const emptyForm = (): FormState => ({
  id: null,
  date: formatDate(new Date()),
  time: '09:00',
  patientName: '',
  patientFileNumber: '',
  patientCurp: '',
  patientPhone: '',
  specialty: 'psicologo',
  doctorName: 'Psicologo',
  reason: '',
  notes: '',
  status: 'scheduled',
});

const blockedDays: BlockedDay[] = [];

const normalizeCurp = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 18);

const createId = () => {
  if ('crypto' in window && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  return `registro-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const escapeExcelCell = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

const downloadFile = (content: BlobPart, filename: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const loadSavedAppointments = (): Appointment[] => {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return [];
  }

  try {
    const parsed = JSON.parse(saved) as Appointment[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export default function App() {
  const [appointments, setAppointments] = useState<Appointment[]>(() => loadSavedAppointments());
  const [form, setForm] = useState<FormState>(() => emptyForm());
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('Los registros se guardan automaticamente en este dispositivo.');
  const importInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
  }, [appointments]);

  const doctors = useMemo(() => {
    const customDoctors = appointments.map((app) => ({
      id: `${app.specialty}-${app.doctorName}`,
      name: app.doctorName,
      specialty: app.specialty,
    }));
    const unique = new Map<string, Doctor>();
    [...defaultDoctors, ...customDoctors].forEach((doctor) => unique.set(doctor.id, doctor));
    return Array.from(unique.values());
  }, [appointments]);

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return appointments;
    }
    return appointments.filter((record) => {
      return [
        record.patientName,
        record.patientFileNumber,
        record.patientCurp,
        record.patientPhone,
        record.doctorName,
        record.specialty,
        record.reason,
      ]
        .join(' ')
        .toLowerCase()
        .includes(term);
    });
  }, [appointments, search]);

  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  }, [filteredRecords]);

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: field === 'patientCurp' ? normalizeCurp(value) : value,
      ...(field === 'specialty' ? { doctorName: value === 'psicologo' ? 'Psicologo' : 'Psiquiatra' } : {}),
    }));
  };

  const resetForm = () => {
    setForm(emptyForm());
    setMessage('Formulario limpio. Puedes capturar un nuevo paciente.');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const now = new Date().toISOString();
    const trimmedName = form.patientName.trim();
    const trimmedFile = form.patientFileNumber.trim();
    const trimmedCurp = form.patientCurp.trim();
    const trimmedPhone = form.patientPhone.trim();
    const trimmedDoctor = form.doctorName.trim() || (form.specialty === 'psicologo' ? 'Psicologo' : 'Psiquiatra');

    if (!trimmedName || !trimmedFile || !trimmedCurp || !trimmedPhone) {
      setMessage('Completa nombre, expediente, CURP y telefono antes de guardar.');
      return;
    }

    const nextRecord: Appointment = {
      id: form.id ?? createId(),
      date: form.date,
      time: form.time,
      patientName: trimmedName,
      patientFileNumber: trimmedFile,
      patientCurp: trimmedCurp,
      patientPhone: trimmedPhone,
      specialty: form.specialty,
      doctorId: form.specialty,
      doctorName: trimmedDoctor,
      status: form.status,
      reason: form.reason.trim(),
      notes: form.notes.trim(),
      createdAt: appointments.find((app) => app.id === form.id)?.createdAt ?? now,
      updatedAt: now,
    };

    setAppointments((current) => {
      if (form.id) {
        return current.map((record) => (record.id === form.id ? nextRecord : record));
      }
      return [...current, nextRecord];
    });
    setForm(emptyForm());
    setMessage(form.id ? 'Registro actualizado y guardado.' : 'Paciente agregado y guardado.');
  };

  const editRecord = (record: Appointment) => {
    setForm({
      id: record.id,
      date: record.date,
      time: record.time,
      patientName: record.patientName,
      patientFileNumber: record.patientFileNumber,
      patientCurp: record.patientCurp,
      patientPhone: record.patientPhone,
      specialty: record.specialty,
      doctorName: record.doctorName,
      reason: record.reason,
      notes: record.notes,
      status: record.status,
    });
    setMessage(`Editando registro de ${record.patientName}.`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteRecord = (id: string) => {
    const record = appointments.find((app) => app.id === id);
    if (!record) {
      return;
    }
    const confirmed = window.confirm(`Eliminar el registro de ${record.patientName}?`);
    if (!confirmed) {
      return;
    }
    setAppointments((current) => current.filter((app) => app.id !== id));
    if (form.id === id) {
      setForm(emptyForm());
    }
    setMessage('Registro eliminado.');
  };

  const exportExcel = () => {
    const rows = appointments.map((record) => [
      record.date,
      record.time,
      record.patientName,
      record.patientFileNumber,
      record.patientCurp,
      record.patientPhone,
      record.specialty === 'psicologo' ? 'Psicologo' : 'Psiquiatra',
      record.doctorName,
      record.status,
      record.reason,
      record.notes,
      record.createdAt,
      record.updatedAt,
    ]);
    const headers = ['Fecha', 'Hora', 'Nombre', 'Expediente', 'CURP', 'Telefono', 'Especialidad', 'Especialista', 'Estado', 'Motivo', 'Notas', 'Creado', 'Actualizado'];
    const tableRows = [headers, ...rows]
      .map((row) => `<tr>${row.map((cell) => `<td>${escapeExcelCell(String(cell ?? ''))}</td>`).join('')}</tr>`)
      .join('');
    const html = `<!doctype html><html><head><meta charset="utf-8"></head><body><table>${tableRows}</table></body></html>`;
    downloadFile(html, `agenda_medica_${formatDate(new Date())}.xls`, 'application/vnd.ms-excel;charset=utf-8');
    setMessage('Base de datos descargada para Excel.');
  };

  const exportBackup = () => {
    downloadFile(JSON.stringify(appointments, null, 2), `respaldo_agenda_medica_${formatDate(new Date())}.json`, 'application/json;charset=utf-8');
    setMessage('Respaldo descargado. Puedes importarlo en otro dispositivo.');
  };

  const importBackup = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Appointment[];
        if (!Array.isArray(parsed)) {
          throw new Error('Formato invalido');
        }
        setAppointments(parsed);
        setForm(emptyForm());
        setMessage('Respaldo importado y guardado en este dispositivo.');
      } catch {
        setMessage('No se pudo importar el respaldo. Verifica que sea el archivo JSON correcto.');
      } finally {
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_32%),linear-gradient(135deg,#f8fafc,#eef2ff_58%,#faf5ff)] p-4 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-white/60 bg-white/70 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-md">
          <div className="mb-5 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-indigo-500">Agenda médica local</p>
              <h1 className="text-2xl font-black text-slate-900">Pacientes, citas y expedientes</h1>
              <p className="text-sm font-semibold text-slate-500">
                Agrega, edita y elimina registros. La información queda grabada en este dispositivo.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={exportExcel} className="rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-black text-white shadow-md shadow-emerald-100 hover:bg-emerald-700">
                Descargar Excel
              </button>
              <button onClick={exportBackup} className="rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-black text-white shadow-md shadow-indigo-100 hover:bg-indigo-700">
                Respaldo para otro dispositivo
              </button>
              <button onClick={() => importInputRef.current?.click()} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50">
                Importar respaldo
              </button>
              <input ref={importInputRef} type="file" accept="application/json,.json" onChange={importBackup} className="hidden" />
            </div>
          </div>

          <div className="mb-5 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-900">{message}</div>

          <form onSubmit={handleSubmit} className="grid gap-3 lg:grid-cols-12">
            <Field className="lg:col-span-3" label="Nombre del paciente">
              <input value={form.patientName} onChange={(event) => updateField('patientName', event.target.value)} className="input" placeholder="Nombre completo" />
            </Field>
            <Field className="lg:col-span-2" label="Expediente">
              <input value={form.patientFileNumber} onChange={(event) => updateField('patientFileNumber', event.target.value)} className="input" placeholder="EXP-001" />
            </Field>
            <Field className="lg:col-span-3" label="CURP">
              <input value={form.patientCurp} onChange={(event) => updateField('patientCurp', event.target.value)} className="input uppercase" placeholder="CURP" maxLength={18} />
            </Field>
            <Field className="lg:col-span-2" label="Telefono">
              <input value={form.patientPhone} onChange={(event) => updateField('patientPhone', event.target.value)} className="input" placeholder="Telefono" />
            </Field>
            <Field className="lg:col-span-2" label="Especialidad">
              <select value={form.specialty} onChange={(event) => updateField('specialty', event.target.value)} className="input">
                <option value="psicologo">Psicologo</option>
                <option value="psiquiatra">Psiquiatra</option>
              </select>
            </Field>
            <Field className="lg:col-span-3" label="Especialista">
              <input value={form.doctorName} onChange={(event) => updateField('doctorName', event.target.value)} className="input" placeholder="Nombre del especialista" />
            </Field>
            <Field className="lg:col-span-2" label="Fecha">
              <input type="date" value={form.date} onChange={(event) => updateField('date', event.target.value)} className="input" />
            </Field>
            <Field className="lg:col-span-2" label="Hora">
              <input type="time" value={form.time} onChange={(event) => updateField('time', event.target.value)} className="input" />
            </Field>
            <Field className="lg:col-span-2" label="Estado">
              <select value={form.status} onChange={(event) => updateField('status', event.target.value)} className="input">
                <option value="scheduled">Programada</option>
                <option value="completed">Completada</option>
                <option value="canceled">Cancelada</option>
              </select>
            </Field>
            <Field className="lg:col-span-3" label="Motivo">
              <input value={form.reason} onChange={(event) => updateField('reason', event.target.value)} className="input" placeholder="Motivo de consulta" />
            </Field>
            <Field className="lg:col-span-5" label="Notas">
              <input value={form.notes} onChange={(event) => updateField('notes', event.target.value)} className="input" placeholder="Notas del registro" />
            </Field>
            <div className="flex items-end gap-2 lg:col-span-4">
              <button type="submit" className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white hover:bg-slate-800">
                {form.id ? 'Guardar cambios' : 'Agregar paciente'}
              </button>
              <button type="button" onClick={resetForm} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50">
                Limpiar
              </button>
            </div>
          </form>
        </section>

        <CalendarView appointments={appointments} doctors={doctors} blockedDays={blockedDays} onEditAppointment={editRecord} onDeleteAppointment={deleteRecord} />

        <section className="rounded-3xl border border-white/60 bg-white/70 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-md">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-black text-slate-900">Base de datos de registros</h2>
              <p className="text-xs font-bold text-slate-500">{appointments.length} registros guardados</p>
            </div>
            <input value={search} onChange={(event) => setSearch(event.target.value)} className="input sm:max-w-xs" placeholder="Buscar por nombre, CURP, expediente..." />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] uppercase tracking-widest text-slate-400">
                  <th className="py-2">Fecha</th>
                  <th>Paciente</th>
                  <th>Expediente</th>
                  <th>CURP</th>
                  <th>Telefono</th>
                  <th>Especialidad</th>
                  <th>Especialista</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedRecords.map((record) => (
                  <tr key={record.id} className="border-b border-slate-100 font-bold text-slate-700">
                    <td className="py-3 font-mono">{record.date} {record.time}</td>
                    <td>{record.patientName}</td>
                    <td>{record.patientFileNumber}</td>
                    <td className="font-mono">{record.patientCurp}</td>
                    <td>{record.patientPhone}</td>
                    <td>{record.specialty === 'psicologo' ? 'Psicologo' : 'Psiquiatra'}</td>
                    <td>{record.doctorName}</td>
                    <td>
                      <div className="flex gap-2">
                        <button onClick={() => editRecord(record)} className="rounded-xl bg-indigo-50 px-3 py-1.5 font-black text-indigo-700 hover:bg-indigo-100">Editar</button>
                        <button onClick={() => deleteRecord(record.id)} className="rounded-xl bg-rose-50 px-3 py-1.5 font-black text-rose-700 hover:bg-rose-100">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {sortedRecords.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center text-sm font-bold text-slate-400">
                No hay registros. Agrega el primer paciente desde el formulario.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block ${className ?? ''}`}>
      <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span>
      {children}
    </label>
  );
}
