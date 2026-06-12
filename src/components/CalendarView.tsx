import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  BadgeHelp,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Info,
  Phone,
  Sparkles,
  User,
} from 'lucide-react';
import type { Appointment, BlockedDay, Doctor, Specialty } from '../types';

interface CalendarViewProps {
  appointments: Appointment[];
  doctors: Doctor[];
  blockedDays: BlockedDay[];
}

type CalendarMode = 'month' | 'week' | 'day';
type FilterValue = Specialty | 'all';

const toDateString = (dateObj: Date) => {
  const yearStr = String(dateObj.getFullYear());
  const monthStr = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dayStr = String(dateObj.getDate()).padStart(2, '0');
  return `${yearStr}-${monthStr}-${dayStr}`;
};

const isSpecialty = (value: string): value is Specialty => value === 'psiquiatra' || value === 'psicologo';

export function CalendarView({ appointments, doctors, blockedDays }: CalendarViewProps) {
  const [view, setView] = useState<CalendarMode>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [expandedAppointmentId, setExpandedAppointmentId] = useState<string | null>(null);
  const [specialtyFilter, setSpecialtyFilter] = useState<FilterValue>('all');
  const [doctorFilter, setDoctorFilter] = useState<string>('all');

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
    setExpandedAppointmentId(null);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
    setExpandedAppointmentId(null);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setExpandedAppointmentId(null);
  };

  const filteredApps = useMemo(() => {
    return appointments.filter((app) => {
      if (specialtyFilter !== 'all' && app.specialty !== specialtyFilter) {
        return false;
      }
      if (doctorFilter !== 'all' && app.doctorId !== doctorFilter) {
        return false;
      }
      return true;
    });
  }, [appointments, specialtyFilter, doctorFilter]);

  const selectedAppointment = useMemo(() => {
    return filteredApps.find((app) => app.id === expandedAppointmentId) ?? null;
  }, [expandedAppointmentId, filteredApps]);

  const availableDoctors = useMemo(() => {
    return doctors.filter((doctor) => specialtyFilter === 'all' || doctor.specialty === specialtyFilter);
  }, [doctors, specialtyFilter]);

  const monthName = currentDate.toLocaleString('es-ES', { month: 'long' });
  const year = currentDate.getFullYear();

  const isSameDayStr = (dateStr: string, dateObj: Date) => dateStr === toDateString(dateObj);

  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const daysArray: { date: Date; isCurrentMonth: boolean; key: string }[] = [];
    const adjustedFirstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    for (let i = adjustedFirstDayIndex - 1; i >= 0; i -= 1) {
      const day = prevMonthTotalDays - i;
      daysArray.push({
        date: new Date(year, month - 1, day),
        isCurrentMonth: false,
        key: `prev-${day}`,
      });
    }

    for (let i = 1; i <= totalDays; i += 1) {
      daysArray.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
        key: `curr-${i}`,
      });
    }

    const totalCells = daysArray.length > 35 ? 42 : 35;
    const remainingDays = totalCells - daysArray.length;
    for (let i = 1; i <= remainingDays; i += 1) {
      daysArray.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
        key: `next-${i}`,
      });
    }

    return daysArray;
  }, [currentDate]);

  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    const daysArray: Date[] = [];
    for (let i = 0; i < 7; i += 1) {
      const nextDate = new Date(startOfWeek);
      nextDate.setDate(startOfWeek.getDate() + i);
      daysArray.push(nextDate);
    }
    return daysArray;
  }, [currentDate]);

  const toggleAccordion = (id: string) => {
    setExpandedAppointmentId((prev) => (prev === id ? null : id));
  };

  const getAppointmentsForDay = (dateObj: Date) => {
    return filteredApps
      .filter((app) => isSameDayStr(app.date, dateObj))
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  const getBlockedDayInfo = (dateObj: Date) => {
    return blockedDays.find((blockedDay) => blockedDay.date === toDateString(dateObj));
  };

  const todayStr = toDateString(new Date());

  const statusCopy: Record<Appointment['status'], string> = {
    scheduled: 'Programada',
    completed: 'Completada',
    canceled: 'Cancelada',
  };

  return (
    <div className="rounded-3xl border border-white/60 bg-white/45 p-4 shadow-xl shadow-slate-200/60 backdrop-blur-md sm:p-6" id="calendar-panel-box">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h3 className="flex items-center gap-2 text-base font-extrabold text-slate-800">
            <span className="flex items-center justify-center rounded-xl bg-indigo-600 p-2 text-white shadow-md shadow-indigo-200">
              <Calendar className="h-5 w-5" />
            </span>
            Calendario de Pacientes & Citas
          </h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Visualiza las consultas por mes, semana o día. Haz clic en un paciente para ver y desplazar el expediente diario.
          </p>
        </div>

        <div className="flex w-max shrink-0 select-none items-center self-end rounded-2xl border border-slate-200 bg-slate-100 p-1 md:self-auto">
          {(['month', 'week', 'day'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => {
                setView(mode);
                setExpandedAppointmentId(null);
              }}
              className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-black transition-all ${
                view === mode ? 'bg-white text-indigo-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {mode === 'month' ? 'Mes' : mode === 'week' ? 'Semana' : 'Día'}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3.5 rounded-2xl border border-white/50 bg-white/35 p-4 backdrop-blur-xs md:grid-cols-12">
        <div className="col-span-1 flex items-center gap-2 md:col-span-5">
          <button
            onClick={handlePrev}
            aria-label="Ir al periodo anterior"
            className="cursor-pointer rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-xs transition-all hover:bg-slate-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            onClick={handleToday}
            className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-xs transition-all hover:bg-slate-50"
          >
            Hoy
          </button>

          <button
            onClick={handleNext}
            aria-label="Ir al periodo siguiente"
            className="cursor-pointer rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-xs transition-all hover:bg-slate-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <span className="ml-2 text-xs font-black capitalize text-slate-800">
            {view === 'month' && `${monthName} ${year}`}
            {view === 'week' &&
              `Semana del ${weekDays[0].getDate()} al ${weekDays[6].getDate()} de ${weekDays[6].toLocaleString('es-ES', { month: 'short' })}`}
            {view === 'day' &&
              currentDate.toLocaleString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>

        <div className="col-span-1 md:col-span-4">
          <select
            value={specialtyFilter}
            onChange={(event) => {
              const nextValue = event.target.value;
              setSpecialtyFilter(isSpecialty(nextValue) ? nextValue : 'all');
              setDoctorFilter('all');
              setExpandedAppointmentId(null);
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-hidden"
          >
            <option value="all">🔍 Todas las Especialidades</option>
            <option value="psiquiatra">🧠 Psiquiatría</option>
            <option value="psicologo">💬 Psicología</option>
          </select>
        </div>

        <div className="col-span-1 md:col-span-3">
          <select
            value={doctorFilter}
            onChange={(event) => {
              setDoctorFilter(event.target.value);
              setExpandedAppointmentId(null);
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-hidden"
          >
            <option value="all">👤 Todos los especialistas</option>
            {availableDoctors.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden">
        {view === 'month' && (
          <div className="animate-in fade-in duration-200">
            <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <div>Lun</div>
              <div>Mar</div>
              <div>Mié</div>
              <div>Jue</div>
              <div>Vie</div>
              <div>Sáb</div>
              <div>Dom</div>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {monthDays.map(({ date, isCurrentMonth, key }) => {
                const dayApps = getAppointmentsForDay(date);
                const blockInfo = getBlockedDayInfo(date);
                const isToday = isSameDayStr(todayStr, date);

                return (
                  <div
                    key={key}
                    className={`flex min-h-[90px] flex-col justify-between rounded-2xl border p-1.5 transition-all ${
                      isCurrentMonth ? 'border-slate-100 bg-white/80' : 'border-slate-100/50 bg-slate-50/50 opacity-45'
                    } ${isToday ? 'bg-indigo-50/30 ring-2 ring-indigo-500 ring-offset-1' : ''}`}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span
                        className={`text-[11px] font-black ${
                          isToday
                            ? 'flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 font-extrabold text-indigo-700'
                            : 'text-slate-600'
                        }`}
                      >
                        {date.getDate()}
                      </span>
                      {blockInfo && (
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" title={`Bloqueo: ${blockInfo.description}`} />
                      )}
                    </div>

                    <div className="max-h-[70px] grow space-y-1 overflow-y-auto pr-0.5">
                      {dayApps.map((app) => {
                        const isCanceled = app.status === 'canceled';
                        const isSelected = app.id === expandedAppointmentId;

                        return (
                          <button
                            type="button"
                            key={app.id}
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleAccordion(app.id);
                            }}
                            className={`block w-full cursor-pointer truncate rounded-md border px-1.5 py-0.5 text-left text-[9px] font-bold transition-all ${
                              isCanceled
                                ? 'border-slate-100 bg-slate-100 text-slate-400 line-through'
                                : app.specialty === 'psicologo'
                                  ? 'border-purple-100/50 bg-purple-50 text-purple-800 hover:bg-purple-100'
                                  : 'border-cyan-100/50 bg-cyan-50 text-cyan-800 hover:bg-cyan-100'
                            } ${isSelected ? 'ring-2 ring-indigo-400' : ''}`}
                            title={`${app.time} hrs - ${app.patientName}`}
                          >
                            <span className="font-mono font-medium">{app.time}</span> {app.patientName}
                          </button>
                        );
                      })}

                      {dayApps.length === 0 && blockInfo && (
                        <div className="text-[8px] font-bold italic leading-tight text-rose-500">🚫 {blockInfo.description.substring(0, 15)}...</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === 'week' && (
          <div className="grid grid-cols-1 gap-3 animate-in fade-in duration-200 sm:grid-cols-7">
            {weekDays.map((date, idx) => {
              const dayApps = getAppointmentsForDay(date);
              const blockInfo = getBlockedDayInfo(date);
              const isToday = isSameDayStr(todayStr, date);
              const weekdayLetters = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

              return (
                <div
                  key={toDateString(date)}
                  className={`flex min-h-[220px] flex-col rounded-2xl border bg-white/80 p-3 transition-all ${
                    isToday ? 'border-indigo-200 bg-indigo-50/20 ring-2 ring-indigo-500' : 'border-slate-100'
                  }`}
                >
                  <div className="mb-2 border-b border-slate-100 pb-2 text-center">
                    <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">{weekdayLetters[idx]}</span>
                    <span className={`text-base font-black ${isToday ? 'font-extrabold text-indigo-600' : 'text-slate-700'}`}>{date.getDate()}</span>
                  </div>

                  {blockInfo && (
                    <div className="mb-2 rounded-lg border border-rose-100 bg-rose-50 p-1 px-1.5 text-center text-[9px] font-extrabold leading-tight text-rose-700">
                      🚫 {blockInfo.description}
                    </div>
                  )}

                  <div className="max-h-[180px] grow space-y-1.5 overflow-y-auto pr-1">
                    {dayApps.map((app) => {
                      const isCanceled = app.status === 'canceled';
                      const isSelected = app.id === expandedAppointmentId;

                      return (
                        <button
                          type="button"
                          key={app.id}
                          onClick={() => toggleAccordion(app.id)}
                          className={`flex w-full cursor-pointer flex-col justify-between rounded-xl border p-2 text-left text-[10px] font-extrabold transition-all ${
                            isCanceled
                              ? 'border-slate-200 bg-slate-100 text-slate-400 line-through'
                              : app.specialty === 'psicologo'
                                ? 'border-purple-100/40 bg-purple-50 text-purple-900 hover:bg-purple-100'
                                : 'border-cyan-100/40 bg-cyan-50 text-cyan-900 hover:bg-cyan-100'
                          } ${isSelected ? 'ring-2 ring-indigo-400' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[9px]">{app.time} hrs</span>
                            <span className={`rounded-full px-1.5 text-[8px] font-bold ${app.specialty === 'psicologo' ? 'bg-purple-200/50' : 'bg-cyan-200/50'}`}>
                              {app.specialty === 'psicologo' ? 'PSI' : 'MED'}
                            </span>
                          </div>
                          <span className="mt-1 block truncate leading-tight">{app.patientName}</span>
                          <span className="mt-0.5 block truncate text-[8px] font-bold text-slate-400">Exp: {app.patientFileNumber}</span>
                        </button>
                      );
                    })}

                    {dayApps.length === 0 && !blockInfo && <div className="py-6 text-center text-[10px] italic text-slate-400">No hay citas</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {view === 'day' && (
          <div className="min-h-[300px] animate-in fade-in rounded-2xl border border-slate-100 bg-white/90 p-4 duration-200">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-black uppercase tracking-widest text-slate-800">
                Agenda del día ({getAppointmentsForDay(currentDate).length} Pacientes)
              </span>
              {getBlockedDayInfo(currentDate) && (
                <div className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-rose-800">
                  <Info className="h-3.5 w-3.5 text-rose-700" />
                  <span>Día Cerrado: {getBlockedDayInfo(currentDate)?.description}</span>
                </div>
              )}
            </div>

            <div className="max-h-[400px] space-y-2 overflow-y-auto pr-2">
              {getAppointmentsForDay(currentDate).map((app) => {
                const isCanceled = app.status === 'canceled';
                const isSelected = app.id === expandedAppointmentId;

                return (
                  <button
                    type="button"
                    key={app.id}
                    onClick={() => toggleAccordion(app.id)}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-2xl border p-3.5 text-left transition-all hover:shadow-xs ${
                      isCanceled
                        ? 'border-slate-100 bg-slate-50 opacity-60'
                        : app.specialty === 'psicologo'
                          ? 'border-purple-100/50 bg-purple-50/40 text-purple-950 hover:bg-purple-50'
                          : 'border-cyan-100/50 bg-cyan-50/40 text-cyan-950 hover:bg-cyan-50'
                    } ${isSelected ? 'ring-2 ring-indigo-500' : ''}`}
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className={`shrink-0 rounded-xl p-2.5 ${app.specialty === 'psicologo' ? 'bg-purple-100 text-purple-700' : 'bg-cyan-100 text-cyan-700'}`}>
                        <User className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black">{app.patientName}</p>
                        <p className="truncate text-[11px] font-bold text-slate-500">
                          {app.doctorName} · Exp: {app.patientFileNumber}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-sm font-black">{app.time}</p>
                      <p className="text-[10px] font-bold text-slate-400">{statusCopy[app.status]}</p>
                    </div>
                  </button>
                );
              })}

              {getAppointmentsForDay(currentDate).length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 py-12 text-center text-sm font-bold text-slate-400">
                  No hay citas para este día.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {selectedAppointment && (
          <motion.section
            key={selectedAppointment.id}
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="mt-4 overflow-hidden"
          >
            <div className="rounded-3xl border border-indigo-100 bg-white/90 p-4 shadow-lg shadow-indigo-100/60">
              <div className="mb-4 flex flex-col justify-between gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-start">
                <div>
                  <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-indigo-500">
                    <Sparkles className="h-3.5 w-3.5" />
                    Expediente diario
                  </p>
                  <h4 className="mt-1 text-lg font-black text-slate-900">{selectedAppointment.patientName}</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedAppointmentId(null)}
                  className="w-max cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-600 hover:bg-slate-100"
                >
                  Cerrar
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <DetailItem icon={<Clock className="h-4 w-4" />} label="Horario" value={`${selectedAppointment.date} · ${selectedAppointment.time} hrs`} />
                <DetailItem icon={<User className="h-4 w-4" />} label="Especialista" value={selectedAppointment.doctorName} />
                <DetailItem icon={<Phone className="h-4 w-4" />} label="Telefono" value={selectedAppointment.patientPhone} />
                <DetailItem icon={<FileText className="h-4 w-4" />} label="Expediente" value={selectedAppointment.patientFileNumber} />
              </div>

              <div className="mt-3 grid gap-3 lg:grid-cols-3">
                <DetailItem icon={<BadgeHelp className="h-4 w-4" />} label="Motivo" value={selectedAppointment.reason} large />
                <DetailItem icon={<Activity className="h-4 w-4" />} label="Estado" value={statusCopy[selectedAppointment.status]} large />
                <DetailItem icon={<FileText className="h-4 w-4" />} label="Notas" value={selectedAppointment.notes} large />
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}

interface DetailItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  large?: boolean;
}

function DetailItem({ icon, label, value, large = false }: DetailItemProps) {
  return (
    <div className={`rounded-2xl border border-slate-100 bg-slate-50/80 p-3 ${large ? 'min-h-24' : ''}`}>
      <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
        <span className="text-indigo-500">{icon}</span>
        {label}
      </div>
      <p className="text-sm font-extrabold leading-snug text-slate-800">{value}</p>
    </div>
  );
}
