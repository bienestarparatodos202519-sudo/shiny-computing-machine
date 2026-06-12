import { CalendarView } from './components/CalendarView';
import { appointments, blockedDays, doctors } from './data/sampleData';

const confirmedAppointments = appointments.filter((app) => app.status === 'confirmed');
const psychologyAppointments = appointments.filter((app) => app.specialty === 'psicologo');

function App() {
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
              Consulta el calendario por mes, semana o dia; filtra por especialidad o especialista; y abre el expediente rapido de cada paciente.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 rounded-3xl border border-white/60 bg-white/45 p-3 shadow-xl backdrop-blur-md">
            <div className="rounded-2xl bg-white/80 p-3 text-center">
              <span className="block text-2xl font-black text-indigo-700">{confirmedAppointments.length}</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Confirmadas</span>
            </div>
            <div className="rounded-2xl bg-white/80 p-3 text-center">
              <span className="block text-2xl font-black text-purple-700">{psychologyAppointments.length}</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Psicologia</span>
            </div>
            <div className="rounded-2xl bg-white/80 p-3 text-center">
              <span className="block text-2xl font-black text-rose-700">{blockedDays.length}</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Bloqueos</span>
            </div>
          </div>
        </header>

        <CalendarView appointments={appointments} doctors={doctors} blockedDays={blockedDays} />
      </section>
    </main>
  );
}

export default App;
