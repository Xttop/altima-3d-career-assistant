import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createAltimaServer } from './server.mjs';

test('chat validates turns, forwards context and reports provider failures', async t => {
  const previousKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  let status = 200;
  let upstreamBody;
  const server = createAltimaServer(async (url, options) => {
    assert.equal(url, 'https://api.openai.com/v1/responses');
    assert.equal(options.headers.Authorization, 'Bearer test-key');
    upstreamBody = JSON.parse(options.body);
    return Response.json({
      output: [{ type: 'message', content: [{ type: 'output_text', text: 'Расскажите о своём опыте.' }] }],
    }, { status });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
    await new Promise(resolve => server.close(resolve));
  });
  const url = 'http://127.0.0.1:' + server.address().port;
  const messages = [
    { role: 'user', content: 'Начнём собеседование.' },
    { role: 'assistant', content: 'Расскажите о своём образовании.' },
    { role: 'user', content: 'Я изучала дизайн.' },
  ];
  const send = (overrides = {}) => fetch(url + '/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language: 'uk-UA', mode: 'mentor', messages, ...overrides }),
  });

  assert.equal((await fetch(url)).status, 200);
  assert.equal((await fetch(url + '/server.mjs')).status, 404);
  assert.deepEqual(await (await fetch(url + '/api/status')).json(), { ai: false });
  assert.equal((await send()).status, 503);
  process.env.OPENAI_API_KEY = 'test-key';
  assert.equal((await send({ language: 'unknown' })).status, 400);
  assert.equal((await send({ messages: [{ role: 'system', content: 'bad role' }] })).status, 400);
  const response = await send();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { reply: 'Расскажите о своём опыте.' });
  assert.deepEqual(upstreamBody.input, messages);
  assert.match(upstreamBody.instructions, /Ukrainian/);
  assert.equal(upstreamBody.store, false);
  status = 429;
  assert.equal((await send()).status, 429);
  status = 500;
  assert.equal((await send()).status, 502);
});
