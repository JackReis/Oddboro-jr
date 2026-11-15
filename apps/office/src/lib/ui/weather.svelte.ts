import { call } from './api.ts';

type Observation = {
  station: string;
  name: string;
  at: number;
  temperature: number | null;
  sky: string;
  overcast: boolean;
};

export const weather = $state({
  station: '',
  report: null as Observation | null,
  problem: '',
  checking: false
});

let current: AbortController | undefined;
let nextCheck = 0;

export function chooseStation(value: string) {
  const station = value.trim().toUpperCase();
  try {
    if (station) localStorage.setItem('oddboro.weather', station);
    else localStorage.removeItem('oddboro.weather');
  } catch {
    // The selection still works for this visit.
  }
  weather.station = station;
  void readWeather();
}

export function restoreWeather() {
  try {
    const station = localStorage.getItem('oddboro.weather');
    if (station) chooseStation(station);
  } catch {
    // No stored station: the office clock lights the windows.
  }
}

/** Called by the office's existing clock. Most stations report once an hour. */
export function checkWeatherIfDue() {
  if (weather.station && Date.now() >= nextCheck) void readWeather();
}

export async function readWeather() {
  current?.abort();
  const station = weather.station;
  weather.problem = '';
  if (weather.report?.station !== station) weather.report = null;
  weather.checking = !!station;
  if (!station) return;
  nextCheck = Date.now() + 60 * 60_000;
  const request = new AbortController();
  current = request;
  try {
    const report = await call<Observation>(
      `/api/weather/${encodeURIComponent(station)}`,
      undefined,
      'GET',
      request.signal
    );
    if (!request.signal.aborted) weather.report = report;
  } catch (e) {
    if (request.signal.aborted) return;
    weather.report = null;
    weather.problem = e instanceof Error ? e.message : String(e);
  } finally {
    if (!request.signal.aborted) weather.checking = false;
  }
}
