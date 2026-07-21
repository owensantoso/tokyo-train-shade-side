export const TOKYO = {
  lat: 35.6762,
  lon: 139.6503,
};

export const LINES = {
  keio: {
    name: "Keio Line / Keio New Line",
    assumption:
      "Models the Keio New Line path from Shinjuku through Hatsudai and Hatagaya to Sasazuka, then the main Keio Line toward Keio-Hachioji. Branches and express stopping patterns are omitted.",
    stations: [
      { name: "Shinjuku", lat: 35.6901, lon: 139.7006 },
      { name: "Hatsudai", lat: 35.6814, lon: 139.6865 },
      { name: "Hatagaya", lat: 35.6772, lon: 139.6764 },
      { name: "Sasazuka", lat: 35.6737, lon: 139.6674 },
      { name: "Daitabashi", lat: 35.6706, lon: 139.6614 },
      { name: "Meidaimae", lat: 35.6687, lon: 139.6503 },
      { name: "Shimotakaido", lat: 35.6662, lon: 139.6424 },
      { name: "Sakurajosui", lat: 35.6675, lon: 139.6313 },
      { name: "Kami-Kitazawa", lat: 35.6686, lon: 139.6237 },
      { name: "Hachiman-yama", lat: 35.6699, lon: 139.6158 },
      { name: "Roka-koen", lat: 35.6709, lon: 139.6089 },
      { name: "Chitose-Karasuyama", lat: 35.6679, lon: 139.6006 },
      { name: "Sengawa", lat: 35.6622, lon: 139.5849 },
      { name: "Tsutsujigaoka", lat: 35.6579, lon: 139.5755 },
      { name: "Shibasaki", lat: 35.6548, lon: 139.5666 },
      { name: "Kokuryo", lat: 35.6506, lon: 139.5586 },
      { name: "Fuda", lat: 35.6498, lon: 139.5518 },
      { name: "Chofu", lat: 35.6517, lon: 139.5447 },
      { name: "Nishi-Chofu", lat: 35.6571, lon: 139.5295 },
      { name: "Tobitakyu", lat: 35.6605, lon: 139.5234 },
      { name: "Musashinodai", lat: 35.6641, lon: 139.5116 },
      { name: "Tama-reien", lat: 35.6668, lon: 139.5003 },
      { name: "Higashi-Fuchu", lat: 35.6689, lon: 139.4952 },
      { name: "Fuchu", lat: 35.6721, lon: 139.4809 },
      { name: "Bubaigawara", lat: 35.6685, lon: 139.4689 },
      { name: "Nakagawara", lat: 35.6588, lon: 139.4574 },
      { name: "Seiseki-Sakuragaoka", lat: 35.6507, lon: 139.4473 },
      { name: "Mogusaen", lat: 35.6572, lon: 139.4312 },
      { name: "Takahatafudo", lat: 35.6622, lon: 139.4139 },
      { name: "Minamidaira", lat: 35.6555, lon: 139.3924 },
      { name: "Hirayamajoshi-koen", lat: 35.6476, lon: 139.3799 },
      { name: "Naganuma", lat: 35.6426, lon: 139.3657 },
      { name: "Kitano", lat: 35.644, lon: 139.3541 },
      { name: "Keio-Hachioji", lat: 35.6576, lon: 139.3434 },
    ],
  },
  inokashira: {
    name: "Inokashira Line",
    assumption:
      "Models the Inokashira Line from Shibuya to Kichijoji with no transfers or live service details.",
    stations: [
      { name: "Shibuya", lat: 35.658, lon: 139.7016 },
      { name: "Shinsen", lat: 35.6578, lon: 139.6931 },
      { name: "Komaba-todaimae", lat: 35.6587, lon: 139.6841 },
      { name: "Ikenoue", lat: 35.6615, lon: 139.6762 },
      { name: "Shimokitazawa", lat: 35.6617, lon: 139.6667 },
      { name: "Shindaita", lat: 35.6625, lon: 139.661 },
      { name: "Higashi-matsubara", lat: 35.6627, lon: 139.6555 },
      { name: "Meidaimae", lat: 35.6687, lon: 139.6503 },
      { name: "Eifukucho", lat: 35.6767, lon: 139.6421 },
      { name: "Nishi-eifuku", lat: 35.678, lon: 139.6344 },
      { name: "Hamadayama", lat: 35.6815, lon: 139.6274 },
      { name: "Takaido", lat: 35.6831, lon: 139.6157 },
      { name: "Fujimigaoka", lat: 35.6841, lon: 139.6072 },
      { name: "Kugayama", lat: 35.6863, lon: 139.5996 },
      { name: "Mitakadai", lat: 35.692, lon: 139.5893 },
      { name: "Inokashira-koen", lat: 35.6973, lon: 139.5836 },
      { name: "Kichijoji", lat: 35.7031, lon: 139.5797 },
    ],
  },
};

