import { DailyWorkLog } from "./components/DailyWorkLog";
import { EvidenceUploader } from "./components/EvidenceUploader";
import { OfflineQueue } from "./components/OfflineQueue";
import { RouteMap } from "./components/RouteMap";
import { useGame } from "./context/GameContext";

export function App() {
  const {
    workerName,
    setWorkerName,
    session,
    isOnline,
    statusMessage,
    login,
    logout,
  } = useGame();

  return (
    <main>
      <section className="hero">
        <div>
          <p className="eyebrow">Saltillo</p>
          <h1>Asistencia, rutas y evidencias</h1>
          <p>
            Controla la jornada, navega paradas optimizadas y registra fotografias en Google
            Drive/Sheets con respaldo offline.
          </p>
        </div>
        <div className="hero-panel">
          <span className={isOnline ? "status online" : "status offline"}>
            {isOnline ? "En linea" : "Sin conexion"}
          </span>
          <strong>{session?.email ?? "Google no conectado"}</strong>
          <button type="button" onClick={session ? logout : login}>
            {session ? "Cerrar sesion" : "Conectar Google"}
          </button>
        </div>
      </section>

      <section className="card operator-card">
        <label className="field">
          Nombre del trabajador
          <input
            value={workerName}
            onChange={(event) => setWorkerName(event.target.value)}
            placeholder="Nombre completo del operario"
          />
        </label>
        <p className="hint">{statusMessage}</p>
      </section>

      <div className="grid">
        <RouteMap />
        <DailyWorkLog />
        <EvidenceUploader />
        <OfflineQueue />
      </div>
    </main>
  );
}
