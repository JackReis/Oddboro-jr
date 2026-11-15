import assert from 'node:assert/strict';
import { test } from 'node:test';
import { GET } from '../../routes/api/weather/[station]/+server.ts';

const read = async (station: string) => GET({ params: { station } } as Parameters<typeof GET>[0]);

test('weather reads only the chosen station and keeps zero degrees', async (t) => {
  const sent = t.mock.method(globalThis, 'fetch', async (url: URL) => {
    assert.equal(url.origin, 'https://aviationweather.gov');
    assert.equal(url.searchParams.get('ids'), 'KSEA');
    return Response.json([
      { icaoId: 'EGLL', name: 'Heathrow', obsTime: 17, temp: 8, cover: 'BKN' },
      { icaoId: 'KSEA', name: 'Seattle', obsTime: 42, temp: 0, cover: 'OVC' }
    ]);
  });
  await assert.rejects(read('SEATTLE'), { status: 400 });
  assert.equal(sent.mock.callCount(), 0);
  const res = await read('ksea');
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), {
    station: 'KSEA',
    name: 'Seattle',
    at: 42000,
    temperature: 0,
    sky: 'Overcast',
    overcast: true
  });
});

test('a station without a recent observation and an unavailable provider have different answers', async (t) => {
  const send = t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 204 }));
  await assert.rejects(read('KSEA'), { status: 404 });
  send.mock.mockImplementation(async () => new Response(null, { status: 503 }));
  await assert.rejects(read('KSEA'), { status: 503 });
});
