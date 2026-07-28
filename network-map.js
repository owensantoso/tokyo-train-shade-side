import { LINES, stationCodeFor } from "./shade.js";

const LINE_COLORS = {
  keio: "#d51c57",
  inokashira: "#256ba6",
  shinjuku: "#6cbb5a",
  ginza: "#f39700",
  chuo: "#f15a24",
  yamanote: "#80c241",
  odakyu: "#1682c4",
  denentoshi: "#00a040",
};

export function lineCoordinates(line) {
  const coordinates = line.stations.map(({ lat, lon }) => [lat, lon]);
  return line.circular && coordinates.length ? [...coordinates, coordinates[0]] : coordinates;
}

function initNetworkMap() {
  const L = window.L;
  const status = document.querySelector("#map-status");
  if (!L) {
    status.textContent = "The basemap library could not load.";
    return;
  }

  const map = L.map("network-map", {
    center: [35.66, 139.67],
    zoom: 10,
    zoomControl: false,
    preferCanvas: true,
  });
  L.control.zoom({ position: "bottomright" }).addTo(map);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
  }).addTo(map);

  const layers = new Map();
  Object.entries(LINES).forEach(([lineId, line]) => {
    const routeLayer = L.layerGroup();
    const stationLayer = L.layerGroup();
    const coordinates = lineCoordinates(line);
    L.polyline(coordinates, {
      color: "#ffffff",
      weight: 9,
      opacity: 0.92,
      lineJoin: "round",
    }).addTo(routeLayer);
    L.polyline(coordinates, {
      color: LINE_COLORS[lineId],
      weight: 5,
      opacity: 0.96,
      lineJoin: "round",
    }).addTo(routeLayer);

    line.stations.forEach((station) => {
      const code = stationCodeFor(lineId, station.name);
      L.circleMarker([station.lat, station.lon], {
        radius: 2.75,
        color: "#ffffff",
        weight: 1,
        fillColor: LINE_COLORS[lineId],
        fillOpacity: 1,
      })
        .bindTooltip(
          `<strong>${station.name}</strong><br><span lang="ja">${station.nameJa}</span> · ${code}`,
          { direction: "top", offset: [0, -4] },
        )
        .addTo(stationLayer);
    });
    layers.set(lineId, { routeLayer, stationLayer });
  });

  const buttons = [...document.querySelectorAll("[data-map-line]")];

  function showLine(lineId) {
    layers.forEach(({ routeLayer, stationLayer }) => {
      map.removeLayer(routeLayer);
      map.removeLayer(stationLayer);
    });
    const isAll = lineId === "all";
    layers.forEach(({ routeLayer, stationLayer }, id) => {
      if (isAll || id === lineId) routeLayer.addTo(map);
      if (!isAll && id === lineId) stationLayer.addTo(map);
    });
    buttons.forEach((button) => {
      const active = button.dataset.mapLine === lineId;
      button.setAttribute("aria-pressed", String(active));
    });
    status.textContent = isAll
      ? "Showing all eight supported corridors"
      : `${LINES[lineId].name} · ${LINES[lineId].stations.length} stations`;

    const stations = isAll
      ? Object.values(LINES).flatMap(({ stations }) => stations)
      : LINES[lineId].stations;
    map.fitBounds(stations.map(({ lat, lon }) => [lat, lon]), { padding: [28, 28] });
  }

  buttons.forEach((button) => button.addEventListener("click", () => showLine(button.dataset.mapLine)));
  showLine("all");
}

if (typeof window !== "undefined") window.addEventListener("DOMContentLoaded", initNetworkMap);
