import {
  LINES,
  calculateSolarEvents,
  departurePreset,
  describeBearing,
  describeSunElevation,
  filterStationOptions,
  findClosestStation,
  getRecommendation,
  getRoutePath,
  resolveRouteLine,
  stationCodeFor,
  stationOptions,
} from "./shade.js";
import { shouldFocusOriginForTyping } from "./keyboard-shortcut.js?v=0.10";
import { PhoneCompassController, signedHeadingDifference } from "./phone-compass.js";
import { StationMap } from "./station-map.js";
import { StationCombobox } from "./station-combobox.js?v=0.16";
import { LINE_NAMES, resolveLanguage, translate } from "./locale.js";
import { addRecentRoute, parseRecentRoutes } from "./recent-routes.js";
import {
  clockToMinutes,
  formatTokyoDateTime,
  minutesToClock,
  parseTokyoDateTime,
  parseTripState,
  serializeTripState,
} from "./trip-state.js";

const LANGUAGE_KEY = "shade-seat.language";
const RECENT_ROUTES_KEY = "shade-seat.recent-routes.v1";
const queryLanguage = new URLSearchParams(window.location.search).get("lang");

function readStorage(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // The app still works when storage is blocked.
  }
}

let currentLanguage = resolveLanguage({
  urlLanguage: queryLanguage,
  savedLanguage: readStorage(LANGUAGE_KEY),
  browserLanguages: navigator.languages ?? [navigator.language],
});
let recentRoutes = parseRecentRoutes(readStorage(RECENT_ROUTES_KEY));
const t = (key, values) => translate(currentLanguage, key, values);
const stationLabel = (option) => currentLanguage === "ja" ? option?.nameJa : option?.name;

const form = document.querySelector("#shade-form");
const swapButton = document.querySelector("#swap-stations");
const locateButton = document.querySelector("#locate-station");
const locationStatus = document.querySelector("#location-status");
const dateInput = document.querySelector("#departure-date");
const timeInput = document.querySelector("#departure-time");
const specificTimePanel = document.querySelector("#specific-time-panel");
const nowLabel = document.querySelector("#now-label");
const routeLineLabel = document.querySelector("#route-line-label");
const result = document.querySelector("#result");
const resultContent = document.querySelector("#result-content");
const resultTimeControl = document.querySelector("#result-time-control");
const resultTimeSlider = document.querySelector("#result-time-slider");
const resultTimeOutput = document.querySelector("#result-time-output");
const shareButton = document.querySelector("#share-result");
const shareStatus = document.querySelector("#share-status");
const assumption = document.querySelector("#assumption");
const recentRoutesSection = document.querySelector("#recent-routes");
const recentRouteList = document.querySelector("#recent-route-list");
const clearRecentRoutesButton = document.querySelector("#clear-recent-routes");
let activeTrainHeading = null;
let phoneCompassState = { status: "idle", heading: null };
const phoneCompass = new PhoneCompassController({ onState: handlePhoneCompassState });

const origin = new StationCombobox({
  input: document.querySelector("#origin-input"),
  listbox: document.querySelector("#origin-suggestions"),
  codeElement: document.querySelector("#origin-code"),
  clearButton: document.querySelector("#clear-origin"),
  getOptions: filterStationOptions,
  onSelect: handleOriginSelect,
  onInput: handleOriginInput,
  onClear: handleOriginInput,
  getText: t,
  getOptionLabel: stationLabel,
});

const destination = new StationCombobox({
  input: document.querySelector("#destination-input"),
  listbox: document.querySelector("#destination-suggestions"),
  codeElement: document.querySelector("#destination-code"),
  clearButton: document.querySelector("#clear-destination"),
  getOptions: filterStationOptions,
  onSelect: handleDestinationSelect,
  onInput: handleDestinationInput,
  onClear: handleDestinationInput,
  getText: t,
  getOptionLabel: stationLabel,
});

const stationMap = new StationMap({
  container: document.querySelector("#line-schematic"),
  status: document.querySelector("#schematic-status"),
  getRoutePath,
  getStationOptions: stationOptions,
  onStationSelect: handleSchematicStationSelect,
  getText: t,
  getStationLabel: stationLabel,
});

