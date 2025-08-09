// script.js — main logic for menu / quiz / progress / daily task 
const TELEGRAM = window.Telegram?.WebApp || null;

// Replace with your hero image URL (uploaded to GitHub / Netlify) 
const HERO_IMG_URL = "https://github.com/olesyabezyaeva-bit/softskills-webapp/blob/main/hum.png";

// DOM
const introEl = document.getElementById("intro"); const startBtn = document.getElementById("startBtn");
const heroImage = document.getElementById("heroImage");
const menuHero = document.getElementById("menuHero");

const menuEl = document.getElementById("menu"); const blocksContainer = document.getElementById("blocksContainer");
const quizEl = document.getElementById("quiz"); const dailyEl = document.getElementById("daily"); const blockCompleteEl = document.getElementById("blockComplete");

const questionEl = document.getElementById("question");
const answersEl = document.getElementById("answers");
const adviceEl = document.getElementById("advice");
const dailyText = document.getElementById("dailyText");
const dailyNext = document.getElementById("dailyNext");
const dailyMenu = document.getElementById("dailyMenu");

const btnMainMenu = document.getElementById("btnMainMenu");
const btnBack = document.getElementById("btnBack");
const scoreEl = document.getElementById("score"); const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");
const completeTitle = document.getElementById("completeTitle");
const completeText = document.getElementById("completeText");
const completeMenu = document.getElementById("completeMenu");

const STORAGE_KEY = "softskills_progress_v2";

// app state
let questions = [];
let currentBlock = null; // null = menu
let currentChain = 0;
let currentStep = 0;
let dailyTaskShown = false;

let score = 0;
let totalQuestions = 0;

// history stack for "Back" (review)
const history = []; // each entry: {block,chain,step,selectedIndex,addedScore}

// helpers: show/hide
function hideAllScreens(){
  introEl.classList.add("hidden");
  menuEl.classList.add("hidden");
  quizEl.classList.add("hidden");
  dailyEl.classList.add("hidden");
  blockCompleteEl.classList.add("hidden");
}
function show(el){ el.classList.remove("hidden"); }

// load questions.json
async function loadQuestions(){
  try{
    const res = await fetch("questions.json");
    questions = await res.json();
    // compute total questions for progress
    totalQuestions = 0;
    questions.forEach(b => b.chains.forEach(c => totalQuestions += c.steps.length));
    loadProgress();
    // set hero images
    heroImage.src = HERO_IMG_URL;
    menuHero.src = HERO_IMG_URL;
    // start on intro
    showIntro();
  }catch(err){
    console.error("Failed to load questions.json", err);
    alert("Не удалось загрузить данные. Проверьте questions.json и размещение файлов.");
  }
}

// intro animation -> then show menu
function showIntro(){
  hideAllScreens();
  show(introEl);
  // play animation
  setTimeout(()=> introEl.classList.add("play"), 100);
  // after animation show menu
  setTimeout(()=> {
    introEl.classList.add("hidden");
    showMenu();
  }, 2200);
}

// menu
function showMenu(){
  hideAllScreens();
  show(menuEl);
  currentBlock = null;
  updateScoreAndProgress();
  renderBlocks();
}

function renderBlocks(){
  blocksContainer.innerHTML = "";
  questions.forEach((block, i) => {
    const div = document.createElement("div");
    div.className = "block";
    div.innerHTML = `<div style="font-size:15px; font-weight:700;">${block.title}</div>
                     <div style="font-size:13px; color:#556; margin-top:8px;">${block.chains.length} цепочек</div>`;
    div.onclick = () => {
      currentBlock = i;
      currentChain = 0;
      currentStep = 0;
      dailyTaskShown = false;
      saveProgress();
      showQuiz();
    };
    blocksContainer.appendChild(div);
  });
}

// main quiz screen
function showQuiz(){
  hideAllScreens();
  show(quizEl);
  updateScoreAndProgress();
  renderStep();
}

function renderStep(){
  adviceEl.textContent = "";
  if(currentBlock === null){
    showMenu();
    return;
  }
  // bounds check
  if(currentBlock >= questions.length){
    showAllDone();
    return;
  }
  const chain = questions[currentBlock].chains[currentChain];
  // if finished chain steps
  if(currentStep >= chain.steps.length){
    // show daily task for this chain (if exists)
    if(!dailyTaskShown && chain.dailyTask){
      showDaily(chain.dailyTask);
      return;
    }
    // else move to next chain
    dailyTaskShown = false;
    currentStep = 0;
    currentChain++;
    if(currentChain >= questions[currentBlock].chains.length){
      // block finished
      showBlockComplete();
      return;
    }
  }
  // normal question
  const step = questions[currentBlock].chains[currentChain].steps[currentStep];
  questionEl.innerText = step.question;
  answersEl.innerHTML = "";

  step.answers.forEach((ans, idx) => {
    const btn = document.createElement("button");
    btn.className = "answer neutral";
    // letter label A/B/C/D
    const letter = String.fromCharCode(65 + idx);
    btn.innerHTML = `<strong style="margin-right:12px; display:inline-block; width:28px;">${letter}.</strong> ${ans.text}`;
    btn.onclick = () => handleAnswer(idx);
    answersEl.appendChild(btn);
  });
}

