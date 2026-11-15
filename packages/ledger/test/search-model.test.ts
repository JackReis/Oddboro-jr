// Downloading the search model, with the network stood in for: every file
// checked against its pin, and nothing half-written when anything goes wrong.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import {
  downloadModel,
  MODEL_FILES,
  MODEL_MB,
  modelDir,
  partialDownloads,
  type ModelFile
} from '../src/search-model.ts';
import { standInFiles } from './stand-in-model.ts';

const { files, contents } = standInFiles();
/** A server that sends each file as `send` says. */
const serve =
  (
    send: (f: ModelFile) => Response | Promise<Response> = (f) =>
      new Response(new Uint8Array(contents[f.name]))
  ) =>
  (f: ModelFile) =>
    Promise.resolve(send(f));
const nothingKept = () => {
  assert.ok(!existsSync(modelDir()), 'no model');
  assert.deepEqual(partialDownloads(), [], 'and no part of one');
};

test('Setup says about 140 MB, and the real files are pinned to a revision and a checksum', () => {
  assert.equal(MODEL_MB, 140);
  for (const f of MODEL_FILES) assert.match(f.sha256, /^[0-9a-f]{64}$/);
});

test('a file that does not match its checksum keeps nothing', async () => {
  await assert.rejects(
    downloadModel(
      files,
      serve((f) => {
        const b = Buffer.from(contents[f.name]);
        b[0] ^= 1;
        return new Response(new Uint8Array(b));
      })
    ),
    /did not match its checksum/
  );
  nothingKept();
});

test('a download that stops partway keeps nothing', async () => {
  const broken = new ReadableStream({
    start(c) {
      c.enqueue(new Uint8Array(contents['model_int8.onnx'].subarray(0, 100)));
      c.error(new Error('connection reset'));
    }
  });
  await assert.rejects(
    downloadModel(
      files,
      serve(() => new Response(broken))
    ),
    /partway/
  );
  nothingKept();
});

test('a file longer than its pin keeps nothing', async () => {
  await assert.rejects(
    downloadModel(
      files,
      serve(
        (f) => new Response(new Uint8Array(Buffer.concat([contents[f.name], contents[f.name]])))
      )
    ),
    /did not match its checksum/
  );
  nothingKept();
});

test('no network, or no file, says so and keeps nothing', async () => {
  await assert.rejects(
    downloadModel(files, () => Promise.reject(new TypeError('fetch failed'))),
    /could not reach Hugging Face/
  );
  await assert.rejects(
    downloadModel(
      files,
      serve(() => new Response('', { status: 404 }))
    ),
    /did not send/
  );
  nothingKept();
});

test('a good download lands whole, and a failed one after leaves it as it was', async () => {
  await downloadModel(files, serve());
  for (const f of files) assert.deepEqual(readFileSync(join(modelDir(), f.name)), contents[f.name]);
  assert.deepEqual(partialDownloads(), []);
  await assert.rejects(
    downloadModel(
      files,
      serve(() => new Response('', { status: 500 }))
    )
  );
  for (const f of files) assert.deepEqual(readFileSync(join(modelDir(), f.name)), contents[f.name]);
  assert.deepEqual(partialDownloads(), []);
});

test('two clicks at once make one download', async () => {
  let asked = 0;
  const once = serve((f) => {
    asked++;
    return new Response(new Uint8Array(contents[f.name]));
  });
  await Promise.all([downloadModel(files, once), downloadModel(files, once)]);
  assert.equal(asked, files.length);
});