function selectedLineId() {
  return form.elements.line.value;
}

function usesCurrentTime() {
  return form.elements["time-mode"].value === "now";
}

function applyStaticTranslations() {
  document.documentElement.lang = currentLanguage;
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
  ["aria-label", "placeholder", "title"].forEach((attribute) => {
    const dataName = `i18n${attribute.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join("")}`;
    document.querySelectorAll(`[data-i18n-${attribute}]`).forEach((element) => {
      element.setAttribute(attribute, t(element.dataset[dataName]));
    });
  });
  document.querySelectorAll("[data-line-name]").forEach((element) => {
    element.textContent = LINE_NAMES[currentLanguage][element.dataset.lineName];
  });
  document.querySelectorAll("[data-language]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.language === currentLanguage));
  });
}

function localizedDirection(direction) {
  if (currentLanguage === "en") return direction;
  const names = {
    N: "北", NNE: "北北東", NE: "北東", ENE: "東北東",
    E: "東", ESE: "東南東", SE: "南東", SSE: "南南東",
    S: "南", SSW: "南南西", SW: "南西", WSW: "西南西",
    W: "西", WNW: "西北西", NW: "北西", NNW: "北北西",
  };
  return { ...direction, label: names[direction.short] ?? direction.label };
}

function localizedSunHeight(elevation) {
  if (currentLanguage === "en") return describeSunElevation(elevation);
  if (elevation < 0) return "地平線の下";
  if (elevation < 10) return "地平線近く";
  if (elevation < 30) return "低い";
  if (elevation < 60) return "中程度";
  return "空高く";
}

function localizedStationName(station) {
  return currentLanguage === "ja" ? station.nameJa : station.name;
}

function resultEndpointMarkup(role, station, code) {
  const stationName = localizedStationName(station);
  return `<span class="result-station-link" tabindex="0" data-map-endpoint="${role}" aria-label="${t("mapEndpointAria", {
    role: currentLanguage === "en" ? t(role).toLowerCase() : t(role),
    station: stationName,
    code,
  })}">${stationName} <span class="route-code">${code}</span></span>`;
}

function bindResultMapEndpoints() {
  resultContent.querySelectorAll("[data-map-endpoint]").forEach((endpoint) => {
    const role = endpoint.dataset.mapEndpoint;
    endpoint.addEventListener("mouseenter", () => stationMap.highlightEndpoint(role, true));
    endpoint.addEventListener("mouseleave", () => stationMap.highlightEndpoint(role, false));
    endpoint.addEventListener("focus", () => stationMap.highlightEndpoint(role, true));
    endpoint.addEventListener("blur", () => stationMap.highlightEndpoint(role, false));
  });
}

function toDateInputValue(date) {
  return formatTokyoDateTime(date).slice(0, 10);
}

function toTimeInputValue(date) {
  return formatTokyoDateTime(date).slice(11);
}

function setSpecificDate(date) {
  dateInput.value = toDateInputValue(date);
  timeInput.value = toTimeInputValue(date);
}

function formatClockTime(date) {
  return new Intl.DateTimeFormat(currentLanguage === "ja" ? "ja-JP" : "en", { hour: "numeric", minute: "2-digit" }).format(date);
}

function formatTokyoClockTime(date) {
  return new Intl.DateTimeFormat(currentLanguage === "ja" ? "ja-JP" : "en", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  }).format(date);
}

function formatResultTime(date) {
  return `${new Intl.DateTimeFormat(currentLanguage === "ja" ? "ja-JP" : "en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  }).format(date)} JST`;
}

function selectedDate() {
  if (usesCurrentTime() || !dateInput.value || !timeInput.value) return new Date();
  return parseTokyoDateTime(`${dateInput.value}T${timeInput.value}`) ?? new Date();
}

function setSpecificTimeControls(enabled) {
  specificTimePanel.hidden = !enabled;
  dateInput.disabled = !enabled;
  timeInput.disabled = !enabled;
}

function updateResultTimeControl(date, visible) {
  resultTimeControl.hidden = !visible;
  if (!visible) return;
  const timestamp = formatTokyoDateTime(date);
  resultTimeSlider.value = String(clockToMinutes(timestamp.slice(11)));
  resultTimeOutput.textContent = formatResultTime(date);
}

