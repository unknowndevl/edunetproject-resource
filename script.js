// Simple Quiz App - Beginner Friendly Code

// Global Variables
let currentUser = null;
let questions = [];
let currentQ = 0;
let score = 0;

const categories = {
  general: { id: 9, name: "General Knowledge" },
  science: { id: 17, name: "Science & Nature" },
  history: { id: 23, name: "History" },
  sports: { id: 21, name: "Sports" },
};

// Start App
document.addEventListener("DOMContentLoaded", function () {
  loadUser();
  setupButtons();
});

// Load saved user from session
function loadUser() {
  const saved = sessionStorage.getItem("user");
  if (saved) {
    currentUser = JSON.parse(saved);
    document.getElementById(
      "userWelcome"
    ).textContent = `Welcome, ${currentUser.name}!`;
  }
}

// Setup all button clicks
function setupButtons() {
  // Auth buttons
  document.querySelectorAll(".auth-tab").forEach((tab) => {
    tab.addEventListener("click", (e) => {
      document
        .querySelectorAll(".auth-tab")
        .forEach((t) => t.classList.remove("active"));
      document
        .querySelectorAll(".auth-form")
        .forEach((f) => f.classList.remove("active"));
      e.target.classList.add("active");
      const formType = e.target.textContent.toLowerCase();
      document.getElementById(formType + "Form").classList.add("active");
    });
  });

  // Category selection
  document.querySelectorAll(".category-card").forEach((card) => {
    card.addEventListener("click", () => selectCategory(card.dataset.category));
  });
}

// Show/Hide pages
function showPage(pageId) {
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  document.getElementById(pageId).classList.add("active");
}

// Login user
function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  const users = JSON.parse(localStorage.getItem("users") || "[]");
  const user = users.find((u) => u.email === email && u.password === password);

  if (user) {
    currentUser = user;
    sessionStorage.setItem("user", JSON.stringify(user));
    showPage("categoriesPage");
  } else {
    document.getElementById("loginPassword").value = "";
  }
}

// Sign up new user
function handleSignup(event) {
  event.preventDefault();
  const name = document.getElementById("signupName").value;
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  if (password.length < 6) {
    return;
  }

  const users = JSON.parse(localStorage.getItem("users") || "[]");
  if (users.find((u) => u.email === email)) {
    return;
  }

  const newUser = { id: Date.now(), name, email, password, scores: [] };
  users.push(newUser);
  localStorage.setItem("users", JSON.stringify(users));

  currentUser = newUser;
  sessionStorage.setItem("user", JSON.stringify(newUser));
  showPage("categoriesPage");
}

// Play as guest
function skipAuth() {
  currentUser = { name: "Guest", isGuest: true };
  sessionStorage.setItem("user", JSON.stringify(currentUser));
  showPage("categoriesPage");
}

// Logout
function logout() {
  currentUser = null;
  sessionStorage.removeItem("user");
  showPage("authPage");
}

// Select quiz category
function selectCategory(cat) {
  document
    .querySelectorAll(".category-card")
    .forEach((c) => c.classList.remove("selected"));
  document.querySelector(`[data-category="${cat}"]`).classList.add("selected");
  document.getElementById(
    "selectedCategoryText"
  ).textContent = `Selected: ${categories[cat].name}`;
  document.getElementById("startQuizBtn").disabled = false;
  document.getElementById("startQuizBtn").onclick = () => startQuiz(cat);
}

// Start the quiz
async function startQuiz(category) {
  currentQ = 0;
  score = 0;
  showPage("quizPage");

  document.getElementById("quizTitle").textContent =
    categories[category].name + " Quiz";
  document.getElementById("loadingScreen").style.display = "block";
  document.getElementById("questionSection").style.display = "none";

  // Fetch questions from API
  const url = `https://opentdb.com/api.php?amount=10&category=${categories[category].id}&type=multiple`;
  const response = await fetch(url);
  const data = await response.json();

  // Prepare questions
  questions = data.results.map((q, i) => {
    const answers = [...q.incorrect_answers, q.correct_answer]
      .map((a) => decodeHTML(a))
      .sort(() => Math.random() - 0.5); // Shuffle

    return {
      question: decodeHTML(q.question),
      answers: answers,
      correct: decodeHTML(q.correct_answer),
    };
  });

  showQuestion();
}

// Display current question
function showQuestion() {
  const q = questions[currentQ];

  document.getElementById("loadingScreen").style.display = "none";
  document.getElementById("questionSection").style.display = "block";
  document.getElementById("progressBar").style.width =
    ((currentQ + 1) / 10) * 100 + "%";
  document.getElementById("questionCounter").textContent = `Question ${
    currentQ + 1
  } of 10`;
  document.getElementById("scoreDisplay").textContent = `Score: ${score}/10`;
  document.getElementById("questionNumber").textContent = `Question ${
    currentQ + 1
  }`;
  document.getElementById("questionText").textContent = q.question;

  // Show answer options
  const container = document.getElementById("answerOptions");
  container.innerHTML = "";
  q.answers.forEach((answer) => {
    const div = document.createElement("div");
    div.className = "answer-option";
    div.textContent = answer;
    div.onclick = () => checkAnswer(answer, div);
    container.appendChild(div);
  });
}

// Check if answer is correct
function checkAnswer(selected, element) {
  const q = questions[currentQ];
  const allOptions = document.querySelectorAll(".answer-option");

  // Disable all options
  allOptions.forEach((opt) => (opt.style.pointerEvents = "none"));

  // Show correct/wrong
  if (selected === q.correct) {
    element.classList.add("correct");
    score++;
  } else {
    element.classList.add("incorrect");
    allOptions.forEach((opt) => {
      if (opt.textContent === q.correct) opt.classList.add("correct");
    });
  }

  // Move to next question after 2 seconds
  setTimeout(() => {
    if (currentQ < 9) {
      currentQ++;
      showQuestion();
    } else {
      showResults();
    }
  }, 2000);
}

// Show final results
function showResults() {
  const percent = Math.round((score / 10) * 100);
  showPage("resultsPage");

  document.getElementById("finalScore").textContent = `${score}/10`;
  document.getElementById("scorePercentage").textContent = `${percent}%`;

  let msg = "";
  if (percent >= 80) msg = "Excellent! 🎉";
  else if (percent >= 60) msg = "Good job! 👍";
  else msg = "Keep practicing! 💪";

  document.getElementById("resultsMessage").textContent = msg;

  // Save score for logged in users
  if (currentUser && !currentUser.isGuest) {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const user = users.find((u) => u.id === currentUser.id);
    if (user) {
      user.scores = user.scores || [];
      user.scores.push({ score, date: new Date().toLocaleDateString() });
      localStorage.setItem("users", JSON.stringify(users));
    }
  }
}

// Navigation functions
function playAgain() {
  const selected = document.querySelector(".category-card.selected");
  if (selected) startQuiz(selected.dataset.category);
}

function goToCategories() {
  showPage("categoriesPage");
}

function goHome() {
  showPage(currentUser ? "categoriesPage" : "authPage");
}

// Decode HTML entities
function decodeHTML(html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}
