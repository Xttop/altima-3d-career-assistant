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

function applyRotation(deg){
  currentRotation = ((deg % 360) + 360) % 360;
  viewerModelWrap.style.transform = `translateX(-50%) rotateY(${currentRotation}deg)`;
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