function syncTripUrl(date = null) {
  const query = serializeTripState({
    language: currentLanguage,
    lineId: selectedLineId(),
    startName: origin.getSelection()?.name,
    endName: destination.getSelection()?.name,
    date,
  });
  const nextUrl = `${window.location.pathname}?${query}${window.location.hash}`;
  if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== nextUrl) {
    try {
      window.history.replaceState(null, "", nextUrl);
    } catch {
      // Safari rate-limits history writes; URL sync must never hide a valid result.
    }
  }
}

function hydrateTripState() {
  const state = parseTripState(window.location.search, ["all", ...Object.keys(LINES)]);
  setLine(state.lineId);
  if (state.date) {
    form.elements["time-mode"].value = "specific";
    setSpecificDate(state.date);
    setSpecificTimeControls(true);
  }

  const options = stationOptions(state.lineId);
  const start = options.find(({ name }) => name === state.startName) ?? null;
  const end = options.find(({ name }) => name === state.endName) ?? null;
  if (start) origin.setSelection(start);
  if (end && (!start || resolveRouteLine(start, end, state.lineId))) destination.setSelection(end);
  syncStationScopes();
}

function setLine(lineId, { clearRoute = false } = {}) {
  const radio = form.querySelector(`input[name="line"][value="${lineId}"]`);
  if (radio) radio.checked = true;
  origin.setLine("all");
  destination.setLine(lineId);
  document.body.dataset.line = lineId;
  routeLineLabel.textContent = lineId === "all" ? t("allSupported") : LINE_NAMES[currentLanguage][lineId];
  assumption.textContent = lineId === "all"
    ? t("assumptionAll")
    : t("assumptionLine", { line: LINE_NAMES[currentLanguage][lineId] });
  if (clearRoute) {
    origin.clear();
    destination.clear();
  }
}

function syncStationScopes() {
  const lineId = selectedLineId();
  const start = origin.getSelection();
  origin.setLine("all");
  destination.setLine(lineId === "all" && start ? start.lineIds : lineId);
}

function handleOriginSelect(option) {
  if (selectedLineId() !== "all" && !option.lineIds.includes(selectedLineId())) {
    setLine("all");
  }
  const destinationSelection = destination.getSelection();
  if (destinationSelection && !resolveRouteLine(option, destinationSelection, selectedLineId())) {
    destination.clear();
  }
  syncStationScopes();
  renderRecommendation();
  animateRecommendation();
  window.requestAnimationFrame(() => destination.focusAndOpen());
}

function handleOriginInput() {
  syncStationScopes();
  renderRecommendation();
}

function handleDestinationSelect(option) {
  if (selectedLineId() !== "all" && !option.lineIds.includes(selectedLineId())) {
    setLine("all");
  }
  syncStationScopes();
  renderRecommendation();
  animateRecommendation();
  if (!origin.getSelection()) window.requestAnimationFrame(() => origin.focusAndOpen());
}

function handleDestinationInput() {
  syncStationScopes();
  renderRecommendation();
}

function handleSchematicStationSelect(option) {
  const start = origin.getSelection();
  const end = destination.getSelection();
  setLine(option.lineId);

  if (!start) {
    origin.setSelection(option);
    if (end && (end.lineId !== option.lineId || end.name === option.name)) destination.clear();
  } else if (!end) {
    if (start.name === option.name) return;
    destination.setSelection(option);
  } else {
    origin.setSelection(option);
    destination.clear();
  }
  renderRecommendation();
}

function sideContent(side) {
  if (side === "left") return { label: t("sideLeft"), arrow: "←" };
  if (side === "right") return { label: t("sideRight"), arrow: "→" };
  return { label: t("sideEither"), arrow: "↔" };
}

