import { useState } from "react";
import { useGame } from "../context/GameContext";

export function OfflineQueue() {
  const { offlineQueue, syncQueue } = useGame();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  async function handleSync() {
    setIsSyncing(true);
    const result = await syncQueue();
    setLastResult(
      result.failed === 0
        ? `Se sincronizaron ${result.synced} reporte(s).`
        : `Quedan ${result.failed} pendiente(s). ${result.errors[0] ?? ""}`,
    );
    setIsSyncing(false);
  }

  return (
    <section className="card queue-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Modo sin conexion</p>
          <h2>Reportes pendientes</h2>
        </div>
        <span className="pill">{offlineQueue.length}</span>
      </div>

      <p>
        Si el servidor o Google no responde, la app guarda evidencias y bitacoras en este
        dispositivo para subirlas despues.
      </p>

      {offlineQueue.length > 0 && (
        <ul className="queue-list">
          {offlineQueue.map((item) => (
            <li key={item.id}>
              <strong>{item.type === "evidence" ? "Evidencia" : "Bitacora"}</strong>
              <span>{new Date(item.createdAt).toLocaleString("es-MX")}</span>
              {item.lastError && <small>{item.lastError}</small>}
            </li>
          ))}
        </ul>
      )}

      <button type="button" className="secondary" onClick={handleSync} disabled={isSyncing}>
        {isSyncing ? "Sincronizando..." : "Subir pendientes"}
      </button>
      {lastResult && <p className="hint">{lastResult}</p>}
    </section>
  );
}
