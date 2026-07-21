import { LINES, getRecommendation, stationNamesForLine } from "./shade.js";

const lineSelect = document.querySelector("#line");
const startSelect = document.querySelector("#start");
const endSelect = document.querySelector("#end");
const useNowCheckbox = document.querySelector("#use-now");
const timeInput = document.querySelector("#time");
const form = document.querySelector("#shade-form");
const result = document.querySelector("#result");
const assumption = document.querySelector("#assumption");

function toDatetimeLocalValue(date) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

function populateLines() {
  lineSelect.innerHTML = Object.entries(LINES)
    .map(([id, line]) => `<option value="${id}">${line.name}</option>`)
    .join("");
}

function populateStations() {
  const names = stationNamesForLine(lineSelect.value);
  startSelect.innerHTML = names
    .map((name, index) => `<option value="${name}" ${index === 0 ? "selected" : ""}>${name}</option>`)
    .join("");
  endSelect.innerHTML = names
    .map((name, index) => `<option value="${name}" ${index === Math.min(3, names.length - 1) ? "selected" : ""}>${name}</option>`)
    .join("");
  assumption.textContent = LINES[lineSelect.value].assumption;
}

function selectedDate() {
  return useNowCheckbox.checked || !timeInput.value ? new Date() : new Date(timeInput.value);
}

function sideLabel(side) {
  if (side === "left") return "Sit on the left side";
  if (side === "right") return "Sit on the right side";
  return "No meaningful difference";
}

function renderRecommendation(event) {
  event?.preventDefault();
  try {
    const recommendation = getRecommendation({
      lineId: lineSelect.value,
      startName: startSelect.value,
      endName: endSelect.value,
      date: selectedDate(),
    });

    result.hidden = false;
    result.className = `result result-${recommendation.side}`;
    result.innerHTML = `
      <p class="eyebrow">${recommendation.lineName}</p>
      <h2>${sideLabel(recommendation.side)}</h2>
      <p>${recommendation.reason}</p>
      <dl>
        <div><dt>Direction</dt><dd>${recommendation.direction}</dd></div>
        <div><dt>Train heading</dt><dd>${Math.round(recommendation.heading)} degrees</dd></div>
        <div><dt>Sun position</dt><dd>${Math.round(recommendation.sun.azimuth)} degrees azimuth, ${Math.round(recommendation.sun.elevation)} degrees elevation</dd></div>
        <div><dt>Confidence</dt><dd>${recommendation.confidence}</dd></div>
      </dl>
    `;
  } catch (error) {
    result.hidden = false;
    result.className = "result result-none";
    result.innerHTML = `<h2>Check your stations</h2><p>${error.message}</p>`;
  }
}

populateLines();
populateStations();
timeInput.value = toDatetimeLocalValue(new Date());
timeInput.disabled = useNowCheckbox.checked;
renderRecommendation();

lineSelect.addEventListener("change", () => {
  populateStations();
  renderRecommendation();
});
useNowCheckbox.addEventListener("change", () => {
  timeInput.disabled = useNowCheckbox.checked;
  if (useNowCheckbox.checked) {
    timeInput.value = toDatetimeLocalValue(new Date());
  }
  renderRecommendation();
});
timeInput.addEventListener("change", renderRecommendation);
startSelect.addEventListener("change", renderRecommendation);
endSelect.addEventListener("change", renderRecommendation);
form.addEventListener("submit", renderRecommendation);