function renderNightResult({ recommendation, routeLineId, routeDirection, startCode, endCode, departureDate }) {
  stopPhoneCompass();
  let relevantSunset = recommendation.solarEvents.sunset;
  if (recommendation.solarEvents.sunrise && departureDate < recommendation.solarEvents.sunrise) {
    relevantSunset = calculateSolarEvents(new Date(departureDate.getTime() - 86400000)).sunset;
  }
  const sunsetText = relevantSunset ? formatTokyoClockTime(relevantSunset) : t("unavailable");
  const lineName = LINE_NAMES[currentLanguage][routeLineId];

  result.dataset.state = "night";
  delete result.dataset.side;
  resultContent.innerHTML = `
    <div class="result-heading">
      <span class="result-label">${t("nightJourney")}</span>
      <span class="line-badge line-badge-${routeLineId}" aria-label="${lineName}" title="${lineName}">${LINES[routeLineId].code}</span>
    </div>
    <div class="answer night-answer">
      <span class="side-arrow night-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z"></path></svg>
      </span>
      <div><h2>${t("nightTitle")}</h2><p>${resultEndpointMarkup("origin", recommendation.start, startCode)} → ${resultEndpointMarkup("destination", recommendation.end, endCode)}</p></div>
    </div>
    <div class="confidence-row night-meta">
      <span class="night-status">${t("belowHorizon")}</span>
      <span>${routeDirection}</span>
    </div>
    <p class="reason">${t("nightReason")}</p>
    <div class="night-fact">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 18h12M4 14h16M12 3v7M8.5 6.5 12 10l3.5-3.5"></path></svg>
      <div><span>${t("previousSunset")}</span><strong>${sunsetText}</strong><small>${t("calculatedLocally")}</small></div>
    </div>`;
  bindResultMapEndpoints();
}

function stopPhoneCompass() {
  activeTrainHeading = null;
  if (phoneCompass.listening) phoneCompass.stop();
}

function handlePhoneCompassState(state) {
  phoneCompassState = state;
  renderPhoneCompassState();
}

function phoneAlignmentText(trainHeading, phoneHeading) {
  const difference = signedHeadingDifference(trainHeading, phoneHeading);
  const absoluteDifference = Math.round(Math.abs(difference));
  if (absoluteDifference <= 5) return t("alignExact");
  return t("alignOffset", { degrees: absoluteDifference, side: t(difference > 0 ? "right" : "left") });
}

function renderPhoneCompassState() {
  const button = document.querySelector("#phone-compass-button");
  if (!button) return;
  const buttonLabel = button.querySelector("span");
  const status = document.querySelector("#phone-compass-status");
  const vector = document.querySelector("#phone-vector");
  const legend = document.querySelector("#phone-legend");
  const row = document.querySelector("#phone-direction-row");
  const plot = document.querySelector(".orientation-plot");
  const isRunning = ["waiting", "active"].includes(phoneCompassState.status);
  const hasHeading = phoneCompassState.status === "active" && Number.isFinite(phoneCompassState.heading);

  button.disabled = phoneCompassState.status === "requesting" || phoneCompassState.status === "unsupported";
  button.dataset.active = String(isRunning);
  buttonLabel.textContent = phoneCompassState.status === "requesting"
    ? t("requestCompass")
    : isRunning ? t("stopCompass") : phoneCompassState.status === "unsupported" ? t("compassUnavailable") : t("useCompass");

  const statusMessages = {
    idle: "",
    requesting: t("sensorRequest"),
    waiting: t("sensorWaiting"),
    active: t("sensorActive"),
    denied: t("sensorDenied"),
    unsupported: t("sensorUnsupported"),
  };
  status.textContent = statusMessages[phoneCompassState.status] ?? t("sensorUnsupported");
  status.dataset.state = phoneCompassState.status;
  vector.hidden = !hasHeading;
  legend.hidden = !hasHeading;
  row.hidden = !hasHeading;

  if (!hasHeading || !Number.isFinite(activeTrainHeading)) {
    if (plot) plot.setAttribute("aria-label", plot.dataset.baseLabel);
    return;
  }

  const heading = phoneCompassState.heading;
  const direction = localizedDirection(describeBearing(heading));
  const headingDegrees = Math.round(heading);
  vector.style.setProperty("--phone-angle", `${heading}deg`);
  document.querySelector("#phone-direction-label").innerHTML = `${direction.label} <span>${direction.short}</span>`;
  document.querySelector("#phone-direction-detail").textContent = `${t("clockwise", { degrees: headingDegrees })} · ${phoneAlignmentText(activeTrainHeading, heading)}`;
  plot.setAttribute("aria-label", `${plot.dataset.baseLabel}, ${t("phonePoints")}: ${direction.label}`);
}

