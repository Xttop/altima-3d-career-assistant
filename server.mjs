import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const root = new URL('./', import.meta.url);
const maxBodyBytes = 100_000;
const languages = { 'pl-PL': 'Polish', 'uk-UA': 'Ukrainian', 'en-US': 'English' };
const roles = {
  colleague: 'Be a practical colleague who helps organize information and identify next steps.',
  mentor: 'Be a supportive career mentor who coaches skills and professional development.',
  manager: 'Be a constructive practice interviewer or manager. Give actionable feedback.',
};
const mime = { html: 'text/html; charset=utf-8', css: 'text/css; charset=utf-8', js: 'text/javascript; charset=utf-8', svg: 'image/svg+xml', webp: 'image/webp', png: 'image/png', webmanifest: 'application/manifest+json' };

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}

async function readTurn(req) {
  if (req.headers['content-type']?.split(';')[0] !== 'application/json') throw new Error('invalid');
  if (Number(req.headers['content-length']) > maxBodyBytes) throw new Error('invalid');
  let body = '';
  req.setEncoding('utf8');
  for await (const chunk of req) {
    body += chunk;
    if (Buffer.byteLength(body) > maxBodyBytes) throw new Error('invalid');
  }
  const { language, mode, messages } = JSON.parse(body);
  if (!Object.hasOwn(languages, language) || !Object.hasOwn(roles, mode) ||
      !Array.isArray(messages) || messages.length < 1 || messages.length > 13 ||
      messages.length % 2 !== 1 || !messages.every((message, index) =>
        message?.role === (index % 2 ? 'assistant' : 'user') &&
        typeof message.content === 'string' && message.content.trim() && message.content.length <= 2000)) {
    throw new Error('invalid');
  }
  return { language, mode, messages };
}

async function chat(req, res, requestModel) {
  let turn;
  try {
    turn = await readTurn(req);
  } catch {
    if (!res.destroyed) json(res, 400, { error: 'invalid_request' });
    return;
  }
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    json(res, 503, { error: 'not_configured' });
    return;
  }

  const controller = new AbortController();
  res.once('close', () => controller.abort());
  try {
    const { language, mode, messages } = turn;
    const upstream = await requestModel('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(25_000)]),
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
        store: false,
        max_output_tokens: 550,
        instructions: `You are ALTIMA, a female career assistant. Respond in ${languages[language]} in conversational plain text suitable for speaking aloud. ${roles[mode]}
Help users explore career paths based on education, experience, skills and interests. Ask one question at a time in an interview, build on earlier answers and offer feedback. Help draft or improve CVs without inventing credentials. Keep ordinary spoken turns concise. Avoid requesting identifying information or real employee records. Leave employment decisions to humans.`,
        input: messages,
      }),
    });
    if (upstream.status === 429) {
      json(res, 429, { error: 'rate_limited' });
      return;
    }
    if (!upstream.ok) throw new Error('provider');
    const data = await upstream.json();
    const reply = (data.output || []).filter(item => item.type === 'message')
      .flatMap(item => item.content || [])
      .map(item => item.type === 'output_text' ? item.text : item.type === 'refusal' ? item.refusal : '')
      .join('\n').trim().slice(0, 2000);
    if (!reply) throw new Error('empty');
    json(res, 200, { reply });
  } catch {
    if (!res.destroyed) json(res, 502, { error: 'provider_unavailable' });
  }
}

export function createAltimaServer(requestModel = fetch) {
  return createServer(async (req, res) => {
    const path = req.url.split('?')[0];
    if (path === '/api/status' && req.method === 'GET') {
      json(res, 200, { ai: Boolean(process.env.OPENAI_API_KEY) });
      return;
    }
    if (path === '/api/chat' && req.method === 'POST') {
      await chat(req, res, requestModel);
      return;
    }
    const file = path === '/' ? 'index.html' : path.slice(1);
    const publicFile = /^(index\.html|app\.js|service-worker\.js|manifest\.webmanifest|styles\.css|[a-z0-9-]+\.svg|assets\/[a-z0-9-]+\.(?:svg|webp)|assets\/app-icon-(?:192|512)\.png|assets\/canva\/slide-\d{2}\.png)$/i;
    if (!['GET', 'HEAD'].includes(req.method) || !publicFile.test(file)) {
      res.writeHead(404).end();
      return;
    }
    try {
      const data = await readFile(new URL(file, root));
      res.writeHead(200, { 'Content-Type': mime[file.split('.').pop().toLowerCase()], 'Content-Length': data.length });
      res.end(req.method === 'HEAD' ? undefined : data);
    } catch {
      res.writeHead(404).end();
    }
  });
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) {
  const host = process.env.HOST || '127.0.0.1';
  const port = Number(process.env.PORT || 8080);
  createAltimaServer().listen(port, host, () => console.log(`ALTIMA listening on ${host}:${port}`));
}
