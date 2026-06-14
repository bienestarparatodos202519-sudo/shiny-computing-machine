import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';
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
type SpecialtyFilter = 'all' | Specialty;

const toDateKey = (dateObj: Date) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isSameDayStr = (dateStr: string, dateObj: Date) => dateStr === toDateKey(dateObj);

const weekdayLetters = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];

export function CalendarView({ appointments, doctors, blockedDays }: CalendarViewProps) {
  const [view, setView] = useState<CalendarMode>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [expandedAppointmentId, setExpandedAppointmentId] = useState<string | null>(null);
  const [specialtyFilter, setSpecialtyFilter] = useState<SpecialtyFilter>('all');
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

  const monthName = currentDate.toLocaleString('es-ES', { month: 'long' });
  const year = currentDate.getFullYear();

  const monthDays = useMemo(() => {
    const activeYear = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayIndex = new Date(activeYear, month, 1).getDay();
    const totalDays = new Date(activeYear, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(activeYear, month, 0).getDate();
    const daysArray: { date: Date; isCurrentMonth: boolean; key: string }[] = [];
    const adjustedFirstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    for (let i = adjustedFirstDayIndex - 1; i >= 0; i -= 1) {
      const day = prevMonthTotalDays - i;
      daysArray.push({
        date: new Date(activeYear, month - 1, day),
        isCurrentMonth: false,
        key: `prev-${day}`,
      });
    }

    for (let i = 1; i <= totalDays; i += 1) {
      daysArray.push({
        date: new Date(activeYear, month, i),
        isCurrentMonth: true,
        key: `curr-${i}`,
      });
    }

    const totalCells = daysArray.length > 35 ? 42 : 35;
    const remainingDays = totalCells - daysArray.length;
    for (let i = 1; i <= remainingDays; i += 1) {
      daysArray.push({
        date: new Date(activeYear, month + 1, i),
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
    return filteredApps.filter((app) => isSameDayStr(app.date, dateObj)).sort((a, b) => a.time.localeCompare(b.time));
  };

  const getBlockedDayInfo = (dateObj: Date) => {
    return blockedDays.find((blockedDay) => blockedDay.date === toDateKey(dateObj));
  };

  const todayKey = toDateKey(new Date());

  return (
    <div className="rounded-3xl border border-white/60 bg-white/45 p-6 shadow-xl backdrop-blur-md" id="calendar-panel-box">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h3 className="flex items-center gap-2 text-base font-extrabold text-slate-800">
            <span className="flex items-center justify-center rounded-xl bg-indigo-600 p-2 text-white shadow-md shadow-indigo-200/50">
              <Calendar className="h-5 w-5" />
            </span>
            Calendario de Pacientes & Citas
          </h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Visualiza las consultas por mes, semana o dia. Haz clic en un paciente para ver y desplazar el expediente diario.
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
              {mode === 'month' ? 'Mes' : mode === 'week' ? 'Semana' : 'Dia'}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3.5 rounded-2xl border border-white/50 bg-white/35 p-4 backdrop-blur-sm md:grid-cols-12">
        <div className="col-span-1 flex items-center gap-2 md:col-span-5">
          <button
            onClick={handlePrev}
            className="cursor-pointer rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-xs transition-all hover:bg-slate-50"
            aria-label="Periodo anterior"
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
            className="cursor-pointer rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-xs transition-all hover:bg-slate-50"
            aria-label="Periodo siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <span className="ml-2 text-xs font-black capitalize text-slate-800">
            {view === 'month' && `${monthName} ${year}`}
            {view === 'week' &&
              `Semana del ${weekDays[0].getDate()} al ${weekDays[6].getDate()} de ${weekDays[6].toLocaleString('es-ES', {
                month: 'short',
              })}`}
            {view === 'day' &&
              currentDate.toLocaleString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
          </span>
        </div>

        <div className="col-span-1 md:col-span-4">
          <select
            value={specialtyFilter}
            onChange={(event) => {
              setSpecialtyFilter(event.target.value as SpecialtyFilter);
              setDoctorFilter('all');
              setExpandedAppointmentId(null);
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            aria-label="Filtrar por especialidad"
          >
            <option value="all">Todas las Especialidades</option>
            <option value="psiquiatra">Psiquiatria</option>
            <option value="psicologo">Psicologia</option>
          </select>
        </div>

        <div className="col-span-1 md:col-span-3">
          <select
            value={doctorFilter}
            onChange={(event) => {
              setDoctorFilter(event.target.value);
              setExpandedAppointmentId(null);
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            aria-label="Filtrar por especialista"
          >
            <option value="all">Todos los especialistas</option>
            {doctors
              .filter((doctor) => specialtyFilter === 'all' || doctor.specialty === specialtyFilter)
              .map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name}
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
              <div>Mie</div>
              <div>Jue</div>
              <div>Vie</div>
              <div>Sab</div>
              <div>Dom</div>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {monthDays.map(({ date, isCurrentMonth, key }) => {
                const dayApps = getAppointmentsForDay(date);
                const blockInfo = getBlockedDayInfo(date);
                const isToday = isSameDayStr(todayKey, date);

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

                        return (
                          <button
                            type="button"
                            key={app.id}
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleAccordion(app.id);
                            }}
                            className={`block w-full cursor-pointer truncate rounded-md px-1.5 py-0.5 text-left text-[9px] font-bold transition-all ${
                              isCanceled
                                ? 'bg-slate-100 text-slate-400 line-through'
                                : app.specialty === 'psicologo'
                                  ? 'border border-purple-100/50 bg-purple-50 text-purple-800 hover:bg-purple-100'
                                  : 'border border-cyan-100/50 bg-cyan-50 text-cyan-800 hover:bg-cyan-100'
                            }`}
                            title={`${app.time} hrs - ${app.patientName}`}
                          >
                            <span className="font-mono font-medium">{app.time}</span> {app.patientName}
                          </button>
                        );
                      })}

                      {dayApps.length === 0 && blockInfo && (
                        <div className="text-[8px] font-bold italic leading-tight text-rose-500">{blockInfo.description.substring(0, 15)}...</div>
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
              const isToday = isSameDayStr(todayKey, date);

              return (
                <div
                  key={toDateKey(date)}
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
                      {blockInfo.description}
                    </div>
                  )}

                  <div className="max-h-[180px] grow space-y-1.5 overflow-y-auto pr-1">
                    {dayApps.map((app) => {
                      const isCanceled = app.status === 'canceled';

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
                          }`}
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
          <div className="min-h-[300px] rounded-2xl border border-slate-100 bg-white/90 p-4 animate-in fade-in duration-200">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-black uppercase tracking-widest text-slate-800">Agenda del dia ({getAppointmentsForDay(currentDate).length} Pacientes)</span>
              {getBlockedDayInfo(currentDate) && (
                <div className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-rose-800">
                  <Info className="h-3.5 w-3.5 text-rose-700" />
                  <span>Dia Cerrado: {getBlockedDayInfo(currentDate)?.description}</span>
                </div>
              )}
            </div>

            <div className="max-h-[400px] space-y-2 overflow-y-auto pr-2">
              {getAppointmentsForDay(currentDate).map((app) => {
                const isCanceled = app.status === 'canceled';

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
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div
                        className={`shrink-0 rounded-xl p-2.5 ${
                          isCanceled ? 'bg-slate-200 text-slate-400' : app.specialty === 'psicologo' ? 'bg-purple-100 text-purple-700' : 'bg-cyan-100 text-cyan-700'
                        }`}
                      >
                        <Clock className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono text-xs font-black ${isCanceled ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{app.time} hrs</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[8.5px] font-extrabold ${
                              isCanceled ? 'bg-slate-200 text-slate-500' : app.specialty === 'psicologo' ? 'bg-purple-100 text-purple-800' : 'bg-cyan-100 text-cyan-800'
                            }`}
                          >
                            {app.specialty === 'psicologo' ? 'Psicologia' : 'Psiquiatria'}
                          </span>
                        </div>
                        <h4 className={`mt-1 text-xs font-black ${isCanceled ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{app.patientName}</h4>
                        <p className="mt-0.5 text-[10px] font-semibold text-slate-500">
                          Expediente: <span className="font-mono font-bold text-slate-700">{app.patientFileNumber}</span> | Medico:{' '}
                          <span className="font-bold">{app.doctorName}</span>
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <span
                        className={`inline-block rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${
                          isCanceled ? 'bg-slate-200 text-slate-500' : 'border border-emerald-200 bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isCanceled ? 'Cancelada' : 'Confirmada'}
                      </span>
                    </div>
                  </button>
                );
              })}

              {getAppointmentsForDay(currentDate).length === 0 && (
                <div className="rounded-2xl border-2 border-dashed border-slate-100 py-12 text-center">
                  <BadgeHelp className="mx-auto mb-2 h-8 w-8 text-slate-400" />
                  <p className="text-xs font-bold text-slate-500">No hay consultas para hoy.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {expandedAppointmentId && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ type: 'spring', duration: 0.35 }}
            className="overflow-hidden border-t-2 border-dashed border-indigo-100 pt-4"
          >
            {(() => {
              const app = appointments.find((appointment) => appointment.id === expandedAppointmentId);
              if (!app) return null;
              const isCanceled = app.status === 'canceled';

              return (
                <div
                  className={`flex flex-col items-start gap-4 rounded-3xl border p-4 md:flex-row ${
                    isCanceled
                      ? 'border-slate-200 bg-slate-50'
                      : app.specialty === 'psicologo'
                        ? 'border-purple-200/50 bg-purple-100/20'
                        : 'border-cyan-200/50 bg-cyan-100/20'
                  }`}
                >
                  <div className="w-full grow space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Expediente Medico de Consulta</span>
                      <span
                        className={`rounded-full border bg-white/80 px-2 py-0.5 font-mono text-[9px] font-black uppercase ${
                          app.specialty === 'psicologo' ? 'border-purple-200 text-purple-800' : 'border-cyan-200 text-cyan-800'
                        }`}
                      >
                        {app.patientFileNumber}
                      </span>
                    </div>

                    <h4 className="flex flex-wrap items-center gap-1.5 text-sm font-black text-slate-800">
                      <User className="h-4 w-4 text-slate-600" />
                      {app.patientName}
                    </h4>

                    <div className="grid grid-cols-1 gap-2 pt-1 text-xs sm:grid-cols-2">
                      <div className="flex items-center gap-2 rounded-xl border border-white/50 bg-white/80 p-2.5">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                        <div>
                          <span className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Telefono de Contacto</span>
                          <span className="select-all font-mono font-bold text-slate-800">{app.patientPhone}</span>
                          {app.patientPhone && app.patientPhone !== '5500000000' && (
                            <a
                              href={`https://wa.me/${app.patientPhone.replace(/\+/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-0.5 block text-[9px] font-black text-emerald-600 hover:underline"
                              onClick={(event) => event.stopPropagation()}
                            >
                              Contactar por WhatsApp
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 rounded-xl border border-white/50 bg-white/80 p-2.5">
                        <FileText className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                        <div>
                          <span className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400">CURP opcional</span>
                          <span className="font-mono font-black uppercase tracking-tight text-slate-800">{app.patientCurp || 'Sin CURP Registrada'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-full shrink-0 space-y-2 rounded-2xl border border-white/80 bg-white/60 p-3 md:w-64">
                    <span className="block border-b border-slate-100 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Detalles de la Cita</span>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between py-0.5">
                        <span className="font-bold text-slate-400">Fecha programada:</span>
                        <span className="font-mono font-bold text-indigo-950">{app.date}</span>
                      </div>

                      <div className="flex items-center justify-between py-0.5">
                        <span className="font-bold text-slate-400">Horario de cita:</span>
                        <span className="font-mono font-bold text-indigo-950">{app.time} hrs</span>
                      </div>

                      <div className="flex items-center justify-between py-0.5">
                        <span className="font-bold text-slate-400">Especialista:</span>
                        <span className="max-w-[130px] truncate font-black text-slate-800" title={app.doctorName}>
                          {app.doctorName}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-0.5">
                        <span className="font-bold text-slate-400">Especialidad:</span>
                        <span className="font-bold capitalize text-slate-700">{app.specialty === 'psicologo' ? 'Psicologo' : 'Psiquiatra'}</span>
                      </div>

                      <div className="flex items-center justify-between py-0.5">
                        <span className="font-bold text-slate-400">Sesion:</span>
                        <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-slate-700">
                          {app.appointmentType === 'pareja' ? 'Pareja' : app.appointmentType === 'pruebas' ? 'Pruebas' : 'Individual'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                        <span className="font-bold text-slate-400">Estatus actual:</span>
                        <span
                          className={`rounded-sm px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                            isCanceled ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isCanceled ? 'Cancelada' : 'Confirmada'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedAppointmentId(null)}
                      className="mt-3 w-full cursor-pointer rounded-lg bg-slate-200 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-700 transition-all hover:bg-slate-300"
                    >
                      Cerrar expediente
                    </button>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-5 flex flex-col gap-2 rounded-2xl border border-white/50 bg-white/35 p-3 text-[11px] font-bold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <span className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
          Haz clic en cualquier cita para abrir el expediente rapido.
        </span>
        <span className="flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-emerald-500" />
          Los filtros actualizan todas las vistas del calendario.
        </span>
      </div>
    </div>
  );
}
