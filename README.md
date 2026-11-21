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