function bindPhoneCompassControls() {
  const button = document.querySelector("#phone-compass-button");
  if (!button) return;
  button.addEventListener("click", () => {
    if (["waiting", "active"].includes(phoneCompassState.status)) phoneCompass.stop();
    else phoneCompass.start();
  });
  renderPhoneCompassState();
}

function renderRoutePrompt() {
  stopPhoneCompass();
  const start = origin.getSelection();
  const end = destination.getSelection();
  const next = start ? t("chooseDestination") : t("startOrigin");
  const detail = start
    ? t("promptDestination")
    : t("promptOrigin");

  origin.input.setAttribute("aria-invalid", String(Boolean(origin.input.value && !start)));
  destination.input.setAttribute("aria-invalid", String(Boolean(destination.input.value && !end)));
  result.dataset.state = "empty";
  delete result.dataset.side;
  updateResultTimeControl(new Date(), false);
  resultContent.innerHTML = `
    <div class="result-heading"><span class="result-label">${t("shadeRecommendation")}</span><span class="result-step">01 → 02</span></div>
    <div class="empty-answer"><span class="empty-marker" aria-hidden="true">+</span><div><h2>${next}</h2><p>${detail}</p></div></div>`;
}

function animateRecommendation() {
  resultContent.classList.remove("is-entering");
  void resultContent.offsetWidth;
  resultContent.classList.add("is-entering");
}

