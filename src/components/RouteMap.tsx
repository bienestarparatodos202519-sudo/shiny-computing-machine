import { useGame } from "../context/GameContext";

export function RouteMap() {
  const { optimizedRoute, refreshLocation, routeDistanceKm, startAddress, startLocation } =
    useGame();
  const center = startLocation ?? optimizedRoute[0]?.coordinates ?? { lat: 25.4232, lng: -101.0053 };
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${center.lng - 0.08}%2C${
    center.lat - 0.05
  }%2C${center.lng + 0.08}%2C${center.lat + 0.05}&layer=mapnik&marker=${center.lat}%2C${
    center.lng
  }`;

  return (
    <section className="card map-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Navegacion GPS</p>
          <h2>Ruta optimizada en Saltillo</h2>
        </div>
        <button type="button" className="secondary" onClick={refreshLocation}>
          Actualizar GPS
        </button>
      </div>

      <iframe title="Mapa de ruta Saltillo" src={mapUrl} loading="lazy" />

      <div className="route-summary">
        <strong>Salida:</strong> {startAddress}
        <span>{routeDistanceKm.toFixed(2)} km estimados</span>
      </div>

      <ol className="route-list">
        {optimizedRoute.map((stop) => (
          <li key={stop.id}>
            <strong>{stop.name}</strong>
            <span>{stop.address}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
