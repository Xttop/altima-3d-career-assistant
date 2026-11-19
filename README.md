# ALTIMA AI VISION — 3D Career Assistant

Independent prototype for HackNation 2026 — **Cyfrowy Asystent Ocen Okresowych**.

## Run the AI assistant

Use Node.js 22 or later. No npm install or build is required. Configure
`OPENAI_API_KEY` as a server-side environment secret, then run:

```sh
node server.mjs
```

Open `http://127.0.0.1:8080`. The optional `OPENAI_MODEL` setting defaults to
`gpt-4.1-mini`. The backend needs HTTPS access to `api.openai.com`. Set
`HOST=0.0.0.0` when running behind an environment preview proxy, and use
HTTPS for microphone access outside localhost. Keep credentials outside
the document root and use access controls and request quotas before
exposing the keyed backend publicly.

Choose Polish, Russian, or English, then click the microphone to ask one
question. Use the microphone or **Przerwij odpowiedź** to interrupt, and
use the text field if speech recognition is unavailable. Voice quality
and microphone support depend on the browser and installed voices.
Recognition may use the browser vendor’s speech service. The server sends
the transcript and up to six completed turns to OpenAI with
`store: false`. The page keeps the visible conversation in memory until
reload. Use sample data and omit personal or employee records.

Try a mock interview, a career exploration conversation, or the CV
shortcut. The 360° image viewer and evaluation TXT export still work
independently. The avatar sways during speech. Its static image frames
lack separate facial controls for lip sync and expressions.

## Static demo

Opening `index.html`, GitHub Pages, or running
`python3 -m http.server 8080` serves the scripted Polish demo. To use the
live AI assistant, host the frontend and the API together using the Node
server. The live backend reports configuration and provider errors in
the interface.

## Checks

Run `node --check app.js` and `node --test`. For a live smoke check, use a
configured key and a microphone-enabled browser such as Chrome or Edge.
Ask a follow-up about an earlier answer, interrupt playback with a new
question, and repeat in each supported language.

## Next development steps

1. Replace SVG character with a properly licensed optimized GLB avatar, rendered with Three.js and animations.
2. Explore streaming speech-to-speech for lower latency and more consistent voices.
3. Add authentication, role-based access and reliable HR data connectors.
4. Design a privacy impact assessment, security audit and human-in-the-loop workflow before any real workplace deployment.
5. Investigate compatible Meta eyewear capabilities separately; do not assume full AR holograms work on all models.

**Disclaimer:** prototype visuals and employee data are fictional. No AI-based emotion recognition or automated employment decisions.


> Aktualizacja po przyznaniu uprawnień repozytorium: przygotowywany jest interfejs zgodny z prezentacją HackNation 2026.
