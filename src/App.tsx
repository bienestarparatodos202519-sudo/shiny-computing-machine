import { useEffect, useMemo, useState } from 'react';
import { CalendarView } from './components/CalendarView';
import { DataManagementPanel } from './components/DataManagementPanel';
import type { Appointment, AppointmentViewRange, ClinicData, Specialty } from './types';
import { downloadExcelTemplate, exportClinicData, importClinicData } from './utils/excel';
import { loadGoogleSyncUrl, pullFromGoogleSheets, pushToGoogleSheets, saveGoogleSyncUrl } from './utils/googleSheets';
import { defaultClinicData, loadClinicData, normalizeClinicData, resetClinicData, saveClinicData } from './utils/storage';

interface SearchFilters {
  query: string;
  specialty: 'all' | Specialty;
  range: AppointmentViewRange;
  date: string;
}

const todayKey = () => new Date().toISOString().slice(0, 10);

const isWithinRange = (date: string, selectedDate: string, range: AppointmentViewRange) => {
  if (range === 'all') return true;

  const appointmentDate = new Date(`${date}T00:00:00`);
  const filterDate = new Date(`${selectedDate}T00:00:00`);

  if (range === 'day') {
    return date === selectedDate;
  }

  if (range === 'month') {
    return appointmentDate.getFullYear() === filterDate.getFullYear() && appointmentDate.getMonth() === filterDate.getMonth();
  }

  const startOfWeek = new Date(filterDate);
  const day = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - day + (day === 0 ? -6 : 1));
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  return appointmentDate >= startOfWeek && appointmentDate <= endOfWeek;
};

const filterAppointments = (appointments: Appointment[], filters: SearchFilters) => {
  const query = filters.query.trim().toLowerCase();

  return appointments
    .filter((appointment) => {
      const patientMatch =
        !query ||
        appointment.patientName.toLowerCase().includes(query) ||
        appointment.patientFileNumber.toLowerCase().includes(query) ||
        appointment.patientPhone.toLowerCase().includes(query) ||
        appointment.doctorName.toLowerCase().includes(query);

      const specialtyMatch = filters.specialty === 'all' || appointment.specialty === filters.specialty;
      const rangeMatch = isWithinRange(appointment.date, filters.date, filters.range);
      return patientMatch && specialtyMatch && rangeMatch;
    })
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
};

const mergeByKey = <T,>(current: T[], incoming: T[] | undefined, getKey: (item: T) => string) => {
  if (!incoming?.length) return current;
  const map = new Map(current.map((item) => [getKey(item), item]));
  incoming.forEach((item) => {
    map.set(getKey(item), item);
  });
  return Array.from(map.values());
};

function App() {
  const [data, setData] = useState<ClinicData>(() => loadClinicData());
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    specialty: 'all',
    range: 'all',
    date: todayKey(),
  });
  const [googleSyncUrl, setGoogleSyncUrl] = useState(() => loadGoogleSyncUrl());

  useEffect(() => {
    saveClinicData(data);
  }, [data]);

  const confirmedAppointments = data.appointments.filter((app) => app.status === 'confirmed');
  const psychologyAppointments = data.appointments.filter((app) => app.specialty === 'psicologo');
  const searchResults = useMemo(() => filterAppointments(data.appointments, searchFilters), [data.appointments, searchFilters]);

  const handleImportExcel = async (file: File) => {
    const imported = await importClinicData(file);
    setData((current) => ({
      patients: mergeByKey(current.patients, imported.patients, (patient) => patient.fileNumber || patient.id),
      doctors: mergeByKey(current.doctors, imported.doctors, (doctor) => `${doctor.name}-${doctor.specialty}`),
      appointments: mergeByKey(current.appointments, imported.appointments, (appointment) => `${appointment.date}-${appointment.time}-${appointment.patientFileNumber}-${appointment.doctorName}`),
      blockedDays: mergeByKey(current.blockedDays, imported.blockedDays, (blockedDay) => blockedDay.date),
    }));
  };

  const handleResetData = () => {
    resetClinicData();
    setData(defaultClinicData);
  };

  const handleGoogleSyncUrlChange = (url: string) => {
    setGoogleSyncUrl(url);
    saveGoogleSyncUrl(url);
  };

  const handleGooglePush = async () => {
    await pushToGoogleSheets(googleSyncUrl, data);
  };

  const handleGooglePull = async () => {
    const syncedData = await pullFromGoogleSheets(googleSyncUrl);
    setData(normalizeClinicData(syncedData));
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,_#dbeafe,_transparent_34%),radial-gradient(circle_at_top_right,_#f3e8ff,_transparent_30%),linear-gradient(135deg,_#f8fafc,_#e0e7ff)] px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="mb-3 inline-flex rounded-full border border-indigo-200 bg-white/70 px-3 py-1 text-[11px] font-black uppercase tracking-[0.28em] text-indigo-700 shadow-sm">
              Agenda Clinica
            </span>
            <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Gestion de pacientes, citas y disponibilidad medica
            </h1>
            <p className="mt-4 text-sm font-semibold leading-6 text-slate-600 sm:text-base">
              Captura pacientes y especialistas, importa o exporta Excel, busca por fechas y consulta el calendario por mes, semana o dia.
            </p>
          </div>

          <div className="grid grid-cols-4 gap-3 rounded-3xl border border-white/60 bg-white/45 p-3 shadow-xl backdrop-blur-md">
            <div className="rounded-2xl bg-white/80 p-3 text-center">
              <span className="block text-2xl font-black text-slate-800">{data.patients.length}</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Pacientes</span>
            </div>
            <div className="rounded-2xl bg-white/80 p-3 text-center">
              <span className="block text-2xl font-black text-indigo-700">{confirmedAppointments.length}</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Confirmadas</span>
            </div>
            <div className="rounded-2xl bg-white/80 p-3 text-center">
              <span className="block text-2xl font-black text-purple-700">{psychologyAppointments.length}</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Psicologia</span>
            </div>
            <div className="rounded-2xl bg-white/80 p-3 text-center">
              <span className="block text-2xl font-black text-rose-700">{data.blockedDays.length}</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Bloqueos</span>
            </div>
          </div>
        </header>

        <DataManagementPanel
          data={data}
          searchFilters={searchFilters}
          searchResults={searchResults}
          onSearchChange={setSearchFilters}
          onDataChange={setData}
          onImportExcel={handleImportExcel}
          onExportExcel={() => exportClinicData(data)}
          onDownloadTemplate={downloadExcelTemplate}
          onResetData={handleResetData}
          googleSyncUrl={googleSyncUrl}
          onGoogleSyncUrlChange={handleGoogleSyncUrlChange}
          onGooglePush={handleGooglePush}
          onGooglePull={handleGooglePull}
        />

        <CalendarView appointments={searchResults} doctors={data.doctors} blockedDays={data.blockedDays} />
      </section>
    </main>
  );
}

export default App;