// handle answer: highlight only selected, grey others, push history, update score, auto next 
function handleAnswer(selectedIndex){
  const chain = questions[currentBlock].chains[currentChain];
  const step = chain.steps[currentStep];
  const buttons = answersEl.querySelectorAll("button");
  let added = 0;
  buttons.forEach((btn, idx) => {
    btn.disabled = true;
    if(idx === selectedIndex){
      const t = step.answers[idx].type;
      btn.classList.remove("neutral");
      if(t === "correct") btn.classList.add("correct");
      else if(t === "almost") btn.classList.add("almost");
      else btn.classList.add("wrong");

      if(t === "correct") added = 1;
      else if(t === "almost") added = 0.5;
    } else {
      btn.style.backgroundColor = "#eee";
      btn.style.color = "#333";
    }
  });
  // show advice
  adviceEl.innerText = step.answers[selectedIndex].advice || "";

  // push to history for Back (review)
  history.push({
    block: currentBlock, chain: currentChain, step: currentStep,
    selectedIndex, addedScore: added
  });

  score += added;
  updateScoreAndProgress();
  saveProgress();

  // auto next after delay
  setTimeout(()=> {
    currentStep++;
    renderStep();
    saveProgress();
  }, 1100);
}

// show daily task
function showDaily(text){
  hideAllScreens();
  show(dailyEl);
  dailyText.innerText = text;
  // wire buttons
  dailyNext.onclick = () => {
    dailyTaskShown = true;
    currentStep = 0;
    currentChain++;
    // if chains finished then block complete will show next
    saveProgress();
    showQuiz();
  };
  dailyMenu.onclick = () => {
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

// block complete
function showBlockComplete(){
  hideAllScreens();
  show(blockCompleteEl);
  completeTitle.innerText = `Блок "${questions[currentBlock].title}" пройден!`;
  completeText.innerText = `Ваш счёт: ${score.toFixed(1)} баллов`;
  completeMenu.onclick = () => {
    currentBlock = null;
    currentChain = 0;
    currentStep = 0;
    dailyTaskShown = false;
    saveProgress();
    showMenu();
  };
}

// all blocks done
function showAllDone(){
  hideAllScreens();
  show(blockCompleteEl);
  completeTitle.innerText = `Все блоки пройдены!`;
  completeText.innerText = `Итоговый счёт: ${score.toFixed(1)} баллов`;
  completeMenu.onclick = () => {
    // go to menu
    currentBlock = null;
    currentChain = 0;
    currentStep = 0;
    saveProgress();
    showMenu();
  };
}

// update top UI
function updateScoreAndProgress(){
  scoreEl.innerText = `Баллы: ${score.toFixed(1)}`;
  // progress percent = answered questions / totalQuestions
  // compute answered via history length
  const answered = history.length;
  const pct = totalQuestions ? Math.round((answered / totalQuestions) * 100) : 0;
  progressFill.style.width = `${pct}%`;
  progressText.innerText = `${pct}%`;
}

// BACK button — review previous answer (one step back) function goBack(){
  if(history.length === 0){
    // if in quiz, return to menu
    showMenu();
    return;
  }
  const last = history.pop();
  // revert score
  score -= last.addedScore;
  if(score < 0) score = 0;
  // restore indices to last question
  currentBlock = last.block;
  currentChain = last.chain;
  currentStep = last.step;
  dailyTaskShown = false;
  saveProgress();
  showQuiz();
}

// save / load progress to localStorage
function saveProgress(){
  const state = { currentBlock, currentChain, currentStep, dailyTaskShown, score, history };
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch(e){ console.warn("save failed", e); } } function loadProgress(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return;
    const st = JSON.parse(raw);
    currentBlock = (typeof st.currentBlock === "number") ? st.currentBlock : null;
    currentChain = st.currentChain ?? 0;
    currentStep = st.currentStep ?? 0;
    dailyTaskShown = st.dailyTaskShown ?? false;
    score = st.score ?? 0;
    // restore history (if any)
    if(Array.isArray(st.history)) history.splice(0, history.length, ...st.history);
  }catch(e){ console.warn("load error", e); } }

// wiring UI
startBtn.onclick = ()=> { showMenu(); }; 
btnMainMenu.onclick = ()=> { currentBlock = null; saveProgress(); showMenu(); }; 
btnBack.onclick = ()=> { goBack(); };

// initialize
loadQuestions();







