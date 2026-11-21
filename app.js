const modeButtons = document.querySelectorAll('.mode');
const chatLog = document.getElementById('chatLog');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const quickButtons = document.querySelectorAll('.quick-prompts button');
const draftBtn = document.getElementById('draftBtn');
const downloadBtn = document.getElementById('downloadBtn');
const draftOutput = document.getElementById('draftOutput');
const rotateRange = document.getElementById('rotateRange');
const viewerModelWrap = document.getElementById('viewerModelWrap');
const viewer360 = document.getElementById('viewer360');
const autoRotateBtn = document.getElementById('autoRotateBtn');
const resetRotateBtn = document.getElementById('resetRotateBtn');
const speedRange = document.getElementById('speedRange');
const speedValue = document.getElementById('speedValue');

let currentMode = 'colleague';
let reportText = '';
let currentRotation = 0;
let autoRotate = true;
let dragging = false;
let startX = 0;
let startRotation = 0;
let secondsPerTurn = 5;
let previousFrameTime = null;

const modeReplies = {
  colleague: 'Jestem Twoją wirtualną współpracowniczką. Mogę pomóc wyjaśnić procedury, uporządkować informacje i wskazać następny krok.',
  mentor: 'Jestem Twoją mentorką AI. Pomogę zaplanować rozwój kompetencji, wskazać szkolenia i przygotować cele rozwojowe.',
  manager: 'Jestem w trybie Przełożony AI. Mogę przygotować pytania do rozmowy oceniającej i uporządkować projekt podsumowania.'
};

// Five distinct real viewpoints, unlike the previous flat CSS rotateY flip.
// SVG wrappers contain the actual generated photographs and are stored in GitHub.
const turnFrames = [
  {src:'assets/altima-front.svg',alt:'ALTIMA — widok z przodu',mirror:false},
  {src:'assets/altima-front-angle.svg',alt:'ALTIMA — perspektywa trzy czwarte',mirror:false},
  {src:'assets/altima-right-side.svg',alt:'ALTIMA — profil prawy',mirror:false},
  {src:'assets/altima-back.svg',alt:'ALTIMA — widok z tyłu',mirror:false},
  {src:'assets/altima-back.svg',alt:'ALTIMA — widok z tyłu',mirror:true},
  {src:'assets/altima-right-side.svg',alt:'ALTIMA — profil lewy',mirror:true},
  {src:'assets/altima-left-angle.svg',alt:'ALTIMA — perspektywa trzy czwarte z lewej',mirror:false},
  {src:'assets/altima-front.svg',alt:'ALTIMA — widok z przodu',mirror:false},
];
const viewerImage = document.getElementById('viewerModel');
let lastFrame = -1;
turnFrames.forEach(frame => { const prefetch = new Image(); prefetch.src = frame.src; });
function applyRotation(deg){
  currentRotation = ((deg % 360) + 360) % 360;
  const frameIdx = Math.min(turnFrames.length - 1, Math.floor(currentRotation / 45));
  if (frameIdx !== lastFrame && viewerImage) {
    const frame = turnFrames[frameIdx];
    viewerImage.src = frame.src;
    viewerImage.alt = frame.alt;
    viewerImage.style.transform = frame.mirror ? 'scaleX(-1)' : 'scaleX(1)';
    lastFrame = frameIdx;
  }
  viewerModelWrap.style.transform = 'translateX(-50%)';
  if (rotateRange) rotateRange.value = Math.round(currentRotation);
}
applyRotation(0);

function addMessage(text, role='ai'){
  const wrapper = document.createElement('div');
  wrapper.className = `message ${role}`;
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = text;
  wrapper.appendChild(bubble);
  chatLog.appendChild(wrapper);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function demoReply(prompt){
  const text = prompt.toLowerCase();
  if (text.includes('ocen')) return 'Przejdź do sekcji „Projekt podsumowania oceny”. Uzupełnij osiągnięcia i kliknij „Utwórz projekt”, a pomogę uporządkować treść.';
  if (text.includes('rozmow') || text.includes('przełoż')) return 'W rozmowie z przełożonym dobrze podkreślić trzy konkretne osiągnięcia, jeden obszar do rozwoju i propozycję następnych kroków.';
  if (text.includes('rozw') || text.includes('kompet')) return 'Rekomenduję rozwój komunikacji, planowania pracy i sprawnej obsługi dokumentów. Mogę pomóc przekształcić to w plan rozwoju.';
  if (text.includes('meta') || text.includes('okular')) return 'W wariancie z okularami Meta asystent może pokazywać, gdzie kliknąć, co wpisać i jaki dokument otworzyć w danym momencie.';
  return modeReplies[currentMode];
}

modeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    modeButtons.forEach(b => b.classList.toggle('active', b === btn));
    currentMode = btn.dataset.mode;
    if (chatMode === 'demo') deliverReply(modeReplies[currentMode]);
  });
});

quickButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const prompt = btn.dataset.prompt;
    sendMessage(prompt);
  });
});

chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const value = chatInput.value.trim();
  if (!value) return;
  chatInput.value = '';
  sendMessage(value);
});

function buildReport(){
  const employee = document.getElementById('employeeName').value;
  const period = document.getElementById('evaluationPeriod').value;
  const goals = document.getElementById('goalSelect').value;
  const teamwork = document.getElementById('teamSelect').value;
  const achievements = document.getElementById('achievements').value;
  reportText = [
    'ALTIMA AI VISION — PROJEKT PODSUMOWANIA',
    '',
    `Pracownik: ${employee}`,
    `Okres oceny: ${period}`,
    `Realizacja celów: ${goals}`,
    `Współpraca: ${teamwork}`,
    '',
    'Osiągnięcia:',
    achievements,
    '',
    'Rekomendacja demonstracyjna:',
    'Warto utrzymać mocne strony pracownika, wskazać dalsze cele rozwojowe i omówić konkretne mierzalne rezultaty.',
    '',
    'Uwaga: ostatecznej oceny dokonuje człowiek.'
  ].join('\n');
  draftOutput.textContent = reportText;
}

draftBtn.addEventListener('click', buildReport);
downloadBtn.addEventListener('click', () => {
  if (!reportText) buildReport();
  const blob = new Blob([reportText], {type: 'text/plain;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'altima-podsumowanie.txt';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

rotateRange.addEventListener('input', (e) => {
  autoRotate = false;
  applyRotation(Number(e.target.value));
});

autoRotateBtn.addEventListener('click', () => {
  autoRotate = !autoRotate;
  autoRotateBtn.textContent = autoRotate ? 'Wyłącz auto‑obrót' : 'Włącz auto‑obrót';
});
resetRotateBtn.addEventListener('click', () => {
  autoRotate = false;
  applyRotation(0);
});

viewer360.addEventListener('pointerdown', (e) => {
  dragging = true;
  startX = e.clientX;
  startRotation = currentRotation;
  viewer360.setPointerCapture?.(e.pointerId);
});
viewer360.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  autoRotate = false;
  const delta = e.clientX - startX;
  applyRotation(startRotation + delta * 0.5);
});
function endDrag(){ dragging = false; }
viewer360.addEventListener('pointerup', endDrag);
viewer360.addEventListener('pointercancel', endDrag);
viewer360.addEventListener('pointerleave', endDrag);

speedRange?.addEventListener('input', e => {
  secondsPerTurn = Number(e.target.value);
  speedValue.textContent = `1 obrót / ${secondsPerTurn} s`;
});

// requestAnimationFrame draws at the browser's available refresh rate (typically 60 fps).
// Time-based angular speed stays consistent even if the refresh rate changes.
function tick(timestamp){
  const deltaSeconds = previousFrameTime === null ? 0 : Math.min((timestamp - previousFrameTime) / 1000, 0.1);
  previousFrameTime = timestamp;
  if (autoRotate && !dragging) applyRotation(currentRotation + (360 / secondsPerTurn) * deltaSeconds);
  requestAnimationFrame(tick);
}
autoRotateBtn.textContent = 'Wyłącz auto‑obrót';
requestAnimationFrame(tick);

const voiceBtn = document.getElementById('voiceBtn');
const micBtn = document.getElementById('micBtn');
const voiceSelect = document.getElementById('voiceSelect');
const voiceSpeed = document.getElementById('voiceSpeed');
const languageSelect = document.getElementById('speechLanguage');
const speechStatus = document.getElementById('speechStatus');
const chatStatus = document.getElementById('chatStatus');
const interruptBtn = document.getElementById('interruptBtn');
const stage = document.querySelector('.assistant-stage');
const synth = window.speechSynthesis;
const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
const femaleVoices = /Paulina|Zofia|Agnieszka|Kasia|Maja|Oksana|Olena|Kateryna|Natalia|Jenny|Aria|Samantha|Serena|female|Google polski/i;
let voiceOn = false;
let recognition = null;
let utterance = null;
let request = null;
let chatMode = 'pending';
const history = [];

function setSpeechStatus(message) {
  speechStatus.textContent = message;
}

async function detectService() {
  if (location.protocol === 'file:') return 'demo';
  const response = await fetch('./api/status', { signal: AbortSignal.timeout(5000) });
  if (response.status === 404) return 'demo';
  if (!response.ok) throw new Error('connection');
  return (await response.json()).ai ? 'live' : 'unconfigured';
}

const service = detectService().catch(() => 'unavailable').then(mode => {
  chatMode = mode;
  chatStatus.textContent = { live: 'AI', demo: 'Tryb demonstracyjny', unconfigured: 'Brak konfiguracji AI', unavailable: 'Brak połączenia' }[mode];
  return mode;
});

function updateInterrupt() {
  interruptBtn.disabled = !request && !utterance;
}

function stopSpeaking() {
  if (!utterance) return;
  utterance = null;
  synth.cancel();
  stage.classList.remove('speaking');
  updateInterrupt();
}

function interruptReply() {
  request?.abort();
  request = null;
  stopSpeaking();
  updateInterrupt();
}

function voiceScore(voice) {
  return (femaleVoices.test(voice.name) ? 8 : 0) + (/natural|neural|premium|enhanced/i.test(voice.name) ? 4 : 0) +
    (voice.lang === languageSelect.value ? 2 : 0);
}

function loadVoices() {
  const prior = voiceSelect.value;
  const prefix = languageSelect.value.split('-')[0];
  const options = [new Option('Automatyczny (najlepszy)', '')];
  const voices = synth?.getVoices().filter(voice => voice.lang.split(/[-_]/)[0] === prefix) || [];
  voices.sort((a, b) => voiceScore(b) - voiceScore(a));
  options.push(...voices.map(voice => new Option(voice.name, voice.voiceURI)));
  voiceSelect.replaceChildren(...options);
  if (voices.some(voice => voice.voiceURI === prior)) voiceSelect.value = prior;
}

function speak(message) {
  if (!voiceOn || !synth) return;
  stopSpeaking();
  const speech = new SpeechSynthesisUtterance(message);
  utterance = speech;
  speech.lang = languageSelect.value;
  speech.rate = Number(voiceSpeed.value);
  const uri = voiceSelect.value || voiceSelect.options[1]?.value;
  const voice = synth.getVoices().find(available => available.voiceURI === uri);
  if (voice) speech.voice = voice;

  speech.onstart = () => {
    if (utterance !== speech) return;
    stage.classList.add('speaking');
    setSpeechStatus('ALTIMA mówi…');
  };
  function finish(message) {
    if (utterance !== speech) return;
    utterance = null;
    stage.classList.remove('speaking');
    updateInterrupt();
    setSpeechStatus(message);
  }
  speech.onend = () => finish('Gotowa do rozmowy.');
  speech.onerror = () => finish('Nie udało się odtworzyć głosu. Odpowiedź jest widoczna w rozmowie.');
  updateInterrupt();
  synth.speak(speech);
}

function deliverReply(reply) {
  addMessage(reply, 'ai');
  speak(reply);
}

async function sendMessage(text) {
  cancelRecognition();
  interruptReply();
  const controller = new AbortController();
  request = controller;
  const language = languageSelect.value;
  const mode = currentMode;
  const user = { role: 'user', content: text.slice(0, 2000) };
  addMessage(user.content, 'user');
  updateInterrupt();
  setSpeechStatus('ALTIMA przygotowuje odpowiedź…');
  try {
    const available = await service;
    if (controller.signal.aborted) return;
    if (available === 'demo') {
      setSpeechStatus('Tryb demonstracyjny bez połączenia z modelem.');
      deliverReply(demoReply(user.content));
      return;
    }
    const response = await fetch('./api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, mode, messages: [...history, user] }),
      signal: controller.signal,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    if (controller.signal.aborted) return;
    history.push(user, { role: 'assistant', content: data.reply });
    if (history.length > 12) history.splice(0, 2);
    chatStatus.textContent = 'AI';
    setSpeechStatus('Odpowiedź gotowa.');
    deliverReply(data.reply);
  } catch (error) {
    if (controller.signal.aborted) return;
    const messages = {
      not_configured: 'Serwer nie ma skonfigurowanego klucza AI.',
      rate_limited: 'Usługa AI osiągnęła limit. Spróbuj ponownie za chwilę.',
      provider_unavailable: 'Model AI jest chwilowo niedostępny. Spróbuj ponownie.',
    };
    setSpeechStatus(messages[error.message] || 'Nie udało się połączyć z serwerem rozmowy. Spróbuj ponownie.');
  } finally {
    if (request === controller) request = null;
    updateInterrupt();
  }
}

function setVoiceEnabled(enabled) {
  voiceOn = enabled && Boolean(synth);
  voiceBtn.setAttribute('aria-pressed', String(voiceOn));
  voiceBtn.textContent = voiceOn ? '🔇 Wyłącz głos ALTIMA' : '🔊 Włącz głos ALTIMA';
  if (!voiceOn) stopSpeaking();
}

voiceBtn.disabled = !synth;
voiceSelect.disabled = !synth;
voiceSpeed.disabled = !synth;
voiceBtn.addEventListener('click', () => setVoiceEnabled(!voiceOn));
synth?.addEventListener('voiceschanged', loadVoices);
loadVoices();
interruptBtn.addEventListener('click', () => {
  interruptReply();
  setSpeechStatus('Odpowiedź przerwana. Możesz zadać kolejne pytanie.');
});
languageSelect.addEventListener('change', () => {
  cancelRecognition();
  interruptReply();
  loadVoices();
  setSpeechStatus('Zmieniono język rozmowy.');
});

function cancelRecognition() {
  if (!recognition) return;
  const capture = recognition;
  capture.onstart = capture.onresult = capture.onerror = null;
  capture.onend = resetMicrophone;
  capture.abort();
}

function resetMicrophone() {
  recognition = null;
  micBtn.setAttribute('aria-pressed', 'false');
  micBtn.classList.remove('listening');
  micBtn.textContent = '🎙️ Rozmawiaj z ALTIMA';
}

if (!SpeechRecognitionAPI) {
  micBtn.disabled = true;
  setSpeechStatus('Rozpoznawanie mowy jest niedostępne w tej przeglądarce. Możesz pisać.');
}
micBtn.addEventListener('click', () => {
  if (recognition) {
    recognition.stop();
    return;
  }
  interruptReply();
  setVoiceEnabled(true);
  const capture = new SpeechRecognitionAPI();
  recognition = capture;
  capture.lang = languageSelect.value;
  capture.interimResults = true;
  let transcript = '';
  capture.onstart = () => setSpeechStatus('Słucham…');
  capture.onresult = event => {
    const latest = Array.from(event.results);
    transcript = latest.filter(result => result.isFinal).map(result => result[0].transcript).join(' ').trim();
    setSpeechStatus('Rozpoznaję: ' + latest.map(result => result[0].transcript).join(' '));
  };
  capture.onerror = event => {
    transcript = '';
    if (event.error === 'aborted') return;
    const messages = {
      'not-allowed': 'Zezwól na dostęp do mikrofonu w ustawieniach przeglądarki.',
      'service-not-allowed': 'Przeglądarka zablokowała rozpoznawanie mowy.',
      'no-speech': 'Nie wykryto mowy. Spróbuj ponownie.',
      'audio-capture': 'Nie wykryto działającego mikrofonu.',
      network: 'Usługa rozpoznawania mowy jest chwilowo niedostępna.',
    };
    setSpeechStatus(messages[event.error] || 'Nie udało się rozpoznać mowy.');
  };
  capture.onend = () => {
    resetMicrophone();
    if (transcript) sendMessage(transcript);
  };
  try {
    capture.start();
    micBtn.setAttribute('aria-pressed', 'true');
    micBtn.classList.add('listening');
    micBtn.textContent = '⏹️ Zakończ pytanie';
    setSpeechStatus('Uruchamiam mikrofon…');
  } catch {
    resetMicrophone();
    setSpeechStatus('Nie udało się uruchomić mikrofonu. Możesz pisać.');
  }
});
