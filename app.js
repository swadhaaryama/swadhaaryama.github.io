/* ---------------------------------------------------
   STORAGE & DEFAULT STATE
--------------------------------------------------- */

const defaultState = {
  stats: {
    steps: 4200,
    stepsGoal: 10000,
    caloriesBurned: 210,
    calGoal: 500,
    water: 900,
    waterGoal: 2000
  },

  activities: [
    { name: "Morning Run", duration: 30, calories: 220, time: "morning" },
    { name: "Lunch Walk", duration: 15, calories: 60, time: "afternoon" },
    { name: "Evening Yoga", duration: 40, calories: 150, time: "evening" }
  ],

  meals: {
    breakfast: [{ name: "Oats", cal: 240 }],
    lunch: [{ name: "Grilled Chicken", cal: 520 }],
    dinner: [{ name: "Salad", cal: 180 }]
  },

  weeklyActivity: [30, 45, 20, 60, 10, 0, 25],
  weeklyCalories: [1800, 2000, 1950, 2100, 1750, 1600, 1900],

  userName: "User",
  userPhoto: null
};

let useSession = false;
const storageKey = "fittrack_pro_state";

function getStorage() {
  return useSession ? sessionStorage : localStorage;
}

function loadState() {
  try {
    const raw = getStorage().getItem(storageKey);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn(e);
  }
  return JSON.parse(JSON.stringify(defaultState));
}

function saveState() {
  try {
    getStorage().setItem(storageKey, JSON.stringify(appState));
  } catch (e) {
    console.warn(e);
  }
}

let appState = loadState();

/* ---------------------------------------------------
   LOGIN HANDLING
--------------------------------------------------- */

document.getElementById("loginBtn").addEventListener("click", () => {
  const u = document.getElementById("loginUser").value.trim();
  const p = document.getElementById("loginPass").value.trim();
  const fileInput = document.getElementById("loginUpload");
  const file = fileInput.files[0];

  if (u === "admin" && p === "1234") {
    appState.userName = u;

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        appState.userPhoto = e.target.result;
        saveState();
        applyHeaderProfile();
        finishLogin();
      };
      reader.readAsDataURL(file);
    } else {
      saveState();
      applyHeaderProfile();
      finishLogin();
    }
  } else {
    document.getElementById("loginError").style.display = "block";
  }
});

function finishLogin() {
  document.getElementById("signinPage").style.display = "none";
  document.getElementById("dashboardWrapper").style.display = "block";
  refreshAll();
}

/* ---------------------------------------------------
   HEADER PROFILE
--------------------------------------------------- */

function applyHeaderProfile() {
  const avatar = document.getElementById("headerAvatar");
  const nameEl = document.getElementById("headerName");

  if (appState.userPhoto) {
    avatar.style.background = `url('${appState.userPhoto}') no-repeat center/cover`;
    avatar.textContent = "";
  } else {
    avatar.style.background = "#eef2f7";
    avatar.textContent = appState.userName[0].toUpperCase();
  }

  nameEl.textContent = appState.userName;
}

/* ---------------------------------------------------
   SIDEBAR PHOTO UPLOAD (OPTION C)
--------------------------------------------------- */

const settingsPhotoInput = document.getElementById("settingsPhotoInput");
const settingsSavePhoto = document.getElementById("settingsSavePhoto");
const settingsAvatarPreview = document.getElementById("settingsAvatarPreview");

settingsSavePhoto.addEventListener("click", () => {
  const file = settingsPhotoInput.files[0];
  if (!file) return alert("Please choose a photo");

  const reader = new FileReader();
  reader.onload = (e) => {
    appState.userPhoto = e.target.result;
    settingsAvatarPreview.style.background = `url('${appState.userPhoto}') no-repeat center/cover`;
    settingsAvatarPreview.textContent = "";
    saveState();
    applyHeaderProfile();
    showModal("Profile photo updated!");
  };
  reader.readAsDataURL(file);
});

if (appState.userPhoto) {
  settingsAvatarPreview.style.background =
    `url('${appState.userPhoto}') no-repeat center/cover`;
  settingsAvatarPreview.textContent = "";
}

/* ---------------------------------------------------
   NAVIGATION
--------------------------------------------------- */

document.querySelectorAll(".nav-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".nav-item")
      .forEach((b) => b.classList.remove("active"));

    btn.classList.add("active");

    const page = "page_" + btn.dataset.page;

    document.querySelectorAll(".page").forEach((p) => (p.style.display = "none"));

    const el = document.getElementById(page);
    if (el) el.style.display = "block";
  });
});

/* ---------------------------------------------------
   METERS
--------------------------------------------------- */

