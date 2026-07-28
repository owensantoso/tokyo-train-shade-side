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

function lineCoordinates(line) {
  const coordinates = line.stations.map(({ lat, lon }) => [lat, lon]);
  return line.circular && coordinates.length ? [...coordinates, coordinates[0]] : coordinates;
}

export function nearestPointIndex(points, target, maxDistance) {
  let nearestIndex = -1;
  let nearestDistance = maxDistance;
  points.forEach((point, index) => {
    const distance = Math.hypot(point.x - target.x, point.y - target.y);
    if (distance <= nearestDistance) {
      nearestIndex = index;
      nearestDistance = distance;
    }
  });
  return nearestIndex;
}

export class StationMap {
  constructor({ container, status, getRoutePath, getStationOptions, onStationSelect }) {
    this.container = container;
    this.status = status;
    this.getRoutePath = getRoutePath;
    this.getStationOptions = getStationOptions;
    this.onStationSelect = onStationSelect;
    this.lastLineId = null;
    this.layers = new Map();
    this.routeSelectionLayer = null;
    this.activeLineId = "all";
    this.hoveredMarker = null;

    const L = window.L;
    if (!L) {
      this.status.textContent = "Map unavailable";
      this.container.innerHTML = '<p class="schematic-empty">The station map could not load.</p>';
      return;
    }

    this.L = L;
    this.map = L.map(container, {
      center: [35.66, 139.67],
      zoom: 9,
      zoomControl: false,
      scrollWheelZoom: false,
      preferCanvas: true,
    });
    L.control.zoom({ position: "bottomright" }).addTo(this.map);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
    }).addTo(this.map);
    this.map.on("click", (event) => this.selectNearestStation(event.containerPoint));
    this.map.on("mousemove", (event) => this.previewNearestStation(event.containerPoint));
    this.map.on("mouseout", () => this.clearStationPreview());

    Object.entries(LINES).forEach(([lineId, line]) => {
      const routeLayer = L.layerGroup();
      const stationLayer = L.layerGroup();
      const coordinates = lineCoordinates(line);
      L.polyline(coordinates, {
        color: "#ffffff",
        weight: 9,
        opacity: 0.9,
        lineJoin: "round",
      }).addTo(routeLayer);
      L.polyline(coordinates, {
        color: LINE_COLORS[lineId],
        weight: 5,
        opacity: 0.96,
        lineJoin: "round",
      }).addTo(routeLayer);

      const options = getStationOptions(lineId);
      const markers = new Map();
      options.forEach((option) => {
        const code = stationCodeFor(lineId, option.name);
        const marker = L.circleMarker([option.lat, option.lon], {
          radius: 3,
          color: "#ffffff",
          weight: 1,
          fillColor: LINE_COLORS[lineId],
          fillOpacity: 1,
          interactive: false,
        });
        marker.bindTooltip(
          `<strong>${option.name}</strong><br><span lang="ja">${option.nameJa}</span> · ${code}`,
          { direction: "top", offset: [0, -7] },
        );
        marker.addTo(stationLayer);
        markers.set(option.name, { marker, option });
      });
      this.layers.set(lineId, { routeLayer, stationLayer, markers });
    });

    window.requestAnimationFrame(() => this.map.invalidateSize());
  }

  render(lineId, origin, destination) {
    if (!this.map) return;
    const lineChanged = lineId !== this.lastLineId;

    this.layers.forEach(({ routeLayer, stationLayer, markers }, id) => {
      this.map.removeLayer(routeLayer);
      this.map.removeLayer(stationLayer);
      markers.forEach(({ marker }, stationName) => {
        const state = origin?.name === stationName ? "origin" : destination?.name === stationName ? "destination" : "";
        marker.setRadius(state ? 7 : 3);
        marker.setStyle({
          color: state ? "#141918" : "#ffffff",
          weight: state ? 3 : 1,
          fillColor: state === "origin" ? "#ffd43b" : LINE_COLORS[id],
        });
      });
    });
    if (this.routeSelectionLayer) {
      this.map.removeLayer(this.routeSelectionLayer);
      this.routeSelectionLayer = null;
    }

    if (lineId === "all") {
      this.layers.forEach(({ routeLayer }) => routeLayer.addTo(this.map));
      this.status.textContent = "Choose a line to pick stations";
      if (lineChanged) this.fitStations(Object.values(LINES).flatMap(({ stations }) => stations));
    } else {
      const { routeLayer, stationLayer } = this.layers.get(lineId);
      routeLayer.addTo(this.map);
      stationLayer.addTo(this.map);
      if (origin && destination) {
        const route = this.getRoutePath(lineId, origin.name, destination.name);
        this.routeSelectionLayer = this.L.polyline(
          route.stations.map(({ lat, lon }) => [lat, lon]),
          { color: "#ffd43b", weight: 7, opacity: 1, lineJoin: "round" },
        ).addTo(this.map);
      }
      this.status.textContent = origin
        ? destination
          ? `${stationCodeFor(lineId, origin.name)} → ${stationCodeFor(lineId, destination.name)}`
          : `${stationCodeFor(lineId, origin.name)} → destination not set`
        : "Click a station for the origin";
      if (lineChanged) this.fitStations(LINES[lineId].stations);
    }

    window.requestAnimationFrame(() => this.map.invalidateSize());
    this.activeLineId = lineId;
    this.lastLineId = lineId;
  }

  fitStations(stations) {
    this.map.fitBounds(
      stations.map(({ lat, lon }) => [lat, lon]),
      { padding: [18, 18], maxZoom: 13 },
    );
  }

  nearestStation(containerPoint, maxDistance = 22) {
    if (this.activeLineId === "all") return null;
    const entries = [...(this.layers.get(this.activeLineId)?.markers.values() ?? [])];
    const points = entries.map(({ marker }) => this.map.latLngToContainerPoint(marker.getLatLng()));
    const index = nearestPointIndex(points, containerPoint, maxDistance);
    return index >= 0 ? entries[index] : null;
  }

  selectNearestStation(containerPoint) {
    const nearest = this.nearestStation(containerPoint);
    if (nearest) this.onStationSelect(nearest.option);
  }

  previewNearestStation(containerPoint) {
    const nearest = this.nearestStation(containerPoint, 12);
    if (nearest?.marker === this.hoveredMarker) return;
    this.clearStationPreview();
    if (nearest) {
      nearest.marker.openTooltip();
      this.hoveredMarker = nearest.marker;
    }
  }

  clearStationPreview() {
    this.hoveredMarker?.closeTooltip();
    this.hoveredMarker = null;
  }
}