const toRadians = (degrees) => (degrees * Math.PI) / 180;
const toDegrees = (radians) => (radians * 180) / Math.PI;
const normalizeDegrees = (degrees) => ((degrees % 360) + 360) % 360;
const normalizeSignedDegrees = (degrees) => {
  const normalized = normalizeDegrees(degrees);
  return normalized > 180 ? normalized - 360 : normalized;
};

export function stationNamesForLine(lineId) {
  return LINES[lineId].stations.map((station) => station.name);
}

export function findStation(lineId, stationName) {
  return LINES[lineId].stations.find((station) => station.name === stationName);
}

export function calculateBearing(start, end) {
  const lat1 = toRadians(start.lat);
  const lat2 = toRadians(end.lat);
  const deltaLon = toRadians(end.lon - start.lon);
  const y = Math.sin(deltaLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);
  return normalizeDegrees(toDegrees(Math.atan2(y, x)));
}

export function calculateSunPosition(date, { lat = TOKYO.lat, lon = TOKYO.lon } = {}) {
  const julianDay = date.getTime() / 86400000 + 2440587.5;
  const n = julianDay - 2451545;
  const meanLongitude = normalizeDegrees(280.46 + 0.9856474 * n);
  const meanAnomaly = normalizeDegrees(357.528 + 0.9856003 * n);
  const lambda = normalizeDegrees(
    meanLongitude +
      1.915 * Math.sin(toRadians(meanAnomaly)) +
      0.02 * Math.sin(toRadians(2 * meanAnomaly)),
  );
  const obliquity = 23.439 - 0.0000004 * n;
  const rightAscension = normalizeDegrees(
    toDegrees(
      Math.atan2(
        Math.cos(toRadians(obliquity)) * Math.sin(toRadians(lambda)),
        Math.cos(toRadians(lambda)),
      ),
    ),
  );
  const declination = toDegrees(
    Math.asin(Math.sin(toRadians(obliquity)) * Math.sin(toRadians(lambda))),
  );
  const gmst = normalizeDegrees(280.46061837 + 360.98564736629 * (julianDay - 2451545));
  const localSiderealTime = normalizeDegrees(gmst + lon);
  const hourAngle = normalizeSignedDegrees(localSiderealTime - rightAscension);

  const latRad = toRadians(lat);
  const declinationRad = toRadians(declination);
  const hourAngleRad = toRadians(hourAngle);
  const elevation = toDegrees(
    Math.asin(
      Math.sin(latRad) * Math.sin(declinationRad) +
        Math.cos(latRad) * Math.cos(declinationRad) * Math.cos(hourAngleRad),
    ),
  );
  const azimuth = normalizeDegrees(
    toDegrees(
      Math.atan2(
        -Math.sin(hourAngleRad),
        Math.tan(declinationRad) * Math.cos(latRad) -
          Math.sin(latRad) * Math.cos(hourAngleRad),
      ),
    ),
  );

  return { azimuth, elevation };
}

export function recommendShadeSide({ heading, sunAzimuth, sunElevation }) {
  const relativeSunAngle = normalizeSignedDegrees(sunAzimuth - heading);
  const absoluteSideAngle = Math.abs(relativeSunAngle);

  if (sunElevation < 5) {
    return {
      side: "none",
      confidence: "low",
      reason: "The sun is low enough that buildings, station structures, and train orientation matter more than side choice.",
      relativeSunAngle,
    };
  }

  if (absoluteSideAngle < 25 || absoluteSideAngle > 155) {
    return {
      side: "none",
      confidence: "low",
      reason: "The sun is mostly ahead of or behind the train, so the left and right sides should be similar.",
      relativeSunAngle,
    };
  }

  const confidence = absoluteSideAngle > 60 && absoluteSideAngle < 120 ? "high" : "medium";
  const side = relativeSunAngle > 0 ? "left" : "right";
  const sunSide = relativeSunAngle > 0 ? "right" : "left";

  return {
    side,
    confidence,
    reason: `The sun is mainly on the train's ${sunSide} side, so the ${side} side should have less direct sun.`,
    relativeSunAngle,
  };
}

export function getRecommendation({ lineId, startName, endName, date }) {
  const start = findStation(lineId, startName);
  const end = findStation(lineId, endName);
  if (!start || !end || start.name === end.name) {
    throw new Error("Choose two different stations on the same line.");
  }

  const line = LINES[lineId];
  const startIndex = line.stations.indexOf(start);
  const endIndex = line.stations.indexOf(end);
  const heading = calculateBearing(start, end);
  const sun = calculateSunPosition(date);
  const recommendation = recommendShadeSide({
    heading,
    sunAzimuth: sun.azimuth,
    sunElevation: sun.elevation,
  });

  return {
    lineName: line.name,
    assumption: line.assumption,
    start,
    end,
    direction: endIndex > startIndex ? "outbound / away from central Tokyo" : "inbound / toward central Tokyo",
    heading,
    sun,
    ...recommendation,
  };
}
