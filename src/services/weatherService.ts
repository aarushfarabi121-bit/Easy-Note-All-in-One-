import { Language } from '../types/note';

export interface WeatherSnapshot {
  temperatureC: number;
  weatherCode: number;
  isDay: boolean;
  emoji: string;
  conditionEn: string;
  conditionBn: string;
  locationEn: string;
  locationBn: string;
  fetchedAtMs: number;
}

export interface PresetWeatherCity {
  nameEn: string;
  nameBn: string;
  lat: number;
  lon: number;
}

export const PRESET_WEATHER_CITIES: PresetWeatherCity[] = [
  { nameEn: 'Dhaka', nameBn: 'ঢাকা', lat: 23.8103, lon: 90.4125 },
  { nameEn: 'Chattogram', nameBn: 'চট্টগ্রাম', lat: 22.3569, lon: 91.7832 },
  { nameEn: 'Sylhet', nameBn: 'সিলেট', lat: 24.8949, lon: 91.8687 },
  { nameEn: 'Rajshahi', nameBn: 'রাজশাহী', lat: 24.3745, lon: 88.6042 },
  { nameEn: 'Khulna', nameBn: 'খুলনা', lat: 22.8456, lon: 89.5403 },
  { nameEn: 'Barishal', nameBn: 'বরিশাল', lat: 22.701, lon: 90.3535 },
  { nameEn: 'Rangpur', nameBn: 'রংপুর', lat: 25.7439, lon: 89.2752 },
  { nameEn: 'Mymensingh', nameBn: 'ময়মনসিংহ', lat: 24.7471, lon: 90.4203 },
];

function mapWeatherCondition(
  code: number,
  isDay: boolean
): { emoji: string; en: string; bn: string } {
  if (code === 0) {
    return {
      emoji: isDay ? '☀️' : '🌙',
      en: isDay ? 'Clear Sky' : 'Clear Night',
      bn: isDay ? 'ঝলমলে রোদ' : 'পরিষ্কার রাত',
    };
  }
  if (code === 1 || code === 2) {
    return {
      emoji: isDay ? '🌤️' : '☁️',
      en: 'Partly Cloudy',
      bn: 'হালকা মেঘলা',
    };
  }
  if (code === 3) {
    return {
      emoji: '☁️',
      en: 'Cloudy',
      bn: 'মেঘলা আকাশ',
    };
  }
  if (code === 45 || code === 48) {
    return {
      emoji: '🌫️',
      en: 'Foggy',
      bn: 'কুয়াশাচ্ছন্ন',
    };
  }
  if (code >= 51 && code <= 57) {
    return {
      emoji: '🌦️',
      en: 'Light Drizzle',
      bn: 'গুঁড়ি গুঁড়ি বৃষ্টি',
    };
  }
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
    return {
      emoji: '🌧️',
      en: 'Rainy',
      bn: 'বৃষ্টি হচ্ছে',
    };
  }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return {
      emoji: '❄️',
      en: 'Snowy',
      bn: 'তুষারপাত',
    };
  }
  if (code >= 95) {
    return {
      emoji: '⛈️',
      en: 'Thunderstorm',
      bn: 'বজ্রসহ বৃষ্টি',
    };
  }
  return {
    emoji: isDay ? '⛅' : '🌙',
    en: 'Pleasant',
    bn: 'মনোরম আবহাওয়া',
  };
}

function getBrowserCoordinates(): Promise<{ lat: number; lon: number; isLocal: boolean }> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve({ lat: 23.8103, lon: 90.4125, isLocal: false });
      return;
    }

    const timeoutId = setTimeout(() => {
      resolve({ lat: 23.8103, lon: 90.4125, isLocal: false });
    }, 2800);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timeoutId);
        resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          isLocal: true,
        });
      },
      () => {
        clearTimeout(timeoutId);
        resolve({ lat: 23.8103, lon: 90.4125, isLocal: false });
      },
      { enableHighAccuracy: false, timeout: 2500, maximumAge: 600000 }
    );
  });
}

export async function searchWeatherCity(
  query: string
): Promise<{ name: string; lat: number; lon: number } | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      trimmed
    )}&count=1&language=en&format=json`
  );
  if (!res.ok) return null;
  const data = (await res.json()) as {
    results?: { name: string; country?: string; latitude: number; longitude: number }[];
  };
  const first = data.results?.[0];
  if (!first) return null;
  return {
    name: first.country ? `${first.name}, ${first.country}` : first.name,
    lat: first.latitude,
    lon: first.longitude,
  };
}

const weatherCache = new Map<string, WeatherSnapshot>();

export async function fetchCurrentWeather(
  customLocation?: { city?: string; lat?: number; lon?: number },
  forceRefresh = false
): Promise<WeatherSnapshot> {
  let lat: number;
  let lon: number;
  let locEn: string;
  let locBn: string;

  if (
    customLocation?.city &&
    typeof customLocation.lat === 'number' &&
    typeof customLocation.lon === 'number'
  ) {
    lat = customLocation.lat;
    lon = customLocation.lon;
    locEn = customLocation.city;
    locBn = customLocation.city;
  } else {
    const coords = await getBrowserCoordinates();
    lat = coords.lat;
    lon = coords.lon;
    locEn = coords.isLocal ? 'Local Weather' : 'Dhaka, BD';
    locBn = coords.isLocal ? 'আপনার এলাকা' : 'ঢাকা, বাংলাদেশ';
  }

  const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const cached = weatherCache.get(cacheKey);
  if (!forceRefresh && cached && Date.now() - cached.fetchedAtMs < 15 * 60 * 1000) {
    return cached;
  }

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}` +
    `&longitude=${lon.toFixed(4)}` +
    `&current=temperature_2m,weather_code,is_day&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Weather unavailable');
  }
  const data = (await res.json()) as {
    current?: {
      temperature_2m?: number;
      weather_code?: number;
      is_day?: number;
    };
  };

  const cur = data.current || {};
  const code = typeof cur.weather_code === 'number' ? cur.weather_code : 1;
  const isDay = cur.is_day !== 0;
  const mapped = mapWeatherCondition(code, isDay);

  const snapshot: WeatherSnapshot = {
    temperatureC: Math.round(cur.temperature_2m ?? 26),
    weatherCode: code,
    isDay,
    emoji: mapped.emoji,
    conditionEn: mapped.en,
    conditionBn: mapped.bn,
    locationEn: locEn,
    locationBn: locBn,
    fetchedAtMs: Date.now(),
  };

  weatherCache.set(cacheKey, snapshot);
  return snapshot;
}

export function formatWeatherLocation(w: WeatherSnapshot, lang: Language): string {
  return lang === 'bn' ? w.locationBn : w.locationEn;
}
