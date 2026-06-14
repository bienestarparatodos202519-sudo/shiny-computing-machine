import { useEffect, useMemo, useState } from "react";
import { useGame } from "../context/GameContext";
import type { WorkLogDraft } from "../types";
import {
  clearActiveWorkLog,
  loadActiveWorkLog,
  saveActiveWorkLog,
} from "../lib/storage";

export function DailyWorkLog() {
  const { workerName, optimizedRoute, routeDistanceKm, sendWorkLog } = useGame();
  const [activeLog, setActiveLog] = useState<WorkLogDraft | null>(loadActiveWorkLog);
  const [selectedStops, setSelectedStops] = useState<string[]>(
    () => loadActiveWorkLog()?.visitedStops ?? [],
  );
  const [comments, setComments] = useState(() => loadActiveWorkLog()?.comments ?? "");
  const [now, setNow] = useState(Date.now());
  const isActive = Boolean(activeLog);

  useEffect(() => {
    if (!activeLog) return undefined;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [activeLog]);

  useEffect(() => {
    if (!activeLog) return;
    saveActiveWorkLog({
      ...activeLog,
      visitedStops: selectedStops,
      comments,
      durationMs: Date.now() - new Date(activeLog.startTime).getTime(),
    });
  }, [activeLog, comments, selectedStops]);

  const elapsedMs = useMemo(() => {
    if (!activeLog) return 0;
    return now - new Date(activeLog.startTime).getTime();
  }, [activeLog, now]);

  const coveredDistance = useMemo(() => {
    if (optimizedRoute.length === 0) return 0;
    return (selectedStops.length / optimizedRoute.length) * routeDistanceKm;
  }, [optimizedRoute.length, routeDistanceKm, selectedStops.length]);

  function startShift() {
    const startedAt = new Date().toISOString();
    const draft: WorkLogDraft = {
      id: crypto.randomUUID(),
      workerName,
      startTime: startedAt,
      endTime: startedAt,
      durationMs: 0,
      visitedStops: [],
      distanceKm: 0,
      comments: "",
      createdAt: startedAt,
    };
    setActiveLog(draft);
    setSelectedStops([]);
    setComments("");
    saveActiveWorkLog(draft);
  }

  async function finishShift() {
    if (!activeLog) return;

    const finishedAt = new Date().toISOString();
    const finalLog: WorkLogDraft = {
      ...activeLog,
      workerName,
      endTime: finishedAt,
      durationMs: new Date(finishedAt).getTime() - new Date(activeLog.startTime).getTime(),
      visitedStops: selectedStops,
      distanceKm: coveredDistance,
      comments,
      createdAt: finishedAt,
    };

    await sendWorkLog(finalLog);
    clearActiveWorkLog();
    setActiveLog(null);
    setSelectedStops([]);
    setComments("");
  }

  function toggleStop(stopName: string) {
    setSelectedStops((current) =>
      current.includes(stopName)
        ? current.filter((name) => name !== stopName)
        : [...current, stopName],
    );
  }

  return (
    <section className="card worklog-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Bitacora de jornada</p>
          <h2>Control de salida y regreso</h2>
        </div>
        <span className={isActive ? "pill pill-live" : "pill"}>{isActive ? "Activa" : "Lista"}</span>
      </div>

      <div className="timer">{formatDuration(elapsedMs)}</div>
      <div className="button-row">
        <button type="button" onClick={startShift} disabled={isActive || !workerName}>
          Iniciar Jornada
        </button>
        <button type="button" className="danger" onClick={finishShift} disabled={!isActive}>
          Finalizar Jornada
        </button>
      </div>

      {!workerName && <p className="hint">Captura el nombre del trabajador antes de iniciar.</p>}

      <div className="checklist">
        {optimizedRoute.map((stop, index) => (
          <label key={stop.id} className="check-item">
            <input
              type="checkbox"
              checked={selectedStops.includes(stop.name)}
              onChange={() => toggleStop(stop.name)}
              disabled={!isActive}
            />
            <span>
              {index + 1}. {stop.name}
              <small>{stop.address}</small>
            </span>
          </label>
        ))}
      </div>

      <label className="field">
        Comentarios
        <textarea
          value={comments}
          onChange={(event) => setComments(event.target.value)}
          placeholder="Observaciones de la jornada real"
          disabled={!isActive}
        />
      </label>

      <p className="metric">
        Avance estimado: {selectedStops.length}/{optimizedRoute.length} paradas,{" "}
        {coveredDistance.toFixed(2)} km
      </p>
    </section>
  );
}

function formatDuration(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}
