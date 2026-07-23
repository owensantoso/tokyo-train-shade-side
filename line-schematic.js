const VIEWBOX_WIDTH = 640;
const VIEWBOX_HEIGHT = 220;
const VIEWBOX_PADDING = 24;
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

export function projectStationPoints(
  stations,
  { width = VIEWBOX_WIDTH, height = VIEWBOX_HEIGHT, padding = VIEWBOX_PADDING } = {},
) {
  if (!stations.length) return [];
  const meanLatitude = stations.reduce((sum, station) => sum + station.lat, 0) / stations.length;
  const longitudeScale = Math.cos((meanLatitude * Math.PI) / 180);
  const raw = stations.map(({ lat, lon }) => ({ x: lon * longitudeScale, y: -lat }));
  const xs = raw.map(({ x }) => x);
  const ys = raw.map(({ y }) => y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const xRange = maxX - minX;
  const yRange = maxY - minY;
  const availableWidth = width - padding * 2;
  const availableHeight = height - padding * 2;
  const scaleX = xRange ? availableWidth / xRange : Infinity;
  const scaleY = yRange ? availableHeight / yRange : Infinity;
  const scale = Number.isFinite(Math.min(scaleX, scaleY)) ? Math.min(scaleX, scaleY) : 1;
  const contentWidth = xRange * scale;
  const contentHeight = yRange * scale;
  const offsetX = (width - contentWidth) / 2 - minX * scale;
  const offsetY = (height - contentHeight) / 2 - minY * scale;

  return raw.map(({ x, y }) => ({ x: x * scale + offsetX, y: y * scale + offsetY }));
}

export function projectSchematicPoints(
  stations,
  { width = VIEWBOX_WIDTH, height = VIEWBOX_HEIGHT, padding = VIEWBOX_PADDING } = {},
) {
  if (!stations.length) return [];
  if (stations.length === 1) return [{ x: width / 2, y: height / 2 }];

  const meanLatitude = stations.reduce((sum, station) => sum + station.lat, 0) / stations.length;
  const longitudeScale = Math.cos((meanLatitude * Math.PI) / 180);
  const raw = stations.map(({ lat, lon }) => ({ x: lon * longitudeScale, y: -lat }));
  const first = raw[0];
  const last = raw.at(-1);
  const dx = last.x - first.x;
  const dy = last.y - first.y;
  const routeLength = Math.hypot(dx, dy);
  const deviations = raw.map(({ x, y }) => (
    routeLength ? (dx * (y - first.y) - dy * (x - first.x)) / routeLength : 0
  ));
  const maxDeviation = Math.max(...deviations.map(Math.abs));
  const availableWidth = width - padding * 2;
  const verticalAmplitude = (height - padding * 2) / 2;

  return deviations.map((deviation, index) => ({
    x: padding + (index / (stations.length - 1)) * availableWidth,
    y: height / 2 + (maxDeviation ? (deviation / maxDeviation) * verticalAmplitude : 0),
  }));
}

function svgElement(name, attributes = {}) {
  const element = document.createElementNS(SVG_NAMESPACE, name);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
  return element;
}

function pathData(points, close = false) {
  if (!points.length) return "";
  return `${points.map(({ x, y }, index) => `${index ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ")}${close ? " Z" : ""}`;
}

function circularStationPoints(count, width, height) {
  const centerX = width / 2;
  const centerY = height / 2;
  const radiusX = width / 2 - 38;
  const radiusY = height / 2 - 34;
  return Array.from({ length: count }, (_, index) => {
    const angle = Math.PI + (index / count) * Math.PI * 2;
    return {
      x: centerX + Math.cos(angle) * radiusX,
      y: centerY + Math.sin(angle) * radiusY,
      angle,
    };
  });
}

export class LineSchematic {
  constructor({ container, status, getLine, getRoutePath, getStationOptions, onStationSelect }) {
    this.container = container;
    this.status = status;
    this.getLine = getLine;
    this.getRoutePath = getRoutePath;
    this.getStationOptions = getStationOptions;
    this.onStationSelect = onStationSelect;
    this.lastLineId = null;
  }

  render(lineId, origin, destination) {
    this.container.replaceChildren();
    if (lineId === "all") {
      this.container.dataset.state = "empty";
      this.status.textContent = "No line selected";
      const empty = document.createElement("p");
      empty.className = "schematic-empty";
      empty.textContent = "No line selected";
      this.container.append(empty);
      this.lastLineId = lineId;
      return;
    }

    const line = this.getLine(lineId);
    const options = this.getStationOptions(lineId);
    const isCircular = Boolean(line.circular);
    const width = isCircular ? 360 : Math.max(360, options.length * 22);
    const height = isCircular ? 240 : 176;
    const points = isCircular
      ? circularStationPoints(options.length, width, height)
      : projectSchematicPoints(options, { width, height, padding: 28 });
    const pointByName = new Map(options.map((option, index) => [option.name, points[index]]));
    const svg = svgElement("svg", {
      viewBox: `0 0 ${width} ${height}`,
      width,
      height,
      role: "img",
      "aria-label": `${line.name} clickable station diagram`,
    });
    svg.classList.add("schematic-svg");
    svg.append(svgElement("path", { class: "schematic-track", d: pathData(points, isCircular) }));

    if (origin && destination && origin.lineId === lineId && destination.lineId === lineId) {
      const route = this.getRoutePath(lineId, origin.name, destination.name);
      const routePoints = route.stations.map(({ name }) => pointByName.get(name));
      svg.append(svgElement("path", { class: "schematic-route", d: pathData(routePoints) }));
    }

    if (isCircular) {
      const loopCode = svgElement("text", {
        class: "schematic-loop-code",
        x: width / 2,
        y: height / 2 - 3,
        "text-anchor": "middle",
      });
      loopCode.textContent = line.code;
      const loopName = svgElement("text", {
        class: "schematic-loop-name",
        x: width / 2,
        y: height / 2 + 15,
        "text-anchor": "middle",
      });
      loopName.textContent = line.shortName;
      svg.append(loopCode, loopName);
    }

    options.forEach((option, index) => {
      const point = points[index];
      const isOrigin = origin?.lineId === lineId && origin.name === option.name;
      const isDestination = destination?.lineId === lineId && destination.name === option.name;
      const node = svgElement("g", {
        class: `schematic-station${isOrigin ? " is-origin" : ""}${isDestination ? " is-destination" : ""}`,
        role: "button",
        tabindex: "0",
        "aria-label": `${option.stationCode} ${option.name}, ${option.nameJa}`,
        transform: `translate(${point.x.toFixed(1)} ${point.y.toFixed(1)})`,
      });
      const title = svgElement("title");
      title.textContent = `${option.stationCode} · ${option.name} · ${option.nameJa}`;
      const hitArea = svgElement("circle", { class: "schematic-hit", r: 8 });
      const circle = svgElement("circle", { class: "station-dot", r: isOrigin || isDestination ? 7 : 4.5 });
      const number = svgElement("text", {
        class: "schematic-number",
        x: point.angle == null ? 0 : Math.cos(point.angle) * 13,
        y: point.angle == null ? (index % 2 ? -9 : 14) : Math.sin(point.angle) * 13 + 2.5,
        "text-anchor": "middle",
      });
      number.textContent = option.stationCode.slice(line.code.length);
      node.append(title, hitArea, circle, number);
      node.addEventListener("click", () => this.onStationSelect(option));
      node.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          this.onStationSelect(option);
        }
      });
      svg.append(node);
    });

    this.container.dataset.state = "ready";
    this.container.append(svg);
    this.status.textContent = origin
      ? destination ? `${origin.stationCode} → ${destination.stationCode}` : `${origin.stationCode} → destination not set`
      : "Origin not set";
    if (this.lastLineId !== lineId) this.container.scrollLeft = 0;
    this.lastLineId = lineId;
  }
}
