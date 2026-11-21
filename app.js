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

function replyTo(prompt){
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

modeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    modeButtons.forEach(b => b.classList.toggle('active', b === btn));
    currentMode = btn.dataset.mode;
    addMessage(modeReplies[currentMode], 'ai');
  });
});

quickButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const prompt = btn.dataset.prompt;
    addMessage(prompt, 'user');
    setTimeout(() => addMessage(replyTo(prompt), 'ai'), 250);
  });
});

chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const value = chatInput.value.trim();
  if (!value) return;
  addMessage(value, 'user');
  chatInput.value = '';
  setTimeout(() => addMessage(replyTo(value), 'ai'), 250);
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

/* Accessible navigation from the four editorial process icons into the real
   capabilities of the public demonstration. No fake server actions. */
const featureButtons = Array.from(document.querySelectorAll('.ape-feature-button'));
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
    const field=document.getElementById(action.field);
    const target=field || demoForm;
    const reduced=window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({behavior:reduced?'auto':'smooth',block:'center'});
    if(field){
      if(field.id==='draftOutput' && !field.hasAttribute('tabindex')) field.setAttribute('tabindex','-1');
      field.focus({preventScroll:true});
    }
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

/* Polish natural browser TTS + opt-in microphone speech recognition.
   No external AI API. Speech recognition service availability depends on the browser.
   All answers remain rule-based demo responses. */
