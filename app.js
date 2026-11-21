const modeButtons = document.querySelectorAll('[data-mode]');
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
  // Local, scripted demonstration. No external model or real HR databases.
  const text = String(prompt).toLowerCase();
  if (/arkusz|formularz|kryteri|a b c|a\/b\/c/.test(text))
    return 'W ocenie okresowej należy dobrać właściwy arkusz A, B lub C do rodzaju stanowiska. Dodatkowych kryteriów może być maksymalnie trzy. W demonstracji niżej wybierz arkusz i zaznacz kryteria. Nie zastępuje to urzędowych wzorów.';
  if (/wypalen|przeciąż|dobrostan|motywacj|hr partner/.test(text))
    return 'Wirtualny partner HR może pomóc przygotować spokojną rozmowę o obciążeniu i potrzebach pracownika, zaproponować mentoring, zmianę priorytetów lub szkolenie. Nie stawiam diagnozy i nie podejmuję decyzji kadrowych.';
  if (/termin|nieobecno|zmian.*przełoż|obserwac/.test(text))
    return 'W docelowym systemie ALTIMA ma przypominać o terminach, porządkować notatki i wspierać sytuacje takie jak zmiana przełożonego, zadań lub długotrwała nieobecność. Obecna witryna pokazuje tylko koncepcję tych funkcji.';
  if (/rozmow|feedback|oceniając/.test(text))
    return 'Przygotuj cel rozmowy, przykłady konkretnych osiągnięć oraz pytania otwarte. Najpierw omów oczekiwania, potem obserwacje i rozwój. Użytkownik i przełożony zatwierdzają ostateczną treść oceny.';
  if (/ocen|podsumowan/.test(text))
    return 'Przejdź do demonstracyjnego formularza poniżej. Wybierz arkusz A/B/C, maksymalnie trzy dodatkowe kryteria, wpisz obserwacje i wygeneruj projekt podsumowania. Ostateczną ocenę sporządza człowiek.';
  if (/rozw|kompet|szkoleni/.test(text))
    return 'Plan rozwoju można oprzeć na mocnych stronach, obszarach wymagających wsparcia oraz konkretnych działaniach, takich jak szkolenia i mentoring. Pomogę uporządkować propozycje.';
  if (/meta|okular|rozszerzon|ar\b|głos/.test(text))
    return 'ALTIMA ma w przyszłości pomagać głosowo i przez okulary AR, pokazując wskazówki bez konieczności szukania w menu. Obecny prototyp nie ma jeszcze dostępu do obrazu z okularów.';
  return modeReplies[currentMode];
}

