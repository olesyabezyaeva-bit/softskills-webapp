const tg = window.Telegram.WebApp;

let questions = [];
let currentBlock = 0;
let currentChain = 0;
let currentStep = 0;

const questionEl = document.getElementById("question");
const answersEl = document.getElementById("answers");
const adviceEl = document.getElementById("advice");
const nextBtn = document.getElementById("nextBtn");

// Ключ для localStorage (чтобы уникально сохранить прогресс) const STORAGE_KEY = "softskills_progress";

async function loadQuestions() {
  const response = await fetch('questions.json');
  questions = await response.json();
  loadProgress();
  loadStep();
}

function saveProgress() {
  const progress = { currentBlock, currentChain, currentStep };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); }

function loadProgress() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const progress = JSON.parse(saved);
      currentBlock = progress.currentBlock ?? 0;
      currentChain = progress.currentChain ?? 0;
      currentStep = progress.currentStep ?? 0;
    } catch (e) {
      // Если JSON битый — игнорируем
      currentBlock = 0;
      currentChain = 0;
      currentStep = 0;
    }
  }
}

function loadStep() {
  adviceEl.textContent = "";
  nextBtn.style.display = "none";

  if (currentBlock >= questions.length) {
    questionEl.textContent = "Вы прошли все блоки! Поздравляем 🎉";
    answersEl.innerHTML = "";
    return;
  }

  const step = questions[currentBlock].chains[currentChain].steps[currentStep];
  questionEl.textContent = step.question;

  answersEl.innerHTML = "";
  step.answers.forEach((answer, index) => {
    const btn = document.createElement("button");
    btn.className = "answer";
    btn.textContent = answer.text;
    btn.onclick = () => selectAnswer(index);
    answersEl.appendChild(btn);
  });
}

function selectAnswer(selectedIndex) {
  const step = questions[currentBlock].chains[currentChain].steps[currentStep];
  const buttons = answersEl.querySelectorAll("button");

  buttons.forEach((btn, idx) => {
    btn.disabled = true;
    const ansType = step.answers[idx].type;
    btn.classList.add(ansType);
  });

  adviceEl.textContent = step.answers[selectedIndex].advice;
  nextBtn.style.display = "block";
  saveProgress();
}

nextBtn.onclick = () => {
  currentStep++;
  if (currentStep >= questions[currentBlock].chains[currentChain].steps.length) {
    currentStep = 0;
    currentChain++;
    if (currentChain >= questions[currentBlock].chains.length) {
      currentChain = 0;
      currentBlock++;
    }
  }
  saveProgress();
  loadStep();
};

loadQuestions();
