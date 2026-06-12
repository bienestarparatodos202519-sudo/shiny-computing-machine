export type Coordinates = {
  lat: number;
  lng: number;
};

export type RouteStop = {
  id: string;
  name: string;
  address: string;
  coordinates: Coordinates;
  visited?: boolean;
};

export type GoogleSession = {
  accessToken: string;
  expiresAt: number;
  email?: string;
  name?: string;
};

export type EvidenceDraft = {
  id: string;
  workerName: string;
  startAddress: string;
  routeSequence: string[];
  accumulatedDistanceKm: number;
  notes: string;
  coordinates?: Coordinates;
  photoName: string;
  photoType: string;
  photoDataUrl: string;
  createdAt: string;
};

export type WorkLogDraft = {
  id: string;
  workerName: string;
  startTime: string;
  endTime: string;
  durationMs: number;
  visitedStops: string[];
  distanceKm: number;
  comments: string;
  createdAt: string;
};

export type OfflineItem =
  | {
      id: string;
      type: "evidence";
      payload: EvidenceDraft;
      createdAt: string;
      lastError?: string;
    }
  | {
      id: string;
      type: "worklog";
      payload: WorkLogDraft;
      createdAt: string;
      lastError?: string;
    };

export type SyncResult = {
  synced: number;
  failed: number;
  errors: string[];
};