const voiceBtn = document.getElementById('voiceBtn');
const micBtn = document.getElementById('micBtn');
const voiceSelect = document.getElementById('voiceSelect');
const voiceSpeed = document.getElementById('voiceSpeed');
const speechStatus = document.getElementById('speechStatus');
const synthSupported = ('speechSynthesis' in window) && ('SpeechSynthesisUtterance' in window);
const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
let voiceOn = false;
let listening = false;
let recognition = null;
let currentVoices = [];
const preferredVoices = /Paulina|Zofia|Agnieszka|Kasia|Maja|female|kobieta|Google polski|Microsoft.*Polish/i;
const demoGreeting = 'Dzień dobry. Jestem Altima, Twoja asystentka kariery. Miło Cię poznać. Możesz ze mną porozmawiać o ocenie okresowej, planach rozwoju albo celach zawodowych. W czym mogę Ci dzisiaj pomóc?';
function setSpeechStatus(message) { if (speechStatus) speechStatus.textContent = message; }
function normalizePLVoice(voice) { return voice.lang && /^pl([_-]|$)/i.test(voice.lang); }
function voiceQuality(voice){
  let score = 0;
  if (normalizePLVoice(voice)) score += 20;
  if (/natural|neural|online|premium|enhanced/i.test(voice.name)) score += 8;
  if (preferredVoices.test(voice.name)) score += 5;
  if (voice.default) score += 1;
  return score;
}
function loadPolishVoices(){
  if (!synthSupported) return;
  currentVoices = window.speechSynthesis.getVoices().filter(normalizePLVoice).sort((a,b)=>voiceQuality(b)-voiceQuality(a));
  if(!voiceSelect) return;
  const prior = voiceSelect.value;
  voiceSelect.innerHTML = '';
  const automatic = document.createElement('option');
  automatic.value = '';
  automatic.textContent = 'Automatyczny (najlepszy)';
  voiceSelect.appendChild(automatic);
  currentVoices.forEach((voice, i)=>{
    const option = document.createElement('option');
    option.value = String(i);
    option.textContent = voice.name + (voice.localService ? ' • lokalny' : '');
    voiceSelect.appendChild(option);
  });
  if(prior !== '' && currentVoices[Number(prior)]) voiceSelect.value = prior;
  if(!currentVoices.length) setSpeechStatus('Brak głosu pl-PL w systemie. Możesz pisać wiadomości.');
}
function stopSpeaking() { if (synthSupported) window.speechSynthesis.cancel(); }
function speakAltima(message){
  if (!voiceOn || !synthSupported) return;
  stopSpeaking();
  const utterance = new SpeechSynthesisUtterance(String(message).replace(/ALTIMA AI VISION/g, 'Altima'));
  utterance.lang = 'pl-PL';
  utterance.rate = Math.min(1,Math.max(0.7,Number(voiceSpeed?.value||0.91)));
  utterance.pitch = 1.02;
  utterance.volume = 1;
  const chosenIndex = voiceSelect?.value;
  const chosenVoice = chosenIndex !== '' && chosenIndex != null ? currentVoices[Number(chosenIndex)] : currentVoices[0];
  if(chosenVoice) utterance.voice = chosenVoice;
  utterance.onstart = ()=>setSpeechStatus('ALTIMA mówi…');
  utterance.onend = ()=>setSpeechStatus('Gotowa do rozmowy. Naciśnij mikrofon i zadaj pytanie.');
  utterance.onerror = ()=>setSpeechStatus('Nie udało się odtworzyć głosu. Sprawdź ustawienia przeglądarki.');
  window.speechSynthesis.speak(utterance);
}
function setVoiceEnabled(enabled){
  voiceOn = !!enabled && synthSupported;
  if(voiceBtn){
    voiceBtn.setAttribute('aria-pressed',String(voiceOn));
    voiceBtn.textContent=voiceOn?'🔇 Wyłącz głos ALTIMA':'🔊 Włącz głos ALTIMA';
  }
  if(!voiceOn) { stopSpeaking(); setSpeechStatus('Głos wyłączony. Rozmowa tekstowa nadal działa.'); }
}
if(synthSupported){
  loadPolishVoices();
  window.speechSynthesis.addEventListener?.('voiceschanged',loadPolishVoices);
  voiceBtn?.addEventListener('click',()=>{
    if(listening && voiceOn) stopListening();
    setVoiceEnabled(!voiceOn);
    if(voiceOn) speakAltima(demoGreeting);
  });
} else {
  if(voiceBtn){ voiceBtn.disabled=true; voiceBtn.textContent='Głos niedostępny'; }
  if(voiceSelect) voiceSelect.disabled = true;
  setSpeechStatus('Ta przeglądarka nie udostępnia syntezy mowy. Rozmowa tekstowa działa.');
}
if(!SpeechRecognitionAPI){
  if(micBtn){ micBtn.disabled=true; micBtn.textContent='🎙️ Mikrofon niedostępny';micBtn.title='Do rozpoznawania mowy użyj aktualnej wersji Chrome lub Edge.'; }
  if(synthSupported) setSpeechStatus('Aby mówić do ALTIMA, otwórz stronę w Chrome lub Edge i zezwól na mikrofon.');
} else if (micBtn) {
  recognition = new SpeechRecognitionAPI();
  recognition.lang = 'pl-PL';
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  recognition.onstart = ()=>{
    listening = true;
    micBtn.classList.add('listening');
    micBtn.setAttribute('aria-pressed','true');
    micBtn.textContent = '⏹️ Zatrzymaj nagrywanie';
    setSpeechStatus('Słucham… Mów po polsku.');
  };
  recognition.onresult = (event)=>{
    let finalText = '', interimText = '';
    for (let i=event.resultIndex;i<event.results.length;i++){
      const phrase = event.results[i][0].transcript;
      if(event.results[i].isFinal) finalText += phrase;
      else interimText += phrase;
    }
    if(interimText) setSpeechStatus('Rozpoznaję: '+interimText);
    if(finalText.trim()){
      setSpeechStatus('Rozpoznano: '+finalText.trim());
      addMessage(finalText.trim(),'user');
      setTimeout(()=>addMessage(replyTo(finalText.trim()),'ai'),350);
    }
  };
  recognition.onerror = (event)=>{
    const errors = {
      'not-allowed':'Brak uprawnienia do mikrofonu. Zezwól na dostęp w ustawieniach przeglądarki.',
      'service-not-allowed':'Rozpoznawanie mowy zostało zablokowane.',
      'no-speech':'Nie usłyszałam głosu. Spróbuj ponownie.',
      'audio-capture':'Nie wykryto działającego mikrofonu.',
      'network':'Usługa rozpoznawania mowy jest chwilowo niedostępna.'
    };
    setSpeechStatus(errors[event.error] || 'Problem z rozpoznawaniem mowy: '+event.error);
  };
  recognition.onend = ()=>{
    listening = false;
    micBtn.classList.remove('listening');
    micBtn.setAttribute('aria-pressed','false');
    micBtn.textContent = '🎙️ Rozmawiaj z ALTIMA';
  };
  micBtn.addEventListener('click',()=>{
    if(listening) { stopListening(); return; }
    if(synthSupported && !voiceOn) setVoiceEnabled(true);
    stopSpeaking();
    try { recognition.start(); }
    catch (error) { setSpeechStatus('Nie mogę uruchomić mikrofonu. Spróbuj ponownie.'); }
  });
}
function stopListening(){
  try{recognition?.stop();}catch(error){ /* ignore */ }
}
// Speak only newly added AI responses, not user messages.
// No auto-listening after a reply to avoid microphone feedback loops.
if(chatLog && 'MutationObserver' in window){
  const observer = new MutationObserver(mutations=>{
    for(const mutation of mutations){
      for(const node of mutation.addedNodes){
        if(node.nodeType===1 && node.classList.contains('message') && node.classList.contains('ai')){
          const bubble=node.querySelector('.bubble');
          if(bubble) speakAltima(bubble.textContent);
        }
      }
    }
  });
  observer.observe(chatLog,{childList:true});
}
