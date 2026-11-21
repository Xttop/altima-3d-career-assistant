# ALTIMA AI VISION — Cyfrowy Asystent Ocen Okresowych

**Prototype for HackNation 2026** by Xttopbio Innovation Lab.

Website: https://xttop.github.io/altima-3d-career-assistant/

ALTIMA explores a **voice-first, visual AI assistant** for the periodic employee evaluation process in Polish civil service. The long-term aim is to make the technology adapt to people: a virtual colleague that can help without requiring employees to learn another complex system.

## Live demo — implemented today

- Polish-language responsive website with existing design and virtual assistant
- Three role perspectives: **pracownik**, **przełożony**, **kadry / HR**
- Original thematic SVG illustrations for workflow, virtual HR partner, and future voice/AR interaction; existing illustrations and images preserved
- Interactive avatar multi-frame 360° preview (**not** a real 3D rigged avatar)
- Browser speech synthesis and opt-in microphone recognition where supported
- Local, rule-based chat responses (**not** a deployed LLM agent)
- Demonstration workflow selector for **Arkusz A/B/C** (labels only, not legally complete forms)
- Selection of up to **three additional criteria**, an evaluation stage, sample observations and achievements
- Generated demonstration summary and TXT download
- Educational content describing the end-to-end evaluation process and HR partner vision

### Try the demonstration

1. Open the website.
2. Explore **Proces oceny** and **Wirtualny HR Partner** to see the intended civil-service workflow.
3. In **Demo**, optionally activate audio/microphone, or use text chat and suggested prompts.
4. Select a sample A/B/C label, stage, up to three additional criteria, and add observations using **fictional** data.
5. Click **Utwórz projekt** and **Pobierz podsumowanie**.

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

Choose Polish, Ukrainian, or English, then click the microphone to ask one
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

## Checks

Run `node --check app.js` and `node --test`. For a live smoke check, use a
configured key and a microphone-enabled browser such as Chrome or Edge.
Ask a follow-up about an earlier answer, interrupt playback with a new
question, and repeat in each supported language.

Do not enter real employees' personal or confidential information into this public prototype.

## The challenge and planned production features

The competition brief calls for support for:

- correct official A/B/C evaluation forms and their complete fields
- selection of criteria, including a maximum of three additional criteria
- opening and appraisal conversations, note-taking and observations through the evaluation period (normally 24 months)
- legally appropriate evaluation documents, print/export, signatures and personnel changes
- deadline reminders and integrations with document management or email
- constructive feedback, training/development plans, workload and wellbeing considerations through a virtual HR partner
- access control, personal data protection, adaptability to different offices and evolving regulations

**These are production objectives, not a claim that the public demo currently implements the full official workflow.** A legally complete evaluation process needs official form models, authorization, secure data storage, legal validation and deployment testing.

## Future vision (not implemented in the public demo)

- Model-backed conversational reasoning with guarded access to authorized institutional data
- Permission-based on-screen contextual assistance
- Interactive 3D/avatar experiences using compatible AR/VR eyewear
- Optional humanoid platform integration

AR/VR hardware support must be validated separately. Human evaluators retain authority for formal employment decisions.

## Technical notes

The published site is static HTML/CSS/JavaScript; no special paid licenses are required to view it. Run locally with a simple static server:

```bash
python -m http.server 8080
```

Then visit `http://localhost:8080/`.

The browser's voice-recognition service may have its own support/privacy restrictions. The demo itself does not have a server HR database, authentication system, production-grade record retention, or a functioning official-form workflow. Check the browser's microphone permissions before using voice features.

## Team

- Mikalai Yurtsevich — Founder, Concept & Product Vision
- Siamion Yurtsevich — Software Engineer, AI & Development

The project is a demonstrator. Do not use it for real employee evaluation or automated employment decisions.

## Phone app and glasses browser

ALTIMA can be installed as a web app from the browser menu over HTTPS.
On iPhone, open the site in Safari and use Share → Add to Home Screen.
On Android, use Chrome’s Install app or Add to home screen command.
Chat requires a network connection. The service worker does not cache
chat, forms or personal data.

Open the chat section and select **Tryb okularów**, or use the URL query
`?view=glasses`. This view uses larger captions and the existing microphone,
speech and interruption controls. It requires a browser with the relevant
speech APIs and microphone permission. It can also run on a phone paired
with glasses that function as a Bluetooth headset. Native glasses apps,
heads-up overlays, and device-specific microphone routing require testing
with the selected hardware and its SDK.

### Meta Quest 3

In Meta Quest Browser, open the HTTPS test site, go to **Demo**, and select
**Uruchom AR na Quest 3**. This starts a WebXR mixed-reality session with a
panel anchored in front of the initial viewing position. Aim a controller
and pull its trigger to navigate the evaluation stages or exit. For the
full appraisal form and voice chat, return to the regular browser view.

The AR button appears on browsers that report support for `immersive-ar`.
The app displays instructional cards and does not access camera frames.
This is a WebXR experience for Quest Browser. It requires no APK.
