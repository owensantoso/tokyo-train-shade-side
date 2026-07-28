const TOKYO_TIME_ZONE = "Asia/Tokyo";
const TOKYO_OFFSET = "+09:00";

function tokyoParts(date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TOKYO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
}

export function clockToMinutes(value) {
  const match = /^(\d{2}):(\d{2})$/.exec(value ?? "");
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function minutesToClock(value) {
  const minutes = Math.max(0, Math.min(1439, Math.round(Number(value) || 0)));
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

export function formatTokyoDateTime(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  const { year, month, day, hour, minute } = tokyoParts(date);
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

export function parseTokyoDateTime(value) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value ?? "")) return null;
  const date = new Date(`${value}:00${TOKYO_OFFSET}`);
  if (Number.isNaN(date.getTime()) || formatTokyoDateTime(date) !== value) return null;
  return date;
}

export function serializeTripState({ language, lineId = "all", startName, endName, date } = {}) {
  const params = new URLSearchParams();
  if (["en", "ja"].includes(language)) params.set("lang", language);
  params.set("line", lineId);
  if (startName) params.set("from", startName);
  if (endName) params.set("to", endName);
  const timestamp = formatTokyoDateTime(date);
  if (timestamp) params.set("at", timestamp);
  return params.toString();
}

export function parseTripState(search, allowedLineIds) {
  const params = new URLSearchParams(search);
  const requestedLine = params.get("line");
  return {
    language: ["en", "ja"].includes(params.get("lang")) ? params.get("lang") : null,
    lineId: allowedLineIds.includes(requestedLine) ? requestedLine : "all",
    startName: params.get("from") || null,
    endName: params.get("to") || null,
    date: parseTokyoDateTime(params.get("at")),
  };
}
