import { FormEvent, useMemo, useState } from "react";
import { useGame } from "../context/GameContext";
import type { EvidenceDraft } from "../types";

export function EvidenceUploader() {
  const {
    workerName,
    startAddress,
    startLocation,
    optimizedRoute,
    routeDistanceKm,
    sendEvidence,
  } = useGame();
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(
    () => Boolean(workerName && photo && !isSubmitting),
    [isSubmitting, photo, workerName],
  );

  async function handlePhotoChange(file: File | undefined) {
    if (!file) return;
    setPhoto(file);
    setPreview(await fileToDataUrl(file));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!photo || !preview) return;

    setIsSubmitting(true);
    const createdAt = new Date().toISOString();
    const draft: EvidenceDraft = {
      id: crypto.randomUUID(),
      workerName,
      startAddress,
      routeSequence: optimizedRoute.map((stop) => stop.name),
      accumulatedDistanceKm: routeDistanceKm,
      notes,
      coordinates: startLocation ?? undefined,
      photoName: photo.name || "evidencia.jpg",
      photoType: photo.type || "image/jpeg",
      photoDataUrl: preview,
      createdAt,
    };

    await sendEvidence(draft);
    setNotes("");
    setPhoto(null);
    setPreview(null);
    setIsSubmitting(false);
  }

  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Evidencia fotografica</p>
          <h2>Foto, GPS y reporte</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="stack">
        <label className="file-picker">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(event) => handlePhotoChange(event.target.files?.[0])}
          />
          <span>{photo ? "Cambiar foto" : "Tomar o cargar foto"}</span>
        </label>

        {preview && <img src={preview} alt="Vista previa de evidencia" className="preview" />}

        <label className="field">
          Observaciones
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Describe la evidencia, incidencia o colonia visitada"
          />
        </label>

        <div className="evidence-meta">
          <span>{startAddress}</span>
          <span>{routeDistanceKm.toFixed(2)} km acumulados</span>
        </div>

        <button type="submit" disabled={!canSubmit}>
          {isSubmitting ? "Guardando..." : "Registrar evidencia"}
        </button>
      </form>
    </section>
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("No se pudo leer la fotografia."));
    reader.readAsDataURL(file);
  });
}
