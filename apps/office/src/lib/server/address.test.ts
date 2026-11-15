// The office's own Caddyfile (`ownCaddyfile` in address.ts) on each system,
// and what a failed Make it secure says on each system and on one the office
// does not know (`secureAddress`, through the setup route).
// Run with `npm test -w @oddboro/office`.
import assert from 'node:assert/strict';
import childProcess from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, mock, test } from 'node:test';
import { isHttpError } from '@sveltejs/kit';

// A home of its own, so no look for Caddy's root certificate reaches this
// computer's own. The office's modules load after it is set.
const folder = mkdtempSync(join(tmpdir(), 'oddboro-address-'));
after(() => rmSync(folder, { recursive: true, force: true }));
process.env.HOME = folder;
const { ownCaddyfile } = await import('./address.ts');
const { POST: addressRoute } = await import('../../routes/api/setup/address/+server.ts');

const binds = (system: Parameters<typeof ownCaddyfile>[0]) =>
  ownCaddyfile(system)
    .split('\n')
    .filter((l) => /^\s*(default_)?bind\b/.test(l));

test("the office's own Caddy listens on the loopback addresses only on Windows; on a Mac, where a user binds a low port only on every address, and on Linux, unmeasured, it names no address", () => {
  assert.deepEqual(binds('windows'), ['\tdefault_bind 127.0.0.1 [::1]']);
  assert.deepEqual(binds('mac'), []);
  assert.deepEqual(binds('linux'), []);
});

/** `fn` as on `platform`. */
async function on<T>(platform: NodeJS.Platform, fn: () => Promise<T>): Promise<T> {
  const real = Object.getOwnPropertyDescriptor(process, 'platform');
  Object.defineProperty(process, 'platform', { value: platform });
  try {
    return await fn();
  } finally {
    if (real) Object.defineProperty(process, 'platform', real);
  }
}

/**
 * Press Make it secure on each platform, with every command failing and
 * Caddy's admin API handing out a root certificate: what the setup route
 * answers on each, and each command it started.
 */
async function secureFails(
  platforms: NodeJS.Platform[]
): Promise<{ answers: [number, string][]; started: string[] }> {
  const started: string[] = [];
  mock.method(
    childProcess,
    'execFile',
    (cmd: string, _args: string[], _options: object, done: (e: Error) => void) => {
      started.push(cmd);
      done(Object.assign(new Error('a stand-in that fails'), { code: 1 }));
      return {};
    }
  );
  mock.method(globalThis, 'fetch', async () =>
    Response.json({ root_certificate: 'a root certificate' })
  );
  syncBuiltinESMExports();
  const answers: [number, string][] = [];
  try {
    for (const platform of platforms) {
      const request = new Request('http://127.0.0.1/api/setup/address', {
        method: 'POST',
        body: JSON.stringify({ action: 'secure' })
      });
      const answer = await on(platform, () =>
        // The route reads only the request, so the rest of Kit's event is left out.
        Promise.resolve(addressRoute({ request } as Parameters<typeof addressRoute>[0])).then(
          () => undefined,
          (e: unknown) => e
        )
      );
      assert.ok(isHttpError(answer), `${platform}: the route answered ${String(answer)}`);
      answers.push([answer.status, answer.body.message]);
    }
  } finally {
    mock.restoreAll();
    syncBuiltinESMExports();
  }
  return { answers, started };
}

test('when Make it secure fails, a Mac or Linux owner is told to enter their password, and a Windows owner to confirm when Windows asks', async () => {
  const { answers, started } = await secureFails(['darwin', 'linux', 'win32']);
  assert.deepEqual(answers, [
    [502, 'The certificate was not trusted. Try again, and enter your password.'],
    [502, 'The certificate was not trusted. Try again, and enter your password.'],
    [502, 'The certificate was not trusted. Try again, and confirm when Windows asks.']
  ]);
  // Each system's own trust command ran and failed, so each line is the failure's.
  assert.deepEqual(started, ['osascript', 'pkexec', 'certutil.exe']);
});

test('on a system the office does not know, Make it secure runs nothing and asks for the password', async () => {
  const { answers, started } = await secureFails(['freebsd']);
  assert.deepEqual(answers, [
    [502, 'The certificate was not trusted. Try again, and enter your password.']
  ]);
  assert.deepEqual(started, []);
});
