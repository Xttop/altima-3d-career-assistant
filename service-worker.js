self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.mode !== 'navigate' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(request).catch(() => new Response(
    '<!doctype html><html lang="pl"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>ALTIMA offline</title><h1>Brak połączenia</h1><p>Połącz się z internetem i odśwież stronę, aby wrócić do ALTIMA.</p></html>',
    { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  )));
});
