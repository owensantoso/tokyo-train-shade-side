import {
  LINES,
  findClosestStation,
  getRecommendation,
  stationNamesForLine,
  swapStations,
} from "./shade.js";

const form = document.querySelector("#shade-form");
const startSelect = document.querySelector("#start");
const endSelect = document.querySelector("#end");
const swapButton = document.querySelector("#swap-stations");
const locateButton = document.querySelector("#locate-station");
const locationStatus = document.querySelector("#location-status");
const timeInput = document.querySelector("#time");
const specificTimeLabel = document.querySelector("#specific-time-label");
const nowLabel = document.querySelector("#now-label");
const result = document.querySelector("#result");
const assumption = document.querySelector("#assumption");

function selectedLineId() {
  return form.elements.line.value;
}

function usesCurrentTime() {
  return form.elements["time-mode"].value === "now";
}

function toDatetimeLocalValue(date) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

function formatClockTime(date) {
  return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(date);
}

function populateStations() {
  const lineId = selectedLineId();
  const names = stationNamesForLine(lineId);
  startSelect.innerHTML = names.map((name, index) =>
    `<option value="${name}" ${index === 0 ? "selected" : ""}>${name}</option>`).join("");
  endSelect.innerHTML = names.map((name, index) =>
    `<option value="${name}" ${index === Math.min(3, names.length - 1) ? "selected" : ""}>${name}</option>`).join("");
  assumption.textContent = LINES[lineId].assumption;
  document.body.dataset.line = lineId;
}

function selectedDate() {
  return usesCurrentTime() || !timeInput.value ? new Date() : new Date(timeInput.value);
}

function sideContent(side) {
  if (side === "left") return { label: "Sit on the left", arrow: "←" };
  if (side === "right") return { label: "Sit on the right", arrow: "→" };
  return { label: "Either side is similar", arrow: "↔" };
}

function renderRecommendation() {
  nowLabel.textContent = `Now · ${formatClockTime(new Date())}`;
  try {
    const recommendation = getRecommendation({
      lineId: selectedLineId(),
      startName: startSelect.value,
      endName: endSelect.value,
      date: selectedDate(),
    });
    const side = sideContent(recommendation.side);
    result.dataset.side = recommendation.side;
    result.innerHTML = `
      <div class="result-heading">
        <span class="result-label">Best shade</span>
        <span class="confidence confidence-${recommendation.confidence}">${recommendation.confidence} confidence</span>
      </div>
      <div class="answer">
        <span class="side-arrow" aria-hidden="true">${side.arrow}</span>
        <div><h2>${side.label}</h2><p>${recommendation.start.name} to ${recommendation.end.name}</p></div>
      </div>
      <p class="reason">${recommendation.reason}</p>
      <details class="result-details">
        <summary>Why this result</summary>
        <dl>
          <div><dt>Direction</dt><dd>${recommendation.direction}</dd></div>
          <div><dt>Train heading</dt><dd>${Math.round(recommendation.heading)}°</dd></div>
          <div><dt>Sun position</dt><dd>${Math.round(recommendation.sun.azimuth)}° azimuth · ${Math.round(recommendation.sun.elevation)}° elevation</dd></div>
        </dl>
      </details>`;
  } catch (error) {
    result.dataset.side = "error";
    result.innerHTML = `
      <div class="result-heading"><span class="result-label">Route needed</span></div>
      <div class="answer"><span class="side-arrow" aria-hidden="true">!</span><div><h2>Choose two stations</h2><p>${error.message}</p></div></div>`;
  }
}

function setTimeMode() {
  const isSpecific = !usesCurrentTime();
  specificTimeLabel.hidden = !isSpecific;
  timeInput.disabled = !isSpecific;
  if (!isSpecific) timeInput.value = toDatetimeLocalValue(new Date());
  renderRecommendation();
}

function swapRoute() {
  const swapped = swapStations(startSelect.value, endSelect.value);
  startSelect.value = swapped.startName;
  endSelect.value = swapped.endName;
  renderRecommendation();
}

function formatDistance(distanceKm) {
  if (distanceKm < 1) return `${Math.max(10, Math.round(distanceKm * 1000 / 10) * 10)} m`;
  return `${distanceKm.toFixed(1)} km`;
}

function locationErrorMessage(error) {
  if (error.code === error.PERMISSION_DENIED) return "Location access was denied. You can still choose a station manually.";
  if (error.code === error.POSITION_UNAVAILABLE) return "Your location is unavailable right now. Try again or choose manually.";
  if (error.code === error.TIMEOUT) return "Location took too long. Try again or choose manually.";
  return "Could not find your location. Try again or choose manually.";
}

function useClosestStation() {
  if (!navigator.geolocation) {
    locationStatus.dataset.state = "error";
    locationStatus.textContent = "This browser does not support location. Choose a station manually.";
    return;
  }
  locateButton.disabled = true;
  locateButton.dataset.loading = "true";
  locationStatus.dataset.state = "loading";
  locationStatus.textContent = "Finding your closest station…";
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      const lineId = selectedLineId();
      const closest = findClosestStation(lineId, coords.latitude, coords.longitude);
      startSelect.value = closest.station.name;
      locationStatus.dataset.state = "success";
      locationStatus.textContent = `Closest on ${LINES[lineId].name}: ${closest.station.name} · about ${formatDistance(closest.distanceKm)} away.`;
      locateButton.disabled = false;
      delete locateButton.dataset.loading;
      renderRecommendation();
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

populateStations();
timeInput.value = toDatetimeLocalValue(new Date());
renderRecommendation();

form.addEventListener("change", (event) => {
  if (event.target.name === "line") {
    populateStations();
    locationStatus.textContent = "";
    delete locationStatus.dataset.state;
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
