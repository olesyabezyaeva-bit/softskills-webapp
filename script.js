const tg = window.Telegram.WebApp;

let questions = [];
let currentBlock = null;
let currentChain = 0;
let currentStep = 0;
let score = 0;
let history = [];

const STORAGE_KEY = "softskills_progress";

const questionEl = document.getElementById("question");
const answersEl = document.getElementById("answers");
const adviceEl = document.getElementById("advice");
const menuBtn = document.getElementById("menuBtn");
const backBtn = document.getElementById("backBtn");

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
    const progress = { currentBlock, currentChain, currentStep, score, history };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); }

function loadProgress() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const progress = JSON.parse(saved);
            currentBlock = progress.currentBlock ?? null;
            currentChain = progress.currentChain ?? 0;
            currentStep = progress.currentStep ?? 0;
            score = progress.score ?? 0;
            history = progress.history ?? [];
        } catch {
            resetProgress();
        }
    } else {
        resetProgress();
    }
}

function resetProgress() {
    currentBlock = null;
    currentChain = 0;
    currentStep = 0;
    score = 0;
    history = [];
}

function showMenu() {
    questionEl.textContent = "Выберите блок для прокачки:";
    adviceEl.textContent = "";
    answersEl.innerHTML = "";

    questions.forEach((block, i) => {
        const btn = document.createElement("button");
        btn.textContent = block.title;
        btn.className = "answer";
        btn.onclick = () => {
            currentBlock = i;
            currentChain = 0;
            currentStep = 0;
            score = 0;
            history = [];
            saveProgress();
            loadStep();
        };
        answersEl.appendChild(btn);
    });
}

function loadStep() {
    adviceEl.textContent = "";

    if (currentBlock === null) {
        showMenu();
        return;
    }

    const chain = questions[currentBlock].chains[currentChain];
    if (currentStep >= chain.steps.length) {
        showResult();
        return;
    }

    const step = chain.steps[currentStep];
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
        if (idx === selectedIndex) {
            const ansType = step.answers[idx].type;
            btn.classList.add(ansType);
            if (ansType === "correct") score += 3;
            else if (ansType === "almost") score += 1;
        } else {
            btn.style.backgroundColor = "#ddd";
            btn.style.color = "#666";
        }
    });

    adviceEl.textContent = step.answers[selectedIndex].advice;

    history.push({ block: currentBlock, chain: currentChain, step: currentStep });
    saveProgress();

    setTimeout(() => {
        currentStep++;
        saveProgress();
        loadStep();
    }, 800);
}

function showResult() {
    questionEl.textContent = "Результат цепочки:";
    adviceEl.textContent = `Вы набрали ${score} баллов`;
    answersEl.innerHTML = `
        <button id="nextChainBtn">Следующая цепочка</button>
        <button id="menuReturnBtn">Меню</button>
    `;

    document.getElementById("nextChainBtn").onclick = () => {
        currentStep = 0;
        currentChain++;
        if (currentChain >= questions[currentBlock].chains.length) {
            currentBlock = null;
        }
        saveProgress();
        loadStep();
    };

    document.getElementById("menuReturnBtn").onclick = () => {
        currentBlock = null;
        saveProgress();
        showMenu();
    };
}

menuBtn.onclick = () => {
    currentBlock = null;
    saveProgress();
    showMenu();
};

backBtn.onclick = () => {
    if (history.length > 0) {
        const last = history.pop();
        currentBlock = last.block;
        currentChain = last.chain;
        currentStep = last.step;
        saveProgress();
        loadStep();
    }
};

loadQuestions();

