const storageKey = "reminder-app-items";
const reminderList = document.getElementById("reminderList");
const completedList = document.getElementById("completedList");
const emptyState = document.getElementById("emptyState");
const completedSection = document.getElementById("completedSection");
const completedEmpty = document.getElementById("completedEmpty");
const toggleCompletedBtn = document.getElementById("toggleCompleted");
const clearCompletedBtn = document.getElementById("clearCompleted");
const nextReminderEl = document.getElementById("nextReminder");
const currentDateEl = document.getElementById("currentDate");
const scheduledInput = document.getElementById("scheduledAt");
const reminderForm = document.getElementById("reminderForm");

const state = {
  reminders: [],
  showCompleted: false,
};

function loadReminders() {
  try {
    const saved = localStorage.getItem(storageKey);
    state.reminders = saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Không thể đọc dữ liệu nhắc việc", error);
    state.reminders = [];
  }
}

function saveReminders() {
  localStorage.setItem(storageKey, JSON.stringify(state.reminders));
}

function setMinDateTime() {
  const now = new Date();
  const iso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
  scheduledInput.min = iso;
}

function formatDateTime(value) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

function getCountdown(target) {
  const now = Date.now();
  const diff = new Date(target).getTime() - now;

  if (diff <= 0) {
    return "Đã quá hạn";
  }

  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) {
    return `${minutes} phút nữa`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} giờ nữa`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days} ngày nữa`;
  }

  const weeks = Math.floor(days / 7);
  return `${weeks} tuần nữa`;
}

function determineStatus(reminder) {
  const now = Date.now();
  const target = new Date(reminder.scheduledAt).getTime();

  if (reminder.completed) {
    return "completed";
  }

  if (target < now) {
    return "overdue";
  }

  const hours = (target - now) / 36e5;
  if (hours <= 6) {
    return "soon";
  }

  return "upcoming";
}

function renderReminders() {
  reminderList.innerHTML = "";
  completedList.innerHTML = "";

  const sorted = [...state.reminders].sort((a, b) => {
    return new Date(a.scheduledAt) - new Date(b.scheduledAt);
  });

  const activeReminders = sorted.filter((item) => !item.completed);
  const completedReminders = sorted.filter((item) => item.completed);

  emptyState.classList.toggle("hidden", activeReminders.length > 0);
  completedEmpty.classList.toggle("hidden", completedReminders.length > 0);
  completedSection.classList.toggle("hidden", !state.showCompleted);
  toggleCompletedBtn.textContent = state.showCompleted
    ? "Ẩn lịch sử"
    : "Hiện lịch sử";

  for (const reminder of activeReminders) {
    const item = createReminderItem(reminder);
    reminderList.appendChild(item);
  }

  if (state.showCompleted) {
    for (const reminder of completedReminders) {
      const item = createReminderItem(reminder);
      completedList.appendChild(item);
    }
  }

  renderNextReminder(activeReminders);
}

function renderNextReminder(reminders) {
  if (!reminders.length) {
    nextReminderEl.innerHTML = "<strong>Không có nhắc việc sắp tới.</strong>";
    return;
  }

  const next = reminders[0];
  nextReminderEl.innerHTML = `
    <small>Tiếp theo</small>
    <span>${next.title}</span>
    <span class="countdown">${getCountdown(next.scheduledAt)}</span>
    <small>${formatDateTime(next.scheduledAt)}</small>
  `;
}

function createReminderItem(reminder) {
  const item = document.createElement("li");
  item.className = "reminder-item";
  item.dataset.id = reminder.id;
  const status = determineStatus(reminder);
  if (status === "overdue") {
    item.classList.add("overdue");
  }
  if (status === "soon") {
    item.classList.add("soon");
  }
  if (status === "completed") {
    item.classList.add("completed");
  }

  const content = document.createElement("div");
  content.className = "reminder-content";

  const title = document.createElement("h3");
  title.className = "reminder-title";
  title.textContent = reminder.title;
  content.appendChild(title);

  const meta = document.createElement("div");
  meta.className = "reminder-meta";

  const time = document.createElement("span");
  time.textContent = formatDateTime(reminder.scheduledAt);
  meta.appendChild(time);

  const countdown = document.createElement("span");
  countdown.className = "countdown";
  countdown.textContent =
    status === "completed"
      ? "Đã hoàn thành"
      : getCountdown(reminder.scheduledAt);
  meta.appendChild(countdown);

  if (reminder.notes) {
    const note = document.createElement("span");
    note.textContent = reminder.notes;
    meta.appendChild(note);
  }

  content.appendChild(meta);
  item.appendChild(content);

  const actions = document.createElement("div");
  actions.className = "reminder-actions";

  const completeBtn = document.createElement("button");
  completeBtn.className = "complete-btn";
  completeBtn.type = "button";
  completeBtn.textContent = reminder.completed ? "Hoàn tác" : "Hoàn thành";
  completeBtn.addEventListener("click", () => toggleComplete(reminder.id));
  actions.appendChild(completeBtn);

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-btn";
  deleteBtn.type = "button";
  deleteBtn.textContent = "Xoá";
  deleteBtn.addEventListener("click", () => deleteReminder(reminder.id));
  actions.appendChild(deleteBtn);

  item.appendChild(actions);
  return item;
}

function toggleComplete(id) {
  state.reminders = state.reminders.map((item) =>
    item.id === id ? { ...item, completed: !item.completed } : item
  );
  saveReminders();
  renderReminders();
}

function deleteReminder(id) {
  state.reminders = state.reminders.filter((item) => item.id !== id);
  saveReminders();
  renderReminders();
}

function clearCompleted() {
  state.reminders = state.reminders.filter((item) => !item.completed);
  saveReminders();
  renderReminders();
}

function handleSubmit(event) {
  event.preventDefault();
  const formData = new FormData(reminderForm);
  const title = formData.get("title").trim();
  const scheduledAt = formData.get("scheduledAt");
  const notes = formData.get("notes").trim();

  if (!title || !scheduledAt) {
    return;
  }

  const newReminder = {
    id: crypto.randomUUID(),
    title,
    scheduledAt,
    notes,
    completed: false,
    createdAt: new Date().toISOString(),
  };

  state.reminders.push(newReminder);
  saveReminders();
  renderReminders();
  reminderForm.reset();
  setMinDateTime();
}

function updateCurrentDate() {
  currentDateEl.textContent = new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "full",
  }).format(new Date());
}

function startCountdownTicker() {
  setInterval(() => {
    renderReminders();
  }, 60000);
}

function init() {
  setMinDateTime();
  updateCurrentDate();
  loadReminders();
  renderReminders();
  startCountdownTicker();

  reminderForm.addEventListener("submit", handleSubmit);
  toggleCompletedBtn.addEventListener("click", () => {
    state.showCompleted = !state.showCompleted;
    renderReminders();
  });
  clearCompletedBtn.addEventListener("click", clearCompleted);

  setInterval(updateCurrentDate, 60 * 1000);
}

window.addEventListener("DOMContentLoaded", init);
