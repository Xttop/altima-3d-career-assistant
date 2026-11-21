import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createAltimaServer } from './server.mjs';

test('chat validates turns, forwards context and reports provider failures', async t => {
  const previousKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  let status = 200;
  let upstreamBody;
  const server = createAltimaServer(async (url, options) => {
    assert.equal(options.headers.Authorization, 'Bearer test-key');
    if (url.endsWith('/audio/transcriptions')) {
      assert.equal(options.body.get('model'), 'gpt-4o-mini-transcribe');
      assert.equal(options.body.get('language'), 'pl');
      assert.equal(options.body.get('file').name, 'question.webm');
      assert.equal(await options.body.get('file').text(), 'test audio');
      return Response.json({ text: '  Pytanie użytkownika  ' }, { status });
    }
    assert.equal(url, 'https://api.openai.com/v1/responses');
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

  const record = (type = 'audio/webm', language = 'pl-PL', body = 'test audio') =>
    fetch(url + '/api/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': type, 'X-Altima-Language': language },
      body,
    });

  assert.equal((await fetch(url)).status, 200);
  assert.equal((await fetch(url + '/server.mjs')).status, 404);
  assert.deepEqual(await (await fetch(url + '/api/status')).json(), { ai: false });
  assert.equal((await send()).status, 503);
  assert.equal((await record()).status, 503);
  process.env.OPENAI_API_KEY = 'test-key';
  assert.equal((await record('text/plain')).status, 400);
  assert.equal((await record('audio/webm', 'unknown')).status, 400);
  assert.equal((await record('audio/webm', 'pl-PL', '')).status, 400);
  const transcription = await record();
  assert.equal(transcription.status, 200);
  assert.deepEqual(await transcription.json(), { text: 'Pytanie użytkownika' });
  assert.equal((await send({ language: 'unknown' })).status, 400);
  assert.equal((await send({ messages: [{ role: 'system', content: 'bad role' }] })).status, 400);
  const response = await send();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { reply: 'Расскажите о своём опыте.' });
  assert.deepEqual(upstreamBody.input, messages);
  assert.match(upstreamBody.instructions, /Ukrainian/);
  assert.equal(upstreamBody.store, false);
  const image = 'data:image/jpeg;base64,/9j/2Q==';
  assert.equal((await send({ image: 'https://example.com/frame.jpg' })).status, 400);
  assert.equal((await send({ image: 'data:image/jpeg;base64,/9j/' + 'A'.repeat(360_000) })).status, 400);
  assert.equal((await send({ image })).status, 200);
  assert.deepEqual(upstreamBody.input, [
    ...messages.slice(0, -1),
    { role: 'user', content: [
      { type: 'input_text', text: messages.at(-1).content },
      { type: 'input_image', image_url: image, detail: 'low' },
    ] },
  ]);
  assert.equal((await send()).status, 200);
  assert.deepEqual(upstreamBody.input, messages);
  status = 429;
  assert.equal((await send()).status, 429);
  assert.equal((await record()).status, 429);
  status = 500;
  assert.equal((await send()).status, 502);
});
