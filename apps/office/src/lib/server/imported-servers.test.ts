// An imported agent file's MCP servers become access asks on the desk, and nothing is granted.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { L } from './office-under-test.ts';
const { askForImported, serversFrom } = await import('./imported-servers.ts');

test('a hire from an agent file asks for its web and catalog servers at read and grants none', async () => {
  const before = await L.grantsFor('cleo');
  const raised = await askForImported(
    'cleo',
    'Cleo',
    serversFrom([
      { name: 'notes', url: 'https://mcp.example.com/mcp' },
      { name: 'Gmail' },
      { name: 'slack' },
      { name: 'files', command: 'npx' },
      { name: 'plain', url: 'http://localhost:3000/sse' }
    ])
  );
  assert.deepEqual(
    raised.map((a) => [a.kind, a.status, a.access?.level, a.title]),
    [
      ['access', 'open', 'read', 'Connect example.com (read)'],
      ['access', 'open', 'read', 'Connect Gmail (read)']
    ]
  );
  assert.equal(raised[1].access?.connector, 'gmail');
  assert.match(raised[0].why, /agent file lists the MCP server "notes"/);
  // Nothing connects until the owner says yes to an ask.
  assert.deepEqual(await L.grantsFor('cleo'), before);
  const open = (await L.asksFor('cleo')).filter((a) => a.kind === 'access' && a.status === 'open');
  assert.deepEqual(open.map((a) => a.id).sort(), raised.map((a) => a.id).sort());
});

test('a body that sends a command keeps it as listed only, and junk is dropped', () => {
  assert.deepEqual(
    serversFrom([
      { name: ' files ', command: 'rm -rf /' },
      { url: 'https://x.example' },
      'notes',
      null
    ]),
    [{ name: 'files', command: '' }]
  );
  assert.deepEqual(serversFrom('notes'), []);
});