function renderRecommendation({ syncUrl = true, saveRecent = true } = {}) {
  nowLabel.textContent = `${t("now")} · ${formatClockTime(new Date())}`;
  const start = origin.getSelection();
  const end = destination.getSelection();
  const routeLineId = resolveRouteLine(start, end, selectedLineId());
  stationMap.highlightEndpoint("origin", false);
  stationMap.highlightEndpoint("destination", false);
  stationMap.render(selectedLineId(), start, end, routeLineId);
  if (!start || !end || !routeLineId) {
    stationMap.clearTripOverlay();
    renderRoutePrompt();
    syncTripUrl();
    return;
  }

  try {
    const departureDate = selectedDate();
    const route = getRoutePath(routeLineId, start.name, end.name);
    const recommendation = getRecommendation({
      lineId: routeLineId,
      startName: start.name,
      endName: end.name,
      date: departureDate,
    });
    stationMap.updateTripOverlay({
      routeLineId,
      routeStations: route.stations,
      sunAzimuth: recommendation.sun.azimuth,
      isNight: recommendation.isNight,
    });
    const side = sideContent(recommendation.side);
    const headingDirection = localizedDirection(describeBearing(recommendation.heading));
    const sunDirection = localizedDirection(describeBearing(recommendation.sun.azimuth));
    const sunHeight = localizedSunHeight(recommendation.sun.elevation);
    const headingDegrees = Math.round(recommendation.heading);
    const sunAzimuthDegrees = Math.round(recommendation.sun.azimuth);
    const sunElevationDegrees = Math.round(recommendation.sun.elevation);
    const routeDirection = routeLineId === "yamanote"
      ? t(recommendation.direction.startsWith("clockwise") ? "outerLoop" : "innerLoop", { direction: headingDirection.short })
      : t("bound", { direction: headingDirection.short });
    const startCode = stationCodeFor(routeLineId, start.name);
    const endCode = stationCodeFor(routeLineId, end.name);
    updateResultTimeControl(departureDate, true);
    if (syncUrl) syncTripUrl(departureDate);
    if (saveRecent) rememberRecentRoute(routeLineId, start, end, departureDate);

    if (recommendation.isNight) {
      renderNightResult({ recommendation, routeLineId, routeDirection, startCode, endCode, departureDate });
      return;
    }

    result.dataset.state = "ready";
    result.dataset.side = recommendation.side;
    resultContent.innerHTML = `
      <div class="result-heading">
        <span class="result-label">${t("bestShade")}</span>
        <span class="line-badge line-badge-${routeLineId}" aria-label="${LINE_NAMES[currentLanguage][routeLineId]}" title="${LINE_NAMES[currentLanguage][routeLineId]}">${LINES[routeLineId].code}</span>
      </div>
      <div class="answer">
        <span class="side-arrow" aria-hidden="true">${side.arrow}</span>
        <div><h2>${side.label}</h2><p>${resultEndpointMarkup("origin", recommendation.start, startCode)} → ${resultEndpointMarkup("destination", recommendation.end, endCode)}</p></div>
      </div>
      <div class="confidence-row">
        <span class="confidence confidence-${recommendation.confidence}">${t("confidence", { level: t(recommendation.confidence) })}</span>
        <span>${routeDirection}</span>
      </div>
      <p class="reason">${recommendation.side === "left" ? t("reasonLeft") : recommendation.side === "right" ? t("reasonRight") : recommendation.sun.elevation < 8 ? t("reasonLow") : t("reasonAligned")}</p>
      <details class="result-details" open>
        <summary>${t("why")}</summary>
        <div class="orientation-layout">
          <div class="orientation-plot" style="--train-angle: ${headingDegrees}deg; --sun-angle: ${sunAzimuthDegrees}deg" role="img" data-base-label="Top-down compass: train heading ${headingDirection.label}, sun toward ${sunDirection.label}" aria-label="Top-down compass: train heading ${headingDirection.label}, sun toward ${sunDirection.label}">
            <span class="compass-label compass-n">N</span><span class="compass-label compass-e">E</span><span class="compass-label compass-s">S</span><span class="compass-label compass-w">W</span>
            <span class="compass-vector train-vector" aria-hidden="true">
              <svg class="vector-symbol" viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="15" rx="3"></rect><path d="M8 7h8M8 12h.01M16 12h.01M8 18l-2 3M16 18l2 3"></path></svg>
            </span>
            <span class="compass-vector sun-vector" aria-hidden="true">
              <svg class="vector-symbol" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path></svg>
            </span>
            <span id="phone-vector" class="compass-vector phone-vector" aria-hidden="true" hidden>
              <svg class="vector-symbol" viewBox="0 0 24 24"><rect x="7" y="2.5" width="10" height="19" rx="2"></rect><path d="M10 5h4M11 18.5h2"></path></svg>
            </span>
            <span class="compass-center" aria-hidden="true"></span>
          </div>
          <div class="orientation-side">
            <div class="orientation-legend">
              <span><svg class="legend-icon train-key" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="15" rx="3"></rect><path d="M8 7h8M8 12h.01M16 12h.01M8 18l-2 3M16 18l2 3"></path></svg>${t("train")}</span>
              <span><svg class="legend-icon sun-key" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path></svg>${t("sun")}</span>
              <span id="phone-legend" hidden><svg class="legend-icon phone-key" viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2"></rect><path d="M10 5h4M11 18.5h2"></path></svg>${t("phone")}</span>
            </div>
            <button id="phone-compass-button" class="phone-compass-button" type="button" data-active="false">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="m15 9-2 5-5 2 2-5 5-2Z"></path></svg>
              <span>${t("useCompass")}</span>
            </button>
            <p id="phone-compass-status" class="phone-compass-status" aria-live="polite"></p>
          </div>
        </div>
        <dl class="direction-data">
          <div><dt>${t("trainHeading")}</dt><dd><strong>${headingDirection.label} <span>${headingDirection.short}</span></strong><small>${t("clockwise", { degrees: headingDegrees })}</small></dd></div>
          <div><dt>${t("sunToward")}</dt><dd><strong>${sunDirection.label} <span>${sunDirection.short}</span></strong><small>${t("clockwise", { degrees: sunAzimuthDegrees })}</small></dd></div>
          <div><dt>${t("sunHeight")}</dt><dd><strong>${sunHeight}</strong><small>${t("aboveHorizon", { degrees: sunElevationDegrees })}</small></dd></div>
          <div id="phone-direction-row" hidden><dt>${t("phonePoints")}</dt><dd><strong id="phone-direction-label"></strong><small id="phone-direction-detail"></small></dd></div>
        </dl>
        <p class="bearing-note">${t("bearingNote")}</p>
      </details>`;
    activeTrainHeading = recommendation.heading;
    bindResultMapEndpoints();
    bindPhoneCompassControls();
  } catch (error) {
    stopPhoneCompass();
    stationMap.clearTripOverlay();
    result.dataset.state = "error";
    updateResultTimeControl(new Date(), false);
    resultContent.innerHTML = `<div class="result-heading"><span class="result-label">${t("routeNeeded")}</span></div><div class="empty-answer"><span class="empty-marker" aria-hidden="true">!</span><div><h2>${t("chooseTwo")}</h2><p>${error.message}</p></div></div>`;
  }
}