function updateMeters() {
  const s = appState.stats;

  document.getElementById("stepsValue").textContent = s.steps;
  document.getElementById("calValue").textContent = s.caloriesBurned + " kcal";
  document.getElementById("waterValue").textContent = s.water + " ml";

  document.getElementById("stepsGoal").textContent = s.stepsGoal;
  document.getElementById("calGoal").textContent = s.calGoal;
  document.getElementById("waterGoal").textContent = s.waterGoal;
}

/* ---------------------------------------------------
   ACTIVITIES
--------------------------------------------------- */

function renderActivities(filter = "all") {
  const list = document.getElementById("activityList");
  list.innerHTML = "";

  const items = appState.activities.filter(
    (a) => filter === "all" || a.time === filter
  );

  if (items.length === 0) {
    list.innerHTML = '<div class="muted">No activities</div>';
    return;
  }

  items.forEach((a, idx) => {
    const div = document.createElement("div");
    div.className = "activity";

    div.innerHTML = `
      <div>
        <strong>${escapeHtml(a.name)}</strong>
        <div class="muted">${a.duration} mins • ${a.time}</div>
      </div>
      <div>
        <div class="muted">${a.calories} kcal</div>
        <button class="btn" data-idx="${idx}">Delete</button>
      </div>`;

    list.appendChild(div);

    div.querySelector("button").addEventListener("click", () => {
      appState.activities.splice(idx, 1);
      saveState();
      renderActivities(filter);
      updateSummary();
      showModal("Activity removed.");
    });
  });
}

/* FILTER BUTTONS */
document.querySelectorAll(".filterBtn").forEach((b) =>
  b.addEventListener("click", () => {
    document
      .querySelectorAll(".filterBtn")
      .forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    renderActivities(b.dataset.filter);
  })
);

/* ADD ACTIVITY */
const addActivityForm = document.getElementById("addActivityForm");

addActivityForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("actName").value.trim();
  const duration = parseInt(document.getElementById("actDuration").value, 10);
  const calories = parseInt(document.getElementById("actCalories").value, 10);
  const time = document.getElementById("actTimeOfDay").value;

  let ok = true;

  if (!name) {
    showInline("errName", "Please provide a name");
    ok = false;
  } else showInline("errName", "");

  if (isNaN(duration) || duration < 1 || duration > 300) {
    showInline("errDuration", "Enter 1-300");
    ok = false;
  } else showInline("errDuration", "");

  if (isNaN(calories) || calories < 0 || calories > 5000) {
    showInline("errCalories", "Enter 0-5000");
    ok = false;
  } else showInline("errCalories", "");

  if (!ok) return;

  appState.activities.unshift({ name, duration, calories, time });
  saveState();

  renderActivities(
    document.querySelector(".filterBtn.active")?.dataset.filter || "all"
  );

  updateSummary();
  showModal("Activity Added Successfully.");
  addActivityForm.reset();
});

function showInline(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.style.display = msg ? "block" : "none";
}

/* ---------------------------------------------------
   MEAL PLANNER
--------------------------------------------------- */

