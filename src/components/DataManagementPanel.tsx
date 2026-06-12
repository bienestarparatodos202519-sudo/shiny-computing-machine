import { Cloud, Download, FileSpreadsheet, MessageCircle, Plus, RotateCcw, Search, Trash2, Upload } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Appointment, AppointmentViewRange, ClinicData, Doctor, Patient, Specialty, WorkDay, WorkSchedule } from '../types';

interface SearchFilters {
  query: string;
  specialty: 'all' | Specialty;
  range: AppointmentViewRange;
  date: string;
}

interface DataManagementPanelProps {
  data: ClinicData;
  searchFilters: SearchFilters;
  searchResults: Appointment[];
  onSearchChange: (filters: SearchFilters) => void;
  onDataChange: (data: ClinicData) => void;
  onImportExcel: (file: File) => Promise<void>;
  onExportExcel: () => Promise<void>;
  onDownloadTemplate: () => Promise<void>;
  onResetData: () => void;
  googleSyncUrl: string;
  onGoogleSyncUrlChange: (url: string) => void;
  onGooglePush: () => Promise<void>;
  onGooglePull: () => Promise<void>;
}

const workDayOptions: WorkDay[] = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo', 'Festivos'];
const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const createSchedule = (enabledDays: WorkDay[] = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes']): WorkSchedule[] => {
  return workDayOptions.map((day) => ({
    day,
    enabled: enabledDays.includes(day),
    start: '09:00',
    end: '17:00',
  }));
};

const emptyPatient = {
  name: '',
  fileNumber: '',
  phone: '',
  curp: '',
};

const emptyDoctor = {
  name: '',
  specialty: 'psicologo' as Specialty,
  schedule: createSchedule(),
};

const whatsappUrl = (phone: string, message: string) => {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
};