function renderRecentRoutes() {
  recentRoutesSection.hidden = recentRoutes.length === 0;
  recentRouteList.replaceChildren();
  recentRoutes.forEach((route) => {
    const options = stationOptions(route.lineId);
    const start = options.find(({ name }) => name === route.startName);
    const end = options.find(({ name }) => name === route.endName);
    const date = parseTokyoDateTime(route.at);
    if (!start || !end || !date || !LINES[route.lineId]) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "recent-route";
    button.innerHTML = `
      <span class="line-badge line-badge-${route.lineId}">${LINES[route.lineId].code}</span>
      <span class="recent-route-names">${localizedStationName(start)} → ${localizedStationName(end)}</span>
      <span class="recent-route-time">${formatResultTime(date)}</span>`;
    button.addEventListener("click", () => restoreRecentRoute(route));
    recentRouteList.append(button);
  });
}

function rememberRecentRoute(lineId, start, end, date) {
  const at = formatTokyoDateTime(date);
  recentRoutes = addRecentRoute(recentRoutes, {
    lineId,
    startName: start.name,
    endName: end.name,
    at,
    viewedAt: new Date().toISOString(),
  });
  writeStorage(RECENT_ROUTES_KEY, JSON.stringify(recentRoutes));
  renderRecentRoutes();
}

function restoreRecentRoute(route) {
  const options = stationOptions(route.lineId);
  const start = options.find(({ name }) => name === route.startName);
  const end = options.find(({ name }) => name === route.endName);
  const date = parseTokyoDateTime(route.at);
  if (!start || !end || !date) return;
  setLine(route.lineId);
  origin.setSelection(start);
  destination.setSelection(end);
  form.elements["time-mode"].value = "specific";
  setSpecificDate(date);
  setSpecificTimeControls(true);
  syncStationScopes();
  renderRecommendation();
  result.scrollIntoView({ behavior: "smooth", block: "start" });
}

function setLanguage(language) {
  if (!["en", "ja"].includes(language) || language === currentLanguage) return;
  currentLanguage = language;
  writeStorage(LANGUAGE_KEY, language);
  applyStaticTranslations();
  origin.setSelection(origin.getSelection());
  destination.setSelection(destination.getSelection());
  setLine(selectedLineId());
  renderRecentRoutes();
  renderRecommendation();
}

function setTimeMode() {
  const isSpecific = !usesCurrentTime();
  setSpecificTimeControls(isSpecific);
  renderRecommendation();
}

function applyTimePreset(preset) {
  form.elements["time-mode"].value = "specific";
  setSpecificDate(departurePreset(new Date(), preset));
  setTimeMode();
}

function applyResultSliderTime() {
  const baseDate = formatTokyoDateTime(selectedDate()).slice(0, 10);
  const date = parseTokyoDateTime(`${baseDate}T${minutesToClock(resultTimeSlider.value)}`);
  if (!date) return;
  form.elements["time-mode"].value = "specific";
  setSpecificDate(date);
  setSpecificTimeControls(true);
  shareStatus.textContent = "";
  renderRecommendation({ syncUrl: false, saveRecent: false });
}

function commitResultSliderTime() {
  renderRecommendation();
}

async function copyResultLink() {
  syncTripUrl(selectedDate());
  const link = window.location.href;
  let copied = false;
  try {
    await navigator.clipboard.writeText(link);
    copied = true;
  } catch {
    const temporary = document.createElement("textarea");
    temporary.value = link;
    temporary.setAttribute("readonly", "");
    temporary.style.position = "fixed";
    temporary.style.opacity = "0";
    document.body.append(temporary);
    temporary.select();
    copied = document.execCommand("copy");
    temporary.remove();
  }
  shareStatus.textContent = copied
    ? t("linkCopied")
    : t("copyFailed");
}

