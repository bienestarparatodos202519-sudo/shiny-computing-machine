import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  Coordinates,
  EvidenceDraft,
  GoogleSession,
  OfflineItem,
  RouteStop,
  SyncResult,
  WorkLogDraft,
} from "../types";
import {
  clearSession,
  enqueueOfflineItem,
  loadOfflineQueue,
  loadWorkerName,
  saveWorkerName,
} from "../lib/storage";
import {
  getStoredValidSession,
  signInWithGoogle,
  submitEvidence,
  submitWorkLog,
  syncOfflineQueue,
} from "../lib/googleWorkspace";

const DEFAULT_STOPS: RouteStop[] = [
  {
    id: "centro",
    name: "Centro Historico",
    address: "Plaza de Armas, Zona Centro, Saltillo",
    coordinates: { lat: 25.4232, lng: -101.0053 },
  },
  {
    id: "mirasierra",
    name: "Mirasierra",
    address: "Colonia Mirasierra, Saltillo",
    coordinates: { lat: 25.3976, lng: -100.9378 },
  },
  {
    id: "valle-dorado",
    name: "Valle Dorado",
    address: "Colonia Valle Dorado, Saltillo",
    coordinates: { lat: 25.4551, lng: -100.9771 },
  },
  {
    id: "terrazas",
    name: "Las Terrazas",
    address: "Colonia Las Terrazas, Saltillo",
    coordinates: { lat: 25.4569, lng: -101.0166 },
  },
  {
    id: "saltillo-2000",
    name: "Saltillo 2000",
    address: "Colonia Saltillo 2000, Saltillo",
    coordinates: { lat: 25.4616, lng: -100.9489 },
  },
];

type GameContextValue = {
  workerName: string;
  setWorkerName: (value: string) => void;
  startLocation: Coordinates | null;
  startAddress: string;
  optimizedRoute: RouteStop[];
  routeDistanceKm: number;
  session: GoogleSession | null;
  offlineQueue: OfflineItem[];
  isOnline: boolean;
  statusMessage: string;
  refreshLocation: () => Promise<void>;
  login: () => Promise<void>;
  logout: () => void;
  sendEvidence: (draft: EvidenceDraft) => Promise<void>;
  sendWorkLog: (draft: WorkLogDraft) => Promise<void>;
  syncQueue: () => Promise<SyncResult>;
};