function renderMeals() {
  ["breakfast", "lunch", "dinner"].forEach((meal) => {
    const ul = document.getElementById(meal + "List");
    ul.innerHTML = "";

    appState.meals[meal].forEach((it, idx) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span>${escapeHtml(it.name)}</span>
        <span>${it.cal} kcal 
          <button class="btn" data-meal="${meal}" data-idx="${idx}">Remove</button>
        </span>`;

      ul.appendChild(li);

      li.querySelector("button").addEventListener("click", () => {
        appState.meals[meal].splice(idx, 1);
        saveState();
        renderMeals();
        updateCalories();
        showModal("Meal removed");
      });
    });
  });

  updateCalories();
}

document.getElementById("addBreakfast").addEventListener("click", () =>
  addMeal("breakfast", "bfName", "bfCal", "errBf")
);

document.getElementById("addLunch").addEventListener("click", () =>
  addMeal("lunch", "lnName", "lnCal", "errLn")
);

document.getElementById("addDinner").addEventListener("click", () =>
  addMeal("dinner", "dnName", "dnCal", "errDn")
);

function addMeal(meal, nameId, calId, errId) {
  const nameEl = document.getElementById(nameId);
  const calEl = document.getElementById(calId);

  const name = nameEl.value.trim();
  const cal = parseInt(calEl.value, 10);

  if (!name || isNaN(cal) || cal < 0) {
    showInline(errId, "Provide valid meal name & calories");
    return;
  }

  const exists = appState.meals[meal].some(
    (it) => it.name.toLowerCase() === name.toLowerCase()
  );
  if (exists) {
    showInline(errId, "Item already exists");
    return;
  }

  showInline(errId, "");

  appState.meals[meal].push({ name, cal });
  saveState();
  renderMeals();

  nameEl.value = "";
  calEl.value = "";

  showModal("Meal added");
}

function updateCalories() {
  const total = ["breakfast", "lunch", "dinner"].reduce(
    (s, m) => s + appState.meals[m].reduce((a, b) => a + b.cal, 0),
    0
  );

  document.getElementById("dailyCalories").textContent = total;
  saveState();
}

/* ---------------------------------------------------
   INSIGHTS
--------------------------------------------------- */

function renderInsights() {
  const act = document.getElementById("weeklyActivity");
  const cal = document.getElementById("weeklyCalories");

  act.innerHTML = "";
  cal.innerHTML = "";

  appState.weeklyActivity.forEach((v, i) => {
    const div = document.createElement("div");
    div.className = "bar";
    div.style.height = "6px";

    act.appendChild(div);

    setTimeout(() => {
      div.style.height = Math.max(6, (v / 100) * 140) + "px";
      if (i === 3) div.classList.add("active");
    }, 50);
  });

  appState.weeklyCalories.forEach((v, i) => {
    const div = document.createElement("div");
    div.className = "bar";
    div.style.height = "6px";

    cal.appendChild(div);

    setTimeout(() => {
      div.style.height = Math.max(6, (v / 2500) * 140) + "px";
      if (i === 3) div.classList.add("active");
    }, 70);
  });
}

/* ---------------------------------------------------
   DOWNLOAD SUMMARY
--------------------------------------------------- */

document.getElementById("downloadSummary").addEventListener("click", () => {
  const s = JSON.stringify(appState, null, 2);
  const blob = new Blob([s], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "fittrack_summary.json";
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);

  showModal("Summary downloaded.");
});

/* ---------------------------------------------------
   RESET DASHBOARD
--------------------------------------------------- */

document.getElementById("resetBtn").addEventListener("click", () => {
  if (confirm("Clear saved dashboard values?")) {
    getStorage().removeItem(storageKey);
    appState = JSON.parse(JSON.stringify(defaultState));
    saveState();
    refreshAll();
    showModal("Dashboard reset.");
  }
});

/* ---------------------------------------------------
   STORAGE SWITCH
--------------------------------------------------- */

document.getElementById("toggleStorage").addEventListener("click", () => {
  useSession = !useSession;

  document.getElementById("toggleStorage").textContent =
    useSession ? "Use localStorage" : "Use sessionStorage";

  const other = useSession ? localStorage : sessionStorage;

  if (other.getItem(storageKey)) {
    appState = JSON.parse(other.getItem(storageKey));
    other.removeItem(storageKey);
  }

  saveState();
  refreshAll();
});

/* ---------------------------------------------------
   MODAL
--------------------------------------------------- */

const overlay = document.getElementById("overlay");
const modalMessage = document.getElementById("modalMessage");
const closeModal = document.getElementById("closeModal");

function showModal(msg) {
  modalMessage.textContent = msg;
  overlay.classList.add("open");
}

closeModal.addEventListener("click", () => {
  overlay.classList.remove("open");
});

overlay.addEventListener("click", (e) => {
  if (e.target === overlay) overlay.classList.remove("open");
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && overlay.classList.contains("open")) {
    overlay.classList.remove("open");
  }
});

/* ---------------------------------------------------
   SUMMARY REFRESH
--------------------------------------------------- */

function updateSummary() {
  const totalCalories = appState.activities.reduce(
    (s, a) => s + a.calories,
    0
  );

  appState.stats.caloriesBurned = totalCalories;

  saveState();
  updateMeters();
  renderMeals();
  renderActivities(
    document.querySelector(".filterBtn.active")?.dataset.filter || "all"
  );
  renderInsights();
}

function refreshAll() {
  updateMeters();
  renderActivities();
  renderMeals();
  renderInsights();

  document.querySelectorAll(".page").forEach((p) => (p.style.display = "none"));
  document.getElementById("page_stats").style.display = "block";

  applyHeaderProfile();
}

/* ---------------------------------------------------
   UTILS
--------------------------------------------------- */

function escapeHtml(text) {
  return String(text).replace(/[&"'<>]/g, (s) =>
    ({
      "&": "&amp;",
      '"': "&quot;",
      "'": "&#39;",
      "<": "&lt;",
      ">": "&gt;"
    }[s])
  );
}

/* ---------------------------------------------------
   INIT
--------------------------------------------------- */

updateMeters();
renderActivities();
renderMeals();
renderInsights();
applyHeaderProfile();
