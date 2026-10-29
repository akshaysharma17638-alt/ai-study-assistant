// ============================================
// AI Study Assistant - script.js
// ============================================

// Short helper: get an element by its ID
const $ = (id) => document.getElementById(id);

// ---------- LocalStorage helpers ----------
// Load an array from LocalStorage (returns [] if nothing is saved or data is broken)
function loadData(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (error) {
    return [];
  }
}

// Save an array to LocalStorage
function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ---------- App data ----------
let notes = loadData("notes");
let tasks = loadData("tasks");

// ============================================
// 1. HEADER: welcome message and today's date
// ============================================
function setupHeader() {
  const now = new Date();
  $("todayDate").textContent = "📆 " + now.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

  const hour = now.getHours();
  let greeting = "Good evening";
  if (hour < 12) greeting = "Good morning";
  else if (hour < 18) greeting = "Good afternoon";
  $("welcomeMessage").textContent = greeting + "! Welcome back. Let's make today a productive study day.";
}

// ============================================
// 2. NAVIGATION: switch between sections
// ============================================
function showSection(name) {
  // Hide all sections, then show the chosen one
  document.querySelectorAll(".section").forEach((s) => s.classList.remove("active"));
  $(name).classList.add("active");

  // Highlight the matching sidebar button
  document.querySelectorAll(".nav-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.section === name);
  });
}

// Every element with data-section (sidebar buttons AND dashboard cards) switches sections
document.querySelectorAll("[data-section]").forEach((el) => {
  el.addEventListener("click", () => showSection(el.dataset.section));
});

// ============================================
// 3. AI STUDY CHAT (demo responses only)
// ============================================
// NOTE: Never put a secret API key in frontend JavaScript.
// To use a real AI later, call your own backend server, which keeps the key safe.

function getDemoReply(question) {
  const q = question.toLowerCase();
  if (q.includes("hello") || q.includes("hi")) {
    return "Hello! I'm a demo assistant. Ask me about study tips, time management, or exams.";
  }
  if (q.includes("exam") || q.includes("test")) {
    return "Exam tip: start early, practice past papers, and review your mistakes.";
  }
  if (q.includes("focus") || q.includes("concentrate")) {
    return "Try the Pomodoro method: study 25 minutes, then take a 5-minute break.";
  }
  if (q.includes("time") || q.includes("plan") || q.includes("schedule")) {
    return "Plan your week in the Study Planner. Break big goals into small daily tasks.";
  }
  if (q.includes("memor") || q.includes("remember")) {
    return "Use active recall: close your book and test yourself. Spaced repetition also helps.";
  }
  return "That's a great question! (This is a demo response. A real AI is not connected yet.)";
}

// Add one message bubble to the chat box
function addMessage(text, sender) {
  const bubble = document.createElement("div");
  bubble.className = "msg " + sender;

  if (sender === "bot") {
    const label = document.createElement("small");
    label.textContent = "Assistant (demo response)";
    bubble.appendChild(label);
  }

  const content = document.createElement("div");
  content.textContent = text; // textContent is safe (no HTML injection)
  bubble.appendChild(content);

  $("chatBox").appendChild(bubble);
  $("chatBox").scrollTop = $("chatBox").scrollHeight; // scroll to newest message
}

function showWelcomeChat() {
  addMessage("Hi! I'm your demo study assistant. Ask me a question to get started.", "bot");
}

$("chatForm").addEventListener("submit", (event) => {
  event.preventDefault(); // stop the page from reloading
  const question = $("chatInput").value.trim();
  if (question === "") return; // validate empty input

  addMessage(question, "user");
  $("chatInput").value = "";

  // Small delay so it feels like the assistant is "thinking"
  setTimeout(() => addMessage(getDemoReply(question), "bot"), 500);
});

$("clearChatBtn").addEventListener("click", () => {
  $("chatBox").innerHTML = "";
  showWelcomeChat();
});

// ============================================
// 4. MY NOTES
// ============================================
function renderNotes() {
  const list = $("notesList");
  list.innerHTML = "";

  if (notes.length === 0) {
    list.innerHTML = '<p class="empty">No notes yet. Add your first note above.</p>';
  }

  notes.forEach((note) => {
    const box = document.createElement("div");
    box.className = "note";

    const title = document.createElement("h3");
    title.textContent = note.title;

    const body = document.createElement("p");
    body.textContent = note.body;

    const delBtn = document.createElement("button");
    delBtn.className = "btn btn-danger";
    delBtn.textContent = "🗑 Delete";
    delBtn.addEventListener("click", () => deleteNote(note.id));

    box.append(title, body, delBtn);
    list.appendChild(box);
  });

  $("notesCount").textContent = notes.length;
}

function deleteNote(id) {
  notes = notes.filter((n) => n.id !== id);
  saveData("notes", notes);
  renderNotes();
}

$("noteForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const title = $("noteTitle").value.trim();
  const body = $("noteBody").value.trim();

  // Validate empty inputs
  if (title === "" || body === "") {
    $("noteError").textContent = "Please enter both a title and a description.";
    return;
  }

  $("noteError").textContent = "";
  notes.unshift({ id: Date.now(), title: title, body: body }); // newest first
  saveData("notes", notes);
  $("noteForm").reset();
  renderNotes();
});

// ============================================
// 5. STUDY PLANNER
// ============================================
function renderTasks() {
  const list = $("taskList");
  list.innerHTML = "";

  if (tasks.length === 0) {
    list.innerHTML = '<li class="empty">No tasks yet. Add your first task above.</li>';
  }

  tasks.forEach((task) => {
    const item = document.createElement("li");
    item.className = "task" + (task.done ? " done" : "");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.addEventListener("change", () => toggleTask(task.id));

    const text = document.createElement("span");
    text.textContent = task.text;

    const delBtn = document.createElement("button");
    delBtn.className = "btn btn-danger";
    delBtn.textContent = "🗑";
    delBtn.setAttribute("aria-label", "Delete task");
    delBtn.addEventListener("click", () => deleteTask(task.id));

    item.append(checkbox, text, delBtn);
    list.appendChild(item);
  });

  updateProgress();
}

function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (task) task.done = !task.done;
  saveData("tasks", tasks);
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  saveData("tasks", tasks);
  renderTasks();
}

$("taskForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const text = $("taskInput").value.trim();

  if (text === "") {
    $("taskError").textContent = "Please enter a task.";
    return;
  }

  $("taskError").textContent = "";
  tasks.push({ id: Date.now(), text: text, done: false });
  saveData("tasks", tasks);
  $("taskInput").value = "";
  renderTasks();
});

// ============================================
// 6. PROGRESS (updates every time tasks change)
// ============================================
function updateProgress() {
  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;
  const pending = total - done;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  $("statTotal").textContent = total;
  $("statDone").textContent = done;
  $("statPending").textContent = pending;
  $("plannerTotal").textContent = total;
  $("plannerDone").textContent = done;
  $("tasksCount").textContent = total;
  $("progressPercent").textContent = percent + "%";
  $("progressBar").style.width = percent + "%";
}

// ============================================
// START THE APP
// ============================================
setupHeader();
showWelcomeChat();
renderNotes();
renderTasks();