function swapRoute() {
  const start = origin.getSelection();
  const end = destination.getSelection();
  if (end) origin.setSelection(end);
  else origin.clear();
  if (start) destination.setSelection(start);
  else destination.clear();
  syncStationScopes();
  renderRecommendation();
  animateRecommendation();
  if (!origin.getSelection() || !destination.getSelection()) {
    const emptyCombobox = origin.getSelection() ? destination : origin;
    window.requestAnimationFrame(() => emptyCombobox.focusAndOpen());
  }
}

function formatDistance(distanceKm) {
  if (distanceKm < 1) return `${Math.max(10, Math.round(distanceKm * 1000 / 10) * 10)} m`;
  return `${distanceKm.toFixed(1)} km`;
}

function locationErrorMessage(error) {
  if (error.code === 1) return t("locationDenied");
  if (error.code === 2) return t("locationUnavailable");
  if (error.code === 3) return t("locationTimeout");
  return t("locationError");
}

function useClosestStation() {
  if (!navigator.geolocation) {
    locationStatus.dataset.state = "error";
    locationStatus.textContent = t("locationUnsupported");
    return;
  }
  locateButton.disabled = true;
  locateButton.dataset.loading = "true";
  locationStatus.dataset.state = "loading";
  locationStatus.textContent = t("locating");
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      const requestedLineId = selectedLineId();
      const closest = findClosestStation(requestedLineId, coords.latitude, coords.longitude);
      const destinationSelection = destination.getSelection();
      origin.setSelection(closest.station);
      if (destinationSelection && !resolveRouteLine(closest.station, destinationSelection, requestedLineId)) {
        destination.clear();
      }
      syncStationScopes();
      locationStatus.dataset.state = "success";
      const locationContext = requestedLineId === "all"
        ? t("servedBy", { codes: closest.station.stationCodes.join(", ") })
        : LINE_NAMES[currentLanguage][requestedLineId];
      locationStatus.textContent = t("closestResult", {
        name: closest.station.name,
        nameJa: closest.station.nameJa,
        context: locationContext,
        distance: formatDistance(closest.distanceKm),
      });
      locateButton.disabled = false;
      delete locateButton.dataset.loading;
      renderRecommendation();
      if (!destination.getSelection()) window.requestAnimationFrame(() => destination.focusAndOpen());
    },
    (error) => {
      locationStatus.dataset.state = "error";
      locationStatus.textContent = locationErrorMessage(error);
      locateButton.disabled = false;
      delete locateButton.dataset.loading;
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
  );
}

writeStorage(LANGUAGE_KEY, currentLanguage);
applyStaticTranslations();
setSpecificDate(new Date());
hydrateTripState();
renderRecentRoutes();
renderRecommendation();

form.addEventListener("change", (event) => {
  if (event.target.name === "line") {
    setLine(event.target.value);
    locationStatus.textContent = "";
    delete locationStatus.dataset.state;
    renderRecommendation();
    return;
  }
  if (event.target.name === "time-mode") {
    setTimeMode();
    return;
  }
  renderRecommendation();
});
form.addEventListener("submit", (event) => event.preventDefault());
swapButton.addEventListener("click", swapRoute);
locateButton.addEventListener("click", useClosestStation);
resultTimeSlider.addEventListener("input", applyResultSliderTime);
resultTimeSlider.addEventListener("change", commitResultSliderTime);
shareButton.addEventListener("click", copyResultLink);
document.querySelectorAll("[data-language]").forEach((button) => {
  button.addEventListener("click", () => setLanguage(button.dataset.language));
});
clearRecentRoutesButton.addEventListener("click", () => {
  recentRoutes = [];
  writeStorage(RECENT_ROUTES_KEY, "[]");
  renderRecentRoutes();
});
document.addEventListener("keydown", (event) => {
  if (!shouldFocusOriginForTyping(event, document.activeElement)) return;
  origin.input.focus();
  origin.input.select();
});
document.querySelectorAll("[data-time-preset]").forEach((button) => {
  button.addEventListener("click", () => applyTimePreset(button.dataset.timePreset));
});
