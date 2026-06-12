import { Download, FileSpreadsheet, Plus, RotateCcw, Search, Upload } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Appointment, AppointmentViewRange, ClinicData, Doctor, Patient, Specialty } from '../types';

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
}

const workDayOptions = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const emptyPatient = {
  name: '',
  fileNumber: '',
  phone: '',
  curp: '',
};

const emptyDoctor = {
  name: '',
  specialty: 'psicologo' as Specialty,
  workDays: ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'],
  workStart: '09:00',
  workEnd: '17:00',
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

  const selectedPatient = useMemo(() => data.patients.find((patient) => patient.id === appointmentForm.patientId), [appointmentForm.patientId, data.patients]);
  const selectedDoctor = useMemo(() => data.doctors.find((doctor) => doctor.id === appointmentForm.doctorId), [appointmentForm.doctorId, data.doctors]);

  const addPatient = () => {
    if (!patientForm.name || !patientForm.fileNumber) {
      setMessage('Captura nombre y expediente del paciente.');
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
  };

  const addDoctor = () => {
    if (!doctorForm.name || doctorForm.workDays.length === 0) {
      setMessage('Captura nombre y al menos un dia de jornada.');
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
  };

  const addAppointment = () => {
    if (!selectedPatient || !selectedDoctor) {
      setMessage('Selecciona paciente y especialista para crear la cita.');
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
  };

  const toggleWorkDay = (day: string) => {
    setDoctorForm((current) => ({
      ...current,
      workDays: current.workDays.includes(day) ? current.workDays.filter((item) => item !== day) : [...current.workDays, day],
    }));
  };

  const handleImport = async (file?: File) => {
    if (!file) return;
    await onImportExcel(file);
    setMessage('Carga masiva importada y guardada.');
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

      <div className="mb-5 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-3 text-xs font-bold text-indigo-900">
        {message} Para usar la misma informacion en varias computadoras: descarga el Excel y cargalo en la otra computadora.
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
            <div className="flex flex-wrap gap-1">
              {workDayOptions.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleWorkDay(day)}
                  className={`rounded-lg px-2 py-1 text-[10px] font-black ${doctorForm.workDays.includes(day) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="time" value={doctorForm.workStart} onChange={(event) => setDoctorForm({ ...doctorForm, workStart: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold" />
              <input type="time" value={doctorForm.workEnd} onChange={(event) => setDoctorForm({ ...doctorForm, workEnd: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold" />
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
