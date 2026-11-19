# ALTIMA AI VISION — 3D Career Assistant

Independent prototype for HackNation 2026 — **Cyfrowy Asystent Ocen Okresowych**.

## What is included

- Responsive, Polish-language web application
- Animated **stylized 2D/SVG hologram** (not yet a real 3D model)
- Three roles: AI Colleague, AI Mentor, AI Manager
- Clickable profile, evaluation, development and manager sections
- Evaluation summary generator, export to `.txt`
- Text chat with **local scripted responses**; no model API is connected
- Optional browser speech-to-text if supported and explicitly started
- No storage or transfer of user/employee data

## Run locally

Open `index.html` in a browser. No build or packages required. For local hosting, run `python -m http.server 8080` inside this folder and visit `http://localhost:8080`.

## Deploy

Create a **new**, independent repository `altima-3d-career-assistant` in the GitHub account `Xttop`, upload these files to its root, then enable GitHub Pages (Settings > Pages > Deploy from a branch > main / root). The prior `AI-Team-Mate-Vision` repository must not be changed.

## Next development steps

1. Replace SVG character with a properly licensed optimized GLB avatar, rendered with Three.js and animations.
2. Add a server backend for OpenAI Realtime API and secure credential management; never embed API keys in public JavaScript.
3. Add authentication, role-based access and reliable HR data connectors.
4. Design a privacy impact assessment, security audit and human-in-the-loop workflow before any real workplace deployment.
5. Investigate compatible Meta eyewear capabilities separately; do not assume full AR holograms work on all models.

**Disclaimer:** prototype visuals and employee data are fictional. No AI-based emotion recognition or automated employment decisions.


> Aktualizacja po przyznaniu uprawnień repozytorium: przygotowywany jest interfejs zgodny z prezentacją HackNation 2026.