export function DataManagementPanel({
  data,
  searchFilters,
  searchResults,
  onSearchChange,
  onDataChange,
  onImportExcel,
  onExportExcel,
  onDownloadTemplate,
  onResetData,
  googleSyncUrl,
  onGoogleSyncUrlChange,
  onGooglePush,
  onGooglePull,
}: DataManagementPanelProps) {
  const [patientForm, setPatientForm] = useState(emptyPatient);
  const [doctorForm, setDoctorForm] = useState(emptyDoctor);
  const [appointmentForm, setAppointmentForm] = useState({
    patientId: data.patients[0]?.id ?? '',
    doctorId: data.doctors[0]?.id ?? '',
    date: new Date().toISOString().slice(0, 10),
    time: '10:00',
    appointmentType: 'individual' as Appointment['appointmentType'],
  });
  const [message, setMessage] = useState('Datos guardados en esta instalacion.');
  const [messageTone, setMessageTone] = useState<'info' | 'success' | 'warning'>('info');

  const selectedPatient = useMemo(() => data.patients.find((patient) => patient.id === appointmentForm.patientId), [appointmentForm.patientId, data.patients]);
  const selectedDoctor = useMemo(() => data.doctors.find((doctor) => doctor.id === appointmentForm.doctorId), [appointmentForm.doctorId, data.doctors]);

  const addPatient = () => {
    if (!patientForm.name || !patientForm.fileNumber) {
      setMessage('Captura nombre y expediente del paciente.');
      setMessageTone('warning');
      return;
    }

    const patient: Patient = {
      id: createId('pat'),
      ...patientForm,
    };
    onDataChange({ ...data, patients: [...data.patients, patient] });
    setPatientForm(emptyPatient);
    setAppointmentForm((current) => ({ ...current, patientId: patient.id }));
    setMessage('Paciente agregado correctamente.');
    setMessageTone('success');
  };

  const addDoctor = () => {
    if (!doctorForm.name || !doctorForm.schedule.some((entry) => entry.enabled)) {
      setMessage('Captura nombre y al menos un dia de jornada.');
      setMessageTone('warning');
      return;
    }

    const doctor: Doctor = {
      id: createId('doc'),
      ...doctorForm,
    };
    onDataChange({ ...data, doctors: [...data.doctors, doctor] });
    setDoctorForm(emptyDoctor);
    setAppointmentForm((current) => ({ ...current, doctorId: doctor.id }));
    setMessage('Especialista agregado correctamente.');
    setMessageTone('success');
  };

  const addAppointment = () => {
    if (!selectedPatient || !selectedDoctor) {
      setMessage('Selecciona paciente y especialista para crear la cita.');
      setMessageTone('warning');
      return;
    }

    const appointment: Appointment = {
      id: createId('apt'),
      date: appointmentForm.date,
      time: appointmentForm.time,
      patientName: selectedPatient.name,
      patientFileNumber: selectedPatient.fileNumber,
      patientPhone: selectedPatient.phone,
      patientCurp: selectedPatient.curp,
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.name,
      specialty: selectedDoctor.specialty,
      appointmentType: appointmentForm.appointmentType,
      status: 'confirmed',
    };
    onDataChange({ ...data, appointments: [...data.appointments, appointment] });
    setMessage('Cita agregada al calendario.');
    setMessageTone('success');
  };

  const handleImport = async (file?: File) => {
    if (!file) return;
    setMessage(`Importando ${file.name}...`);
    setMessageTone('info');
    await onImportExcel(file);
    setMessage(`Carga masiva Excel importada y guardada: ${file.name}. Ya puedes buscar los pacientes y citas importadas.`);
    setMessageTone('success');
  };

  const deletePatient = (patient: Patient) => {
    const appointmentsToKeep = data.appointments.filter((appointment) => appointment.patientFileNumber !== patient.fileNumber);
    onDataChange({
      ...data,
      patients: data.patients.filter((item) => item.id !== patient.id),
      appointments: appointmentsToKeep,
    });
    setMessage(`Paciente eliminado: ${patient.name}. Tambien se quitaron sus citas.`);
    setMessageTone('success');
  };

  const deleteDoctor = (doctor: Doctor) => {
    onDataChange({
      ...data,
      doctors: data.doctors.filter((item) => item.id !== doctor.id),
      appointments: data.appointments.filter((appointment) => appointment.doctorId !== doctor.id && appointment.doctorName !== doctor.name),
    });
    setMessage(`Especialista eliminado: ${doctor.name}. Tambien se quitaron sus citas.`);
    setMessageTone('success');
  };

  const updateAppointmentStatus = (appointmentId: string, status: Appointment['status']) => {
    onDataChange({
      ...data,
      appointments: data.appointments.map((appointment) => (appointment.id === appointmentId ? { ...appointment, status } : appointment)),
    });
    setMessage(status === 'canceled' ? 'Cita cancelada.' : 'Cita confirmada.');
    setMessageTone('success');
  };

  const updateSchedule = (day: WorkDay, changes: Partial<WorkSchedule>) => {
    setDoctorForm((current) => ({
      ...current,
      schedule: current.schedule.map((entry) => (entry.day === day ? { ...entry, ...changes } : entry)),
    }));
  };

  const syncAction = async (action: () => Promise<void>, successMessage: string) => {
    try {
      setMessage('Sincronizando con Google Sheets...');
      setMessageTone('info');
      await action();
      setMessage(successMessage);
      setMessageTone('success');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo sincronizar con Google Sheets.');
      setMessageTone('warning');
    }
  };

  return (
    <section className="mb-8 rounded-3xl border border-white/60 bg-white/45 p-5 shadow-xl backdrop-blur-md">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-black text-slate-900">
            <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
            Administracion de datos
          </h2>
          <p className="mt-1 text-xs font-bold text-slate-500">
            Alta manual, carga masiva Excel, busqueda y descarga de toda la informacion capturada.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={onDownloadTemplate} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50">
            Plantilla Excel
          </button>
          <label className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-black text-white shadow-sm hover:bg-indigo-700">
            <Upload className="h-3.5 w-3.5" />
            Carga masiva Excel
            <input type="file" accept=".xlsx" className="hidden" onChange={(event) => void handleImport(event.target.files?.[0])} />
          </label>
          <button onClick={() => void onExportExcel()} className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white shadow-sm hover:bg-emerald-700">
            <Download className="h-3.5 w-3.5" />
            Descargar Excel
          </button>
          <button onClick={onResetData} className="flex items-center gap-1.5 rounded-xl bg-rose-100 px-3 py-2 text-xs font-black text-rose-700 ring-1 ring-rose-200 hover:bg-rose-200">
            <RotateCcw className="h-3.5 w-3.5" />
            Reiniciar
          </button>
        </div>
      </div>

      <div
        role="status"
        className={`mb-5 rounded-2xl border p-3 text-xs font-bold ${
          messageTone === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
            : messageTone === 'warning'
              ? 'border-amber-200 bg-amber-50 text-amber-900'
              : 'border-indigo-100 bg-indigo-50/70 text-indigo-900'
        }`}
      >
        <span className="block text-[10px] font-black uppercase tracking-wider">Ultima accion</span>
        {message} Para varias computadoras puedes usar Google Sheets o descargar Excel y cargarlo en la otra computadora.
      </div>

      <div className="mb-5 rounded-2xl border border-white/70 bg-white/70 p-4">
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-black text-slate-800">
          <Cloud className="h-4 w-4 text-indigo-600" />
          Sincronizacion Google Sheets
        </h3>
        <p className="mb-3 text-[11px] font-bold text-slate-500">
          Pega la URL de tu Apps Script Web App para que todas las computadoras con esa URL compartan la misma informacion.
        </p>
        <div className="grid gap-2 md:grid-cols-[1fr_auto_auto]">
          <input value={googleSyncUrl} onChange={(event) => onGoogleSyncUrlChange(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold" placeholder="URL de Google Apps Script Web App" />
          <button onClick={() => void syncAction(onGooglePush, 'Datos enviados a Google Sheets.')} className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-black text-white hover:bg-indigo-700">
            Subir a Google
          </button>
          <button onClick={() => void syncAction(onGooglePull, 'Datos descargados desde Google Sheets.')} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white hover:bg-emerald-700">
            Bajar de Google
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-white/70 bg-white/70 p-4">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-black text-slate-800">
            <Plus className="h-4 w-4 text-indigo-600" />
            Alta manual de paciente
          </h3>
          <div className="grid gap-2">
            <input value={patientForm.name} onChange={(event) => setPatientForm({ ...patientForm, name: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold" placeholder="Nombre del paciente" />
            <input value={patientForm.fileNumber} onChange={(event) => setPatientForm({ ...patientForm, fileNumber: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold" placeholder="Numero de expediente" />
            <input value={patientForm.phone} onChange={(event) => setPatientForm({ ...patientForm, phone: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold" placeholder="Numero telefonico" />
            <input value={patientForm.curp} onChange={(event) => setPatientForm({ ...patientForm, curp: event.target.value.toUpperCase() })} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold uppercase" placeholder="CURP" />
            <button onClick={addPatient} className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-black text-white hover:bg-indigo-700">Guardar paciente</button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/70 bg-white/70 p-4">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-black text-slate-800">
            <Plus className="h-4 w-4 text-indigo-600" />
            Alta manual de psicologo/psiquiatra
          </h3>
          <div className="grid gap-2">
            <input value={doctorForm.name} onChange={(event) => setDoctorForm({ ...doctorForm, name: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold" placeholder="Nombre del especialista" />
            <select value={doctorForm.specialty} onChange={(event) => setDoctorForm({ ...doctorForm, specialty: event.target.value as Specialty })} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold">
              <option value="psicologo">Psicologo</option>
              <option value="psiquiatra">Psiquiatra</option>
            </select>
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 p-2">
              {doctorForm.schedule.map((entry) => (
                <div key={entry.day} className="grid grid-cols-[74px_1fr_1fr] items-center gap-1 text-[10px] font-black text-slate-600">
                  <label className="flex items-center gap-1">
                    <input type="checkbox" checked={entry.enabled} onChange={(event) => updateSchedule(entry.day, { enabled: event.target.checked })} />
                    {entry.day}
                  </label>
                  <input type="time" value={entry.start} disabled={!entry.enabled} onChange={(event) => updateSchedule(entry.day, { start: event.target.value })} className="rounded-lg border border-slate-200 px-2 py-1 disabled:opacity-40" />
                  <input type="time" value={entry.end} disabled={!entry.enabled} onChange={(event) => updateSchedule(entry.day, { end: event.target.value })} className="rounded-lg border border-slate-200 px-2 py-1 disabled:opacity-40" />
                </div>
              ))}
            </div>
            <button onClick={addDoctor} className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-black text-white hover:bg-indigo-700">Guardar especialista</button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/70 bg-white/70 p-4">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-black text-slate-800">
            <Plus className="h-4 w-4 text-indigo-600" />
            Crear cita
          </h3>
          <div className="grid gap-2">
            <select value={appointmentForm.patientId} onChange={(event) => setAppointmentForm({ ...appointmentForm, patientId: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold">
              {data.patients.map((patient) => (
                <option key={patient.id} value={patient.id}>{patient.name} - {patient.fileNumber}</option>
              ))}
            </select>
            <select value={appointmentForm.doctorId} onChange={(event) => setAppointmentForm({ ...appointmentForm, doctorId: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold">
              {data.doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>{doctor.name} ({doctor.specialty})</option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={appointmentForm.date} onChange={(event) => setAppointmentForm({ ...appointmentForm, date: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold" />
              <input type="time" value={appointmentForm.time} onChange={(event) => setAppointmentForm({ ...appointmentForm, time: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold" />
            </div>
            <select value={appointmentForm.appointmentType} onChange={(event) => setAppointmentForm({ ...appointmentForm, appointmentType: event.target.value as Appointment['appointmentType'] })} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold">
              <option value="individual">Individual</option>
              <option value="pareja">Pareja</option>
              <option value="pruebas">Pruebas</option>
            </select>
            <button onClick={addAppointment} className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-black text-white hover:bg-indigo-700">Guardar cita</button>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/70 bg-white/70 p-4">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-black text-slate-800">
            <Trash2 className="h-4 w-4 text-rose-600" />
            Eliminar pacientes
          </h3>
          <div className="max-h-48 space-y-1 overflow-y-auto">
            {data.patients.map((patient) => (
              <div key={patient.id} className="flex items-center justify-between rounded-xl bg-white p-2 text-[11px] font-bold text-slate-700">
                <span>{patient.name} - <span className="font-mono">{patient.fileNumber}</span></span>
                <button onClick={() => deletePatient(patient)} className="rounded-lg bg-rose-100 px-2 py-1 text-[10px] font-black text-rose-700 hover:bg-rose-200">Eliminar</button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/70 bg-white/70 p-4">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-black text-slate-800">
            <Trash2 className="h-4 w-4 text-rose-600" />
            Eliminar especialistas
          </h3>
          <div className="max-h-48 space-y-1 overflow-y-auto">
            {data.doctors.map((doctor) => (
              <div key={doctor.id} className="flex items-center justify-between rounded-xl bg-white p-2 text-[11px] font-bold text-slate-700">
                <span>{doctor.name} - <span className="capitalize">{doctor.specialty}</span></span>
                <button onClick={() => deleteDoctor(doctor)} className="rounded-lg bg-rose-100 px-2 py-1 text-[10px] font-black text-rose-700 hover:bg-rose-200">Eliminar</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/70 bg-white/70 p-4">
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-black text-slate-800">
          <Search className="h-4 w-4 text-indigo-600" />
          Buscar por paciente, especialidad, dia, semana o mes
        </h3>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
          <input value={searchFilters.query} onChange={(event) => onSearchChange({ ...searchFilters, query: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold" placeholder="Paciente o expediente" />
          <select value={searchFilters.specialty} onChange={(event) => onSearchChange({ ...searchFilters, specialty: event.target.value as SearchFilters['specialty'] })} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold">
            <option value="all">Todas las especialidades</option>
            <option value="psicologo">Psicologia</option>
            <option value="psiquiatra">Psiquiatria</option>
          </select>
          <select value={searchFilters.range} onChange={(event) => onSearchChange({ ...searchFilters, range: event.target.value as AppointmentViewRange })} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold">
            <option value="all">Todas las fechas</option>
            <option value="day">Dia</option>
            <option value="week">Semana</option>
            <option value="month">Mes</option>
          </select>
          <input type="date" value={searchFilters.date} onChange={(event) => onSearchChange({ ...searchFilters, date: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold" />
        </div>

        <div className="mt-3 max-h-52 overflow-y-auto rounded-xl border border-slate-100">
          {searchResults.length === 0 ? (
            <p className="p-4 text-center text-xs font-bold text-slate-400">No hay resultados con esos filtros.</p>
          ) : (
            <table className="w-full text-left text-[11px] font-bold">
              <thead className="sticky top-0 bg-slate-100 text-slate-500">
                <tr>
                  <th className="p-2">Fecha</th>
                  <th className="p-2">Hora</th>
                  <th className="p-2">Paciente</th>
                  <th className="p-2">Especialidad</th>
                  <th className="p-2">Especialista</th>
                  <th className="p-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.slice(0, 50).map((appointment) => (
                  <tr key={appointment.id} className="border-t border-slate-100">
                    <td className="p-2 font-mono">{appointment.date}</td>
                    <td className="p-2 font-mono">{appointment.time}</td>
                    <td className="p-2">{appointment.patientName}</td>
                    <td className="p-2 capitalize">{appointment.specialty}</td>
                    <td className="p-2">{appointment.doctorName}</td>
                    <td className="flex flex-wrap gap-1 p-2">
                      <a
                        href={whatsappUrl(appointment.patientPhone, `Hola ${appointment.patientName}, confirmamos tu cita del ${appointment.date} a las ${appointment.time} con ${appointment.doctorName}.`)}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg bg-emerald-100 px-2 py-1 text-[10px] font-black text-emerald-700"
                      >
                        <MessageCircle className="inline h-3 w-3" /> Confirmar
                      </a>
                      <a
                        href={whatsappUrl(appointment.patientPhone, `Hola ${appointment.patientName}, te recordamos tu cita del ${appointment.date} a las ${appointment.time} con ${appointment.doctorName}.`)}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg bg-indigo-100 px-2 py-1 text-[10px] font-black text-indigo-700"
                      >
                        Recordar
                      </a>
                      <button onClick={() => updateAppointmentStatus(appointment.id, 'canceled')} className="rounded-lg bg-rose-100 px-2 py-1 text-[10px] font-black text-rose-700">
                        Cancelar
                      </button>
                      <a
                        href={whatsappUrl(appointment.patientPhone, `Hola ${appointment.patientName}, tu cita del ${appointment.date} a las ${appointment.time} ha sido cancelada. Para reagendar, responde este mensaje.`)}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-700"
                      >
                        WhatsApp cancelacion
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
}
