const tg = window.Telegram.WebApp;

let questions = [];
let currentBlock = null;  // null — меню, иначе номер блока 
let currentChain = 0; 
let currentStep = 0;

const questionEl = document.getElementById("question");
const answersEl = document.getElementById("answers");
const adviceEl = document.getElementById("advice");
const nextBtn = document.getElementById("nextBtn");

const STORAGE_KEY = "softskills_progress";

async function loadQuestions() {
  const response = await fetch('questions.json');
  questions = await response.json();
  loadProgress();
  if (currentBlock === null) {
    showMenu();
  } else {
    loadStep();
  }
}

function saveProgress() {
  const progress = { currentBlock, currentChain, currentStep, dailyTaskShown };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); }

function loadProgress() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const progress = JSON.parse(saved);
      currentBlock = progress.currentBlock ?? null;
      currentChain = progress.currentChain ?? 0;
      currentStep = progress.currentStep ?? 0;
      dailyTaskShown = progress.dailyTaskShown ?? false;
    } catch (e) {
      currentBlock = null;
      currentChain = 0;
      currentStep = 0;
      dailyTaskShown = false;
    }
  } else {
    currentBlock = null; // показываем меню при первой загрузке
    dailyTaskShown = false;
  }
}

let dailyTaskShown = false;

function showMenu() {
  questionEl.textContent = "Выберите блок для прокачки навыков:";
  adviceEl.textContent = "";
  nextBtn.style.display = "none";
  answersEl.innerHTML = "";

  questions.forEach((block, i) => {
    const btn = document.createElement("button");
    btn.textContent = block.title;
    btn.className = "answer";
    btn.onclick = () => {
      currentBlock = i;
      currentChain = 0;
      currentStep = 0;
      dailyTaskShown = false;
      saveProgress();
      loadStep();
    };
    answersEl.appendChild(btn);
  });
}

function loadStep() {
  adviceEl.textContent = "";
  nextBtn.style.display = "none";

  if (currentBlock === null) {
    showMenu();
    return;
  }

  if (currentBlock >= questions.length) {
    questionEl.textContent = "Вы прошли все блоки! Поздравляем 🎉";
    answersEl.innerHTML = "";
    return;
  }

  if (currentStep >= questions[currentBlock].chains[currentChain].steps.length) {
    if (!dailyTaskShown && questions[currentBlock].chains[currentChain].dailyTask) {
      showDailyTask();
      return;
    } else {
      dailyTaskShown = false;
      currentStep = 0;
      currentChain++;
      if (currentChain >= questions[currentBlock].chains.length) {
        currentChain = 0;
        currentBlock++;
        if (currentBlock >= questions.length) {
          questionEl.textContent = "Вы прошли все блоки! Поздравляем 🎉";
          answersEl.innerHTML = "";
          return;
        }
      }
    }
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

function showDailyTask() {
   questionEl.textContent = "Задание на день:";
  adviceEl.textContent = "";

  // Создаём контейнер для текста и кнопок
  answersEl.innerHTML = "";

  const taskText = document.createElement("p");
  taskText.style.fontWeight = "bold";
  taskText.style.marginBottom = "20px";
  taskText.textContent = questions[currentBlock].chains[currentChain].dailyTask;
  answersEl.appendChild(taskText);

  // Кнопка "Перейти к следующей цепочке"
  const nextChainBtn = document.createElement("button");
  nextChainBtn.id = "nextChainBtn";
  nextChainBtn.textContent = "Перейти к следующей цепочке";
  nextChainBtn.className = "answer";   // Важно: класс "answer"
  nextChainBtn.style.marginRight = "10px";
  answersEl.appendChild(nextChainBtn);

  // Кнопка "Назад в меню"
  const backMenuBtn = document.createElement("button");
  backMenuBtn.id = "backMenuBtn";
  backMenuBtn.textContent = "Назад в меню";
  backMenuBtn.className = "answer";   // Важно: класс "answer"
  answersEl.appendChild(backMenuBtn);

  nextChainBtn.onclick = () => {
    dailyTaskShown = true;
    currentStep = 0;
    currentChain++;
    if (currentChain >= questions[currentBlock].chains.length) {
      currentChain = 0;
      currentBlock++;
    }
    saveProgress();
    loadStep();
  };

  backMenuBtn.onclick = () => {
    currentBlock = null;
    currentChain = 0;
    currentStep = 0;
    dailyTaskShown = false;
    saveProgress();
    showMenu();
  };

  dailyTaskShown = true;
  saveProgress();

  };

  document.getElementById("backMenuBtn").onclick = () => {
    currentBlock = null;
    currentChain = 0;
    currentStep = 0;
    dailyTaskShown = false;
    saveProgress();
    showMenu();
  };

  dailyTaskShown = true;
  saveProgress();
}

function selectAnswer(selectedIndex) {
  const step = questions[currentBlock].chains[currentChain].steps[currentStep];
  const buttons = answersEl.querySelectorAll("button");

  buttons.forEach((btn, idx) => {
    btn.disabled = true;
    if (idx === selectedIndex) {
      const ansType = step.answers[idx].type;
      btn.classList.add(ansType);
    } else {
      btn.style.backgroundColor = "#ddd";
      btn.style.color = "#666";
    }
  });

  adviceEl.textContent = step.answers[selectedIndex].advice;

  setTimeout(() => {
    currentStep++;
    saveProgress();
    loadStep();
  }, 1000);
}

loadQuestions();




