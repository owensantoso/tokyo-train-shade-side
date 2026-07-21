export const TOKYO = {
  lat: 35.6762,
  lon: 139.6503,
};

export const LINES = {
  keio: {
    name: "Keio Line / Keio New Line",
    shortName: "Keio + New",
    code: "KO",
    assumption:
      "Models the Keio New Line path from Shinjuku through Hatsudai and Hatagaya to Sasazuka, then the main Keio Line toward Keio-Hachioji. Branches and express stopping patterns are omitted.",
    stations: [
      { name: "Shinjuku", nameJa: "新宿", lat: 35.6901, lon: 139.7006 },
      { name: "Hatsudai", nameJa: "初台", lat: 35.6814, lon: 139.6865 },
      { name: "Hatagaya", nameJa: "幡ヶ谷", lat: 35.6772, lon: 139.6764 },
      { name: "Sasazuka", nameJa: "笹塚", lat: 35.6737, lon: 139.6674 },
      { name: "Daitabashi", nameJa: "代田橋", lat: 35.6706, lon: 139.6614 },
      { name: "Meidaimae", nameJa: "明大前", lat: 35.6687, lon: 139.6503 },
      { name: "Shimotakaido", nameJa: "下高井戸", lat: 35.6662, lon: 139.6424 },
      { name: "Sakurajosui", nameJa: "桜上水", lat: 35.6675, lon: 139.6313 },
      { name: "Kami-Kitazawa", nameJa: "上北沢", lat: 35.6686, lon: 139.6237 },
      { name: "Hachiman-yama", nameJa: "八幡山", lat: 35.6699, lon: 139.6158 },
      { name: "Roka-koen", nameJa: "芦花公園", lat: 35.6709, lon: 139.6089 },
      { name: "Chitose-Karasuyama", nameJa: "千歳烏山", lat: 35.6679, lon: 139.6006 },
      { name: "Sengawa", nameJa: "仙川", lat: 35.6622, lon: 139.5849 },
      { name: "Tsutsujigaoka", nameJa: "つつじヶ丘", lat: 35.6579, lon: 139.5755 },
      { name: "Shibasaki", nameJa: "柴崎", lat: 35.6548, lon: 139.5666 },
      { name: "Kokuryo", nameJa: "国領", lat: 35.6506, lon: 139.5586 },
      { name: "Fuda", nameJa: "布田", lat: 35.6498, lon: 139.5518 },
      { name: "Chofu", nameJa: "調布", lat: 35.6517, lon: 139.5447 },
      { name: "Nishi-Chofu", nameJa: "西調布", lat: 35.6571, lon: 139.5295 },
      { name: "Tobitakyu", nameJa: "飛田給", lat: 35.6605, lon: 139.5234 },
      { name: "Musashinodai", nameJa: "武蔵野台", lat: 35.6641, lon: 139.5116 },
      { name: "Tama-reien", nameJa: "多磨霊園", lat: 35.6668, lon: 139.5003 },
      { name: "Higashi-Fuchu", nameJa: "東府中", lat: 35.6689, lon: 139.4952 },
      { name: "Fuchu", nameJa: "府中", lat: 35.6721, lon: 139.4809 },
      { name: "Bubaigawara", nameJa: "分倍河原", lat: 35.6685, lon: 139.4689 },
      { name: "Nakagawara", nameJa: "中河原", lat: 35.6588, lon: 139.4574 },
      { name: "Seiseki-Sakuragaoka", nameJa: "聖蹟桜ヶ丘", lat: 35.6507, lon: 139.4473 },
      { name: "Mogusaen", nameJa: "百草園", lat: 35.6572, lon: 139.4312 },
      { name: "Takahatafudo", nameJa: "高幡不動", lat: 35.6622, lon: 139.4139 },
      { name: "Minamidaira", nameJa: "南平", lat: 35.6555, lon: 139.3924 },
      { name: "Hirayamajoshi-koen", nameJa: "平山城址公園", lat: 35.6476, lon: 139.3799 },
      { name: "Naganuma", nameJa: "長沼", lat: 35.6426, lon: 139.3657 },
      { name: "Kitano", nameJa: "北野", lat: 35.644, lon: 139.3541 },
      { name: "Keio-Hachioji", nameJa: "京王八王子", lat: 35.6576, lon: 139.3434 },
    ],
  },
  inokashira: {
    name: "Inokashira Line",
    shortName: "Inokashira",
    code: "IN",
    assumption:
      "Models the Inokashira Line from Shibuya to Kichijoji with no transfers or live service details.",
    stations: [
      { name: "Shibuya", nameJa: "渋谷", lat: 35.658, lon: 139.7016 },
      { name: "Shinsen", nameJa: "神泉", lat: 35.6578, lon: 139.6931 },
      { name: "Komaba-todaimae", nameJa: "駒場東大前", lat: 35.6587, lon: 139.6841 },
      { name: "Ikenoue", nameJa: "池ノ上", lat: 35.6615, lon: 139.6762 },
      { name: "Shimokitazawa", nameJa: "下北沢", lat: 35.6617, lon: 139.6667 },
      { name: "Shindaita", nameJa: "新代田", lat: 35.6625, lon: 139.661 },
      { name: "Higashi-matsubara", nameJa: "東松原", lat: 35.6627, lon: 139.6555 },
      { name: "Meidaimae", nameJa: "明大前", lat: 35.6687, lon: 139.6503 },
      { name: "Eifukucho", nameJa: "永福町", lat: 35.6767, lon: 139.6421 },
      { name: "Nishi-eifuku", nameJa: "西永福", lat: 35.678, lon: 139.6344 },
      { name: "Hamadayama", nameJa: "浜田山", lat: 35.6815, lon: 139.6274 },
      { name: "Takaido", nameJa: "高井戸", lat: 35.6831, lon: 139.6157 },
      { name: "Fujimigaoka", nameJa: "富士見ヶ丘", lat: 35.6841, lon: 139.6072 },
      { name: "Kugayama", nameJa: "久我山", lat: 35.6863, lon: 139.5996 },
      { name: "Mitakadai", nameJa: "三鷹台", lat: 35.692, lon: 139.5893 },
      { name: "Inokashira-koen", nameJa: "井の頭公園", lat: 35.6973, lon: 139.5836 },
      { name: "Kichijoji", nameJa: "吉祥寺", lat: 35.7031, lon: 139.5797 },
    ],
  },
  shinjuku: {
    name: "Toei Shinjuku Line",
    shortName: "Shinjuku",
    code: "S",
    assumption:
      "Models the Toei Shinjuku Line from Shinjuku to Motoyawata. Some services continue onto the Keio network, but cross-line through journeys and stopping patterns are not modeled.",
    stations: [
      { name: "Shinjuku", nameJa: "新宿", lat: 35.6901, lon: 139.7006 },
      { name: "Shinjuku-sanchome", nameJa: "新宿三丁目", lat: 35.6907, lon: 139.7065 },
      { name: "Akebonobashi", nameJa: "曙橋", lat: 35.6924, lon: 139.7225 },
      { name: "Ichigaya", nameJa: "市ヶ谷", lat: 35.691, lon: 139.7355 },
      { name: "Kudanshita", nameJa: "九段下", lat: 35.6955, lon: 139.7519 },
      { name: "Jimbocho", nameJa: "神保町", lat: 35.6959, lon: 139.7576 },
      { name: "Ogawamachi", nameJa: "小川町", lat: 35.6954, lon: 139.7661 },
      { name: "Iwamotocho", nameJa: "岩本町", lat: 35.6955, lon: 139.7759 },
      { name: "Bakuro-yokoyama", nameJa: "馬喰横山", lat: 35.692, lon: 139.7829 },
      { name: "Hamacho", nameJa: "浜町", lat: 35.6885, lon: 139.7894 },
      { name: "Morishita", nameJa: "森下", lat: 35.688, lon: 139.7985 },
      { name: "Kikukawa", nameJa: "菊川", lat: 35.6884, lon: 139.806 },
      { name: "Sumiyoshi", nameJa: "住吉", lat: 35.689, lon: 139.8156 },
      { name: "Nishi-ojima", nameJa: "西大島", lat: 35.6893, lon: 139.8263 },
      { name: "Ojima", nameJa: "大島", lat: 35.6899, lon: 139.8343 },
      { name: "Higashi-ojima", nameJa: "東大島", lat: 35.6903, lon: 139.8459 },
      { name: "Funabori", nameJa: "船堀", lat: 35.6838, lon: 139.8644 },
      { name: "Ichinoe", nameJa: "一之江", lat: 35.686, lon: 139.8829 },
      { name: "Mizue", nameJa: "瑞江", lat: 35.6933, lon: 139.8976 },
      { name: "Shinozaki", nameJa: "篠崎", lat: 35.706, lon: 139.9036 },
      { name: "Motoyawata", nameJa: "本八幡", lat: 35.7209, lon: 139.9271 },
    ],
  },
  ginza: {
    name: "Tokyo Metro Ginza Line",
    shortName: "Ginza",
    code: "G",
    assumption:
      "Models the Tokyo Metro Ginza Line from Shibuya to Asakusa. Service disruptions, platform geometry, and station structures are not modeled.",
    stations: [
      { name: "Shibuya", nameJa: "渋谷", lat: 35.658, lon: 139.7016 },
      { name: "Omote-sando", nameJa: "表参道", lat: 35.6653, lon: 139.7121 },
      { name: "Gaiemmae", nameJa: "外苑前", lat: 35.6704, lon: 139.7179 },
      { name: "Aoyama-itchome", nameJa: "青山一丁目", lat: 35.6728, lon: 139.7242 },
      { name: "Akasaka-mitsuke", nameJa: "赤坂見附", lat: 35.6768, lon: 139.737 },
      { name: "Tameike-sanno", nameJa: "溜池山王", lat: 35.6736, lon: 139.7417 },
      { name: "Toranomon", nameJa: "虎ノ門", lat: 35.6702, lon: 139.7498 },
      { name: "Shimbashi", nameJa: "新橋", lat: 35.6663, lon: 139.7586 },
      { name: "Ginza", nameJa: "銀座", lat: 35.6719, lon: 139.764 },
      { name: "Kyobashi", nameJa: "京橋", lat: 35.6767, lon: 139.7701 },
      { name: "Nihombashi", nameJa: "日本橋", lat: 35.6818, lon: 139.7745 },
      { name: "Mitsukoshimae", nameJa: "三越前", lat: 35.6849, lon: 139.7734 },
      { name: "Kanda", nameJa: "神田", lat: 35.6917, lon: 139.7709 },
      { name: "Suehirocho", nameJa: "末広町", lat: 35.7029, lon: 139.7717 },
      { name: "Ueno-hirokoji", nameJa: "上野広小路", lat: 35.7077, lon: 139.7731 },
      { name: "Ueno", nameJa: "上野", lat: 35.7119, lon: 139.777 },
      { name: "Inaricho", nameJa: "稲荷町", lat: 35.7113, lon: 139.7827 },
      { name: "Tawaramachi", nameJa: "田原町", lat: 35.7107, lon: 139.7908 },
      { name: "Asakusa", nameJa: "浅草", lat: 35.7107, lon: 139.797 },
    ],
  },
  chuo: {
    name: "JR Chuo Line (Rapid)",
    shortName: "Chuo Rapid",
    code: "JC",
    assumption:
      "Models the Chuo Line Rapid corridor from Tokyo to Takao. Train types and stopping patterns vary, so this prototype treats every listed station pair as a geometric segment only.",
    stations: [
      { name: "Tokyo", nameJa: "東京", lat: 35.6812, lon: 139.7671 },
      { name: "Kanda", nameJa: "神田", lat: 35.6917, lon: 139.7709 },
      { name: "Ochanomizu", nameJa: "御茶ノ水", lat: 35.6996, lon: 139.7652 },
      { name: "Yotsuya", nameJa: "四ツ谷", lat: 35.686, lon: 139.7306 },
      { name: "Shinjuku", nameJa: "新宿", lat: 35.6901, lon: 139.7006 },
      { name: "Nakano", nameJa: "中野", lat: 35.7058, lon: 139.6658 },
      { name: "Koenji", nameJa: "高円寺", lat: 35.7053, lon: 139.6497 },
      { name: "Asagaya", nameJa: "阿佐ケ谷", lat: 35.7048, lon: 139.6352 },
      { name: "Ogikubo", nameJa: "荻窪", lat: 35.7046, lon: 139.62 },
      { name: "Nishi-Ogikubo", nameJa: "西荻窪", lat: 35.7038, lon: 139.5993 },
      { name: "Kichijoji", nameJa: "吉祥寺", lat: 35.7031, lon: 139.5797 },
      { name: "Mitaka", nameJa: "三鷹", lat: 35.7027, lon: 139.5608 },
      { name: "Musashi-Sakai", nameJa: "武蔵境", lat: 35.7021, lon: 139.5436 },
      { name: "Higashi-Koganei", nameJa: "東小金井", lat: 35.7016, lon: 139.5246 },
      { name: "Musashi-Koganei", nameJa: "武蔵小金井", lat: 35.701, lon: 139.5068 },
      { name: "Kokubunji", nameJa: "国分寺", lat: 35.7001, lon: 139.48 },
      { name: "Nishi-Kokubunji", nameJa: "西国分寺", lat: 35.6997, lon: 139.4659 },
      { name: "Kunitachi", nameJa: "国立", lat: 35.6992, lon: 139.4464 },
      { name: "Tachikawa", nameJa: "立川", lat: 35.6982, lon: 139.4137 },
      { name: "Hino", nameJa: "日野", lat: 35.6791, lon: 139.3939 },
      { name: "Toyoda", nameJa: "豊田", lat: 35.6595, lon: 139.3815 },
      { name: "Hachioji", nameJa: "八王子", lat: 35.6556, lon: 139.3389 },
      { name: "Nishi-Hachioji", nameJa: "西八王子", lat: 35.6566, lon: 139.312 },
      { name: "Takao", nameJa: "高尾", lat: 35.642, lon: 139.282 },
    ],
  },
  yamanote: {
    name: "JR Yamanote Line",
    shortName: "Yamanote",
    code: "JY",
    circular: true,
    assumption:
      "Models the 30-station Yamanote loop and uses the shorter station arc. The shade result reflects the train's direction when leaving the origin; the train curves around the loop, so the sunnier side can change during longer trips.",
    stations: [
      { name: "Osaki", nameJa: "大崎", lat: 35.6197, lon: 139.7286 },
      { name: "Gotanda", nameJa: "五反田", lat: 35.6264, lon: 139.7234 },
      { name: "Meguro", nameJa: "目黒", lat: 35.6339, lon: 139.7157 },
      { name: "Ebisu", nameJa: "恵比寿", lat: 35.6467, lon: 139.7101 },
      { name: "Shibuya", nameJa: "渋谷", lat: 35.658, lon: 139.7016 },
      { name: "Harajuku", nameJa: "原宿", lat: 35.6702, lon: 139.7027 },
      { name: "Yoyogi", nameJa: "代々木", lat: 35.683, lon: 139.702 },
      { name: "Shinjuku", nameJa: "新宿", lat: 35.6901, lon: 139.7006 },
      { name: "Shin-Okubo", nameJa: "新大久保", lat: 35.7013, lon: 139.7 },
      { name: "Takadanobaba", nameJa: "高田馬場", lat: 35.7126, lon: 139.7038 },
      { name: "Mejiro", nameJa: "目白", lat: 35.7212, lon: 139.7066 },
      { name: "Ikebukuro", nameJa: "池袋", lat: 35.7289, lon: 139.71 },
      { name: "Otsuka", nameJa: "大塚", lat: 35.7316, lon: 139.7284 },
      { name: "Sugamo", nameJa: "巣鴨", lat: 35.7334, lon: 139.7393 },
      { name: "Komagome", nameJa: "駒込", lat: 35.7365, lon: 139.7469 },
      { name: "Tabata", nameJa: "田端", lat: 35.7381, lon: 139.7608 },
      { name: "Nishi-Nippori", nameJa: "西日暮里", lat: 35.7321, lon: 139.7668 },
      { name: "Nippori", nameJa: "日暮里", lat: 35.7278, lon: 139.7709 },
      { name: "Uguisudani", nameJa: "鶯谷", lat: 35.7215, lon: 139.778 },
      { name: "Ueno", nameJa: "上野", lat: 35.7138, lon: 139.7773 },
      { name: "Okachimachi", nameJa: "御徒町", lat: 35.7074, lon: 139.7747 },
      { name: "Akihabara", nameJa: "秋葉原", lat: 35.6984, lon: 139.7731 },
      { name: "Kanda", nameJa: "神田", lat: 35.6917, lon: 139.7709 },
      { name: "Tokyo", nameJa: "東京", lat: 35.6812, lon: 139.7671 },
      { name: "Yurakucho", nameJa: "有楽町", lat: 35.6751, lon: 139.7637 },
      { name: "Shimbashi", nameJa: "新橋", lat: 35.6663, lon: 139.7586 },
      { name: "Hamamatsucho", nameJa: "浜松町", lat: 35.6556, lon: 139.757 },
      { name: "Tamachi", nameJa: "田町", lat: 35.6457, lon: 139.7476 },
      { name: "Takanawa Gateway", nameJa: "高輪ゲートウェイ", lat: 35.6355, lon: 139.7407 },
      { name: "Shinagawa", nameJa: "品川", lat: 35.6285, lon: 139.7388 },
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

export function stationOptions(lineId = "all") {
  const lineIds = lineId === "all" ? Object.keys(LINES) : [lineId];
  return lineIds.flatMap((id) => {
    const line = LINES[id];
    if (!line) return [];
    return line.stations.map((station) => ({
      ...station,
      lineId: id,
      lineName: line.name,
      lineLabel: line.shortName,
      lineCode: line.code,
    }));
  });
}

const normalizeStationQuery = (value) => value.trim().toLowerCase().replace(/[\s-]+/g, "");

export function filterStationOptions(query, lineId = "all") {
  const options = stationOptions(lineId);
  const normalizedQuery = normalizeStationQuery(query);
  if (!normalizedQuery) return options;

  return options
    .map((option, index) => {
      const normalizedNames = [option.name, option.nameJa].map(normalizeStationQuery);
      const matchIndex = normalizedNames.reduce((best, name) => {
        const index = name.indexOf(normalizedQuery);
        return index >= 0 && (best < 0 || index < best) ? index : best;
      }, -1);
      return { option, index, matchIndex };
    })
    .filter(({ matchIndex }) => matchIndex >= 0)
    .sort((a, b) => Number(a.matchIndex > 0) - Number(b.matchIndex > 0) || a.index - b.index)
    .map(({ option }) => option);
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

export function calculateDistanceKm(start, end) {
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(end.lat - start.lat);
  const deltaLon = toRadians(end.lon - start.lon);
  const lat1 = toRadians(start.lat);
  const lat2 = toRadians(end.lat);
  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function findClosestStation(lineId, lat, lon) {
  const options = stationOptions(lineId);
  if (!options.length) {
    throw new Error("Choose a supported line.");
  }

  const location = { lat, lon };
  return options.reduce((closest, station) => {
    const distanceKm = calculateDistanceKm(location, station);
    return !closest || distanceKm < closest.distanceKm
      ? { station, lineId: station.lineId, distanceKm }
      : closest;
  }, null);
}

export function swapStations(startName, endName) {
  return { startName: endName, endName: startName };
}

export function shouldPreserveDestination(destinationSelection, lineId) {
  return !destinationSelection || destinationSelection.lineId === lineId;
}

export function departurePreset(now, preset) {
  const date = new Date(now);
  if (preset === "plus-30") return new Date(date.getTime() + 30 * 60 * 1000);
  if (preset === "tomorrow-morning") {
    date.setDate(date.getDate() + 1);
    date.setHours(8, 0, 0, 0);
    return date;
  }
  if (preset === "evening") {
    const evening = new Date(date);
    evening.setHours(18, 0, 0, 0);
    if (evening <= date) evening.setDate(evening.getDate() + 1);
    return evening;
  }
  throw new Error(`Unknown departure preset: ${preset}`);
}

export function getRoutePath(lineId, startName, endName) {
  const line = LINES[lineId];
  const startIndex = line?.stations.findIndex(({ name }) => name === startName) ?? -1;
  const endIndex = line?.stations.findIndex(({ name }) => name === endName) ?? -1;
  if (!line || startIndex < 0 || endIndex < 0 || startIndex === endIndex) {
    throw new Error("Choose two different stations on the same line.");
  }

  if (!line.circular) {
    const step = endIndex > startIndex ? 1 : -1;
    const stations = [];
    for (let index = startIndex; index !== endIndex + step; index += step) stations.push(line.stations[index]);
    return {
      stations,
      direction: step > 0 ? "outbound / away from central Tokyo" : "inbound / toward central Tokyo",
    };
  }

  const count = line.stations.length;
  const clockwiseSteps = (endIndex - startIndex + count) % count;
  const counterclockwiseSteps = (startIndex - endIndex + count) % count;
  const step = clockwiseSteps <= counterclockwiseSteps ? 1 : -1;
  const steps = Math.min(clockwiseSteps, counterclockwiseSteps);
  const stations = Array.from({ length: steps + 1 }, (_, offset) => {
    const index = (startIndex + step * offset + count) % count;
    return line.stations[index];
  });
  return {
    stations,
    direction: step > 0 ? "clockwise / outer loop" : "counterclockwise / inner loop",
  };
}

const COMPASS_POINTS = [
  { short: "N", label: "North" },
  { short: "NNE", label: "North-northeast" },
  { short: "NE", label: "Northeast" },
  { short: "ENE", label: "East-northeast" },
  { short: "E", label: "East" },
  { short: "ESE", label: "East-southeast" },
  { short: "SE", label: "Southeast" },
  { short: "SSE", label: "South-southeast" },
  { short: "S", label: "South" },
  { short: "SSW", label: "South-southwest" },
  { short: "SW", label: "Southwest" },
  { short: "WSW", label: "West-southwest" },
  { short: "W", label: "West" },
  { short: "WNW", label: "West-northwest" },
  { short: "NW", label: "Northwest" },
  { short: "NNW", label: "North-northwest" },
];

export function describeBearing(degrees) {
  const index = Math.round(normalizeDegrees(degrees) / 22.5) % COMPASS_POINTS.length;
  return COMPASS_POINTS[index];
}

export function describeSunElevation(elevation) {
  if (elevation <= 0) return "Below the horizon";
  if (elevation < 15) return "Low above the horizon";
  if (elevation < 45) return "Mid-sky";
  if (elevation < 70) return "High in the sky";
  return "Nearly overhead";
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
  const route = getRoutePath(lineId, startName, endName);
  const heading = calculateBearing(start, line.circular ? route.stations[1] : end);
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
    direction: route.direction,
    heading,
    sun,
    ...recommendation,
  };
}
