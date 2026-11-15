// One airport observation from the Aviation Weather Center. The owner chooses
// the station. No browser coordinates or office records go into the request.
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const skies: Record<string, string> = {
  CLR: 'Clear',
  SKC: 'Clear',
  CAVOK: 'Clear',
  NSC: 'No significant clouds',
  FEW: 'Few clouds',
  SCT: 'Scattered clouds',
  BKN: 'Mostly cloudy',
  OVC: 'Overcast',
  VV: 'Sky obscured'
};

export const GET: RequestHandler = async ({ params }) => {
  const station = params.station.toUpperCase();
  if (!/^[A-Z0-9]{4}$/.test(station)) error(400, 'Enter a four-character airport station code.');
  const url = new URL('https://aviationweather.gov/api/data/metar');
  url.searchParams.set('ids', station);
  url.searchParams.set('format', 'json');
  let records;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Oddboro (https://github.com/New-Altitude/Oddboro)' },
      signal: AbortSignal.timeout(8000)
    });
    if (res.status === 204) records = [];
    else if (res.ok) records = await res.json();
  } catch {
    // An unreachable station service and an unreadable reply both leave the normal sky.
  }
  if (!Array.isArray(records)) error(503, 'The weather service did not answer. Try again later.');
  const obs = records.find((r) => r?.icaoId === station && Number.isFinite(r.obsTime));
  if (!obs)
    error(404, 'No recent observation for that station. Check the code or try another airport.');
  return json(
    {
      station,
      name: typeof obs.name === 'string' ? obs.name : station,
      at: obs.obsTime * 1000,
      temperature: Number.isFinite(obs.temp) ? Math.round(obs.temp) : null,
      sky: skies[obs.cover] ?? 'Cloud cover unreported',
      overcast: obs.cover === 'OVC' || obs.cover === 'VV'
    },
    { headers: { 'Cache-Control': 'private, max-age=600' } }
  );
};