function selectMode(mode) {
  currentMode = mode;
  modeButtons.forEach(button => {
    const selected = button.dataset.mode === mode;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
}

selectMode(currentMode);
modeButtons.forEach(button => {
  button.addEventListener('click', () => {
    selectMode(button.dataset.mode);
    if (chatMode === 'demo') deliverReply(modeReplies[currentMode]);
  });
});

let lastRolePrompt = '';
document.querySelectorAll('[data-role-shortcut]').forEach(shortcut => {
  shortcut.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    selectMode(shortcut.dataset.roleShortcut);
    const { rolePrompt } = shortcut.dataset;
    if (rolePrompt && (!chatInput.value.trim() || chatInput.value === lastRolePrompt)) {
      chatInput.value = rolePrompt;
      lastRolePrompt = rolePrompt;
    }
    focusDemoField(chatInput);
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

const criteriaBoxes = Array.from(document.querySelectorAll('input[name="criterion"]'));
const criteriaStatus = document.getElementById('criteriaStatus');
function updateCriteriaLimit(){
  const selected = criteriaBoxes.filter(box => box.checked);
  // UX guidance to match the maximum of three additional criteria in the brief.
  criteriaBoxes.forEach(box => { box.disabled = !box.checked && selected.length >= 3; });
  if (criteriaStatus) criteriaStatus.textContent = 'Wybrano ' + selected.length + ' z maksymalnie 3 kryteriów.';
}
criteriaBoxes.forEach(box => box.addEventListener('change',updateCriteriaLimit));
updateCriteriaLimit();

const featureButtons = Array.from(document.querySelectorAll('[data-demo-target]'));
const featureStatus = document.getElementById('apeFeatureStatus');
const demoForm = document.querySelector('#demo .evaluation-box');
const scenarioTargets = {
  forms: {
    stage:'Rozmowa rozpoczynająca',
    field:'sheetType',
    status:'Otworzono wybór arkusza A/B/C. Możesz też zaznaczyć maksymalnie trzy kryteria.',
    response:'Zaczynamy od wyboru arkusza A, B lub C. W tym prototypie możesz też wybrać maksymalnie trzy dodatkowe kryteria. To demonstracja, nie kompletne formularze urzędowe.'
  },
  notes: {
    stage:'Obserwacje i notatki',
    field:'observations',
    status:'Otworzono etap obserwacji. Tutaj można wpisać notatki o pracy.',
    response:'Teraz możesz dodać konkretne obserwacje dotyczące pracy. Przydadzą się podczas rozmowy oceniającej. Wersja demonstracyjna nie przechowuje notatek w bazie danych.'
  },
  interview: {
    stage:'Rozmowa rozpoczynająca',
    field:'evaluationStage',
    status:'Otworzono etap rozmów. Wybierz rozmowę rozpoczynającą lub oceniającą.',
    response:'Przygotujmy rozmowę. Możesz wybrać rozmowę rozpoczynającą lub oceniającą i omówić cele, osiągnięcia oraz oczekiwania. Wybór etapu znajdziesz w formularzu.'
  },
  criteria: {
    stage: 'Rozmowa rozpoczynająca',
    field: 'criteriaStatus',
    status: 'Możesz zaznaczyć maksymalnie trzy dodatkowe kryteria.',
    response: 'Wybierz do trzech dodatkowych kryteriów, które najlepiej opisują oczekiwania wobec stanowiska.'
  },
  review: {
    stage: 'Rozmowa oceniająca',
    field: 'evaluationStage',
    status: 'Otworzono etap rozmowy oceniającej.',
    response: 'Podczas rozmowy oceniającej omów konkretne przykłady pracy, informację zwrotną i cele na kolejny okres.'
  },
  report: {
    stage:'Podsumowanie i rozwój',
    field:'draftOutput',
    status:'Przygotowano przykładowe podsumowanie. Eksport TXT działa; automatyczne przypomnienia o terminach są planowane.',
    response:'Przygotowałam demonstracyjne podsumowanie na podstawie przykładowych danych. Możesz je przeczytać i pobrać jako TXT. Przypomnienia o terminach oraz oficjalne arkusze będą wymagać dalszej implementacji.'
  }
};
featureButtons.forEach(btn=>{
  btn.addEventListener('click',()=>{
    const action=scenarioTargets[btn.dataset.demoTarget];
    if(!action || !demoForm) return;
    const stageSelect=document.getElementById('evaluationStage');
    if(stageSelect){
      stageSelect.value=action.stage;
      stageSelect.dispatchEvent(new Event('change',{bubbles:true}));
    }
    featureButtons.forEach(item=>item.classList.toggle('is-active',item===btn));
    if(featureStatus) featureStatus.textContent=action.status;
    if(btn.dataset.demoTarget==='report') buildReport();
    addMessage(action.response,'ai');
    const field = action.field === 'criteriaStatus'
      ? criteriaBoxes.find(box => !box.disabled)
      : document.getElementById(action.field);
    focusDemoField(field || demoForm);
  });
});

function focusDemoField(field) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  field.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
  if (field.tabIndex < 0) field.tabIndex = -1;
  field.focus({ preventScroll: true });
}

const iconDetails = {
  deadlines: ['Terminy i powiadomienia', 'W formularzu demo możesz wybrać etap oceny i wpisać okres. Automatyczne przypomnienia i powiadomienia są planowane.'],
  staff: ['Zmiany kadrowe', 'Zmiana przełożonego, zakresu zadań lub dłuższa nieobecność mogą wpłynąć na przebieg oceny. W prototypie możesz opisać sytuację w obserwacjach.'],
  ar: ['Okulary AR', 'To koncepcja wskazówek wyświetlanych w polu widzenia. Obecny prototyp umożliwia rozmowę w przeglądarce.'],
  access: ['Dostęp według uprawnień', 'Docelowy dostęp zależy od roli pracownika, przełożonego lub kadr. W publicznym demo korzystaj wyłącznie z przykładowych danych.'],
  privacy: ['RODO i bezpieczeństwo', 'Używaj fikcyjnych danych. Przed wdrożeniem urząd musi zweryfikować uprawnienia, sposób przetwarzania i ochronę danych.'],
  approval: ['Człowiek zatwierdza ocenę', 'W demo ALTIMA tworzy projekt do pobrania jako TXT. Formalną ocenę sprawdza i zatwierdza uprawniona osoba.'],
};

const detailsDialog = document.getElementById('iconDetails');
document.querySelectorAll('[data-icon-detail]').forEach(button => {
  button.setAttribute('aria-haspopup', 'dialog');
  button.addEventListener('click', () => {
    const [title, description] = iconDetails[button.dataset.iconDetail];
    document.getElementById('iconDetailsTitle').textContent = title;
    document.getElementById('iconDetailsText').textContent = description;
    detailsDialog.showModal();
  });
});

function buildReport(){
  const employee = document.getElementById('employeeName').value.trim() || '(nie podano)';
  const period = document.getElementById('evaluationPeriod').value.trim() || '(nie podano)';
  const goals = document.getElementById('goalSelect').value;
  const teamwork = document.getElementById('teamSelect').value;
  const achievements = document.getElementById('achievements').value.trim() || '(brak wpisu)';
  const sheet = document.getElementById('sheetType')?.value || 'B';
  const stage = document.getElementById('evaluationStage')?.value || 'Rozmowa oceniająca';
  const observations = document.getElementById('observations')?.value.trim() || '(brak wpisu)';
  const criteria = criteriaBoxes.filter(box => box.checked).map(box => box.value);
  const interviewTips = stage === 'Rozmowa rozpoczynająca'
    ? 'Omów oczekiwania, kryteria i sposób dokumentowania efektów.'
    : stage === 'Rozmowa oceniająca'
      ? 'Zadaj pytania o osiągnięcia, wyzwania i potrzeby rozwojowe.'
      : stage === 'Obserwacje i notatki'
        ? 'Zapisz konkretne zdarzenia i rezultaty, bez nieuzasadnionych ocen.'
        : 'Ustal mocne strony, dalsze cele i działania rozwojowe.';
  reportText = [
    'ALTIMA AI VISION — SYMULACJA PODSUMOWANIA',
    'Materiał edukacyjny • dane przykładowe • nie jest urzędowym arkuszem A/B/C',
    '',
    'Arkusz (symulacja): ' + sheet,
    'Etap procesu: ' + stage,
    'Pracownik: ' + employee,
    'Okres oceny: ' + period,
    'Kryteria dodatkowe: ' + (criteria.join(', ') || 'nie wybrano'),
    'Realizacja celów: ' + goals,
    'Współpraca: ' + teamwork,
    '',
    'Obserwacje przełożonego:',
    observations,
    '',
    'Osiągnięcia:',
    achievements,
    '',
    'Wskazówka do rozmowy:',
    interviewTips,
    '',
    'Propozycja działań rozwojowych:',
    'Omówić konkretne rezultaty, mocne strony i obszary rozwoju. Ustalić szkolenia, mentoring i datę przeglądu postępów.',
    '',
    'Uwaga: to demonstracja działania interfejsu. Oficjalne formularze, uprawnienia i zgodność z przepisami wymagają dalszej implementacji. Ostateczną ocenę przygotowuje i zatwierdza człowiek.'
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
const stage = document.querySelector('.assistant-stage-box');
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
  stage.classList.toggle('thinking', Boolean(request) && !utterance);
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
  stage.classList.remove('listening');
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
  capture.onstart = () => {
    stage.classList.add('listening');
    setSpeechStatus('Słucham…');
  };
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