const GameContext = createContext<GameContextValue | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [workerNameState, setWorkerNameState] = useState(loadWorkerName);
  const [startLocation, setStartLocation] = useState<Coordinates | null>(null);
  const [startAddress, setStartAddress] = useState("Saltillo, Coahuila");
  const [session, setSession] = useState<GoogleSession | null>(getStoredValidSession);
  const [offlineQueue, setOfflineQueue] = useState<OfflineItem[]>(loadOfflineQueue);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [statusMessage, setStatusMessage] = useState("Listo para iniciar ruta.");

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const setWorkerName = useCallback((value: string) => {
    setWorkerNameState(value);
    saveWorkerName(value);
  }, []);

  const optimizedRoute = useMemo(
    () => optimizeRoute(startLocation ?? DEFAULT_STOPS[0].coordinates, DEFAULT_STOPS),
    [startLocation],
  );

  const routeDistanceKm = useMemo(
    () => calculateRouteDistance(startLocation ?? optimizedRoute[0].coordinates, optimizedRoute),
    [optimizedRoute, startLocation],
  );

  const refreshLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setStatusMessage("Este dispositivo no soporta GPS en navegador.");
      return;
    }

    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 12_000,
      });
    });

    const coordinates = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };
    setStartLocation(coordinates);
    const address = await reverseGeocode(coordinates);
    setStartAddress(address);
    setStatusMessage("Ubicacion GPS actualizada.");
  }, []);

  const login = useCallback(async () => {
    const googleSession = await signInWithGoogle();
    setSession(googleSession);
    if (googleSession.name && !workerNameState) setWorkerName(googleSession.name);
    setStatusMessage(`Sesion conectada: ${googleSession.email ?? "Google"}.`);
  }, [setWorkerName, workerNameState]);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
    setStatusMessage("Sesion Google cerrada.");
  }, []);

  const sendEvidence = useCallback(async (draft: EvidenceDraft) => {
    try {
      await submitEvidence(draft);
      setStatusMessage("Evidencia enviada a Google Drive y Sheets.");
    } catch (error) {
      const item = toOfflineItem("evidence", draft, error);
      setOfflineQueue(enqueueOfflineItem(item));
      setStatusMessage("Sin conexion o permisos incompletos. Evidencia guardada para reintento.");
    }
  }, []);

  const sendWorkLog = useCallback(async (draft: WorkLogDraft) => {
    try {
      await submitWorkLog(draft);
      setStatusMessage("Bitacora enviada a Google Sheets.");
    } catch (error) {
      const item = toOfflineItem("worklog", draft, error);
      setOfflineQueue(enqueueOfflineItem(item));
      setStatusMessage("Bitacora guardada localmente para reintento.");
    }
  }, []);

  const syncQueue = useCallback(async () => {
    const result = await syncOfflineQueue();
    setOfflineQueue(loadOfflineQueue());
    setStatusMessage(
      result.failed === 0
        ? `Sincronizacion completa: ${result.synced} reporte(s).`
        : `Sincronizados ${result.synced}; pendientes ${result.failed}.`,
    );
    return result;
  }, []);

  const value = useMemo(
    () => ({
      workerName: workerNameState,
      setWorkerName,
      startLocation,
      startAddress,
      optimizedRoute,
      routeDistanceKm,
      session,
      offlineQueue,
      isOnline,
      statusMessage,
      refreshLocation,
      login,
      logout,
      sendEvidence,
      sendWorkLog,
      syncQueue,
    }),
    [
      workerNameState,
      setWorkerName,
      startLocation,
      startAddress,
      optimizedRoute,
      routeDistanceKm,
      session,
      offlineQueue,
      isOnline,
      statusMessage,
      refreshLocation,
      login,
      logout,
      sendEvidence,
      sendWorkLog,
      syncQueue,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame debe usarse dentro de GameProvider.");
  return context;
}

function optimizeRoute(start: Coordinates, stops: RouteStop[]): RouteStop[] {
  const pending = [...stops];
  const ordered: RouteStop[] = [];
  let current = start;

  while (pending.length > 0) {
    pending.sort(
      (left, right) =>
        distanceKm(current, left.coordinates) - distanceKm(current, right.coordinates),
    );
    const next = pending.shift();
    if (!next) break;
    ordered.push(next);
    current = next.coordinates;
  }

  return ordered;
}

function calculateRouteDistance(start: Coordinates, stops: RouteStop[]): number {
  let current = start;
  return stops.reduce((total, stop) => {
    const segment = distanceKm(current, stop.coordinates);
    current = stop.coordinates;
    return total + segment;
  }, 0);
}

function distanceKm(from: Coordinates, to: Coordinates): number {
  const earthRadiusKm = 6371;
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

async function reverseGeocode(coordinates: Coordinates): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coordinates.lat}&lon=${coordinates.lng}`,
      { headers: { Accept: "application/json" } },
    );
    if (!response.ok) throw new Error("Sin respuesta de geocodificacion.");
    const payload = (await response.json()) as { display_name?: string };
    return payload.display_name ?? `${coordinates.lat}, ${coordinates.lng}`;
  } catch {
    return `${coordinates.lat.toFixed(5)}, ${coordinates.lng.toFixed(5)}`;
  }
}

function toOfflineItem(
  type: "evidence",
  payload: EvidenceDraft,
  error: unknown,
): OfflineItem;
function toOfflineItem(type: "worklog", payload: WorkLogDraft, error: unknown): OfflineItem;
function toOfflineItem(
  type: "evidence" | "worklog",
  payload: EvidenceDraft | WorkLogDraft,
  error: unknown,
): OfflineItem {
  const lastError = error instanceof Error ? error.message : "Error desconocido";
  const base = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    lastError,
  };

  if (type === "evidence") {
    return { ...base, type, payload: payload as EvidenceDraft };
  }

  return { ...base, type, payload: payload as WorkLogDraft };
}
