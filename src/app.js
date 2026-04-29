const STORAGE_KEY = "clipIsland.history.v1";
const CAPSULE_STORAGE_KEY = "clipIsland.capsules.v1";
const AUTO_SAVE_KEY = "clipIsland.autoSave.v1";
const MAX_HISTORY = 50;
const POLL_MS = 3000;

const emojiByType = {
  otp: "🔐 OTP Saved",
  url: "🔗 Link Saved",
  phone: "📞 Number Saved",
  text: "📝 Note Saved",
};

const refs = {
  island: document.querySelector("#dynamicIsland"),
  clipIcon: document.querySelector("#clipIcon"),
  clipCount: document.querySelector("#clipCount"),
  latestPreview: document.querySelector("#latestPreview"),
  clipList: document.querySelector("#clipList"),
  activeCard: document.querySelector("#activeCard"),
  autoSaveToggle: document.querySelector("#autoSaveToggle"),
  manualCapture: document.querySelector("#manualCapture"),
  slideNotice: document.querySelector("#slideNotice"),
  capsuleGrid: document.querySelector("#capsuleGrid"),
  keyboardKeys: document.querySelector("#keyboardKeys"),
  clearHistory: document.querySelector("#clearHistory"),
  prevClip: document.querySelector("#prevClip"),
  nextClip: document.querySelector("#nextClip"),
};

let history = readFromStorage(STORAGE_KEY, []);
let capsules = readFromStorage(CAPSULE_STORAGE_KEY, defaultCapsules());
let activeIndex = 0;
let autoSaveEnabled = readFromStorage(AUTO_SAVE_KEY, true);
let lastClipboardRead = history[0]?.value || "";
let pollHandle = null;
let touchStartX = null;

init();

function init() {
  refs.autoSaveToggle.checked = autoSaveEnabled;
  bindEvents();
  render();
  setPolling(autoSaveEnabled);
}

function bindEvents() {
  refs.island.addEventListener("click", (event) => {
    if (event.target.closest("button") && event.target !== refs.island) {
      return;
    }
    refs.island.classList.toggle("expanded");
    refs.island.classList.toggle("collapsed");
  });

  refs.manualCapture.addEventListener("click", () => captureClipboardNow(true));
  refs.autoSaveToggle.addEventListener("change", (event) => {
    autoSaveEnabled = event.target.checked;
    writeToStorage(AUTO_SAVE_KEY, autoSaveEnabled);
    setPolling(autoSaveEnabled);
  });

  refs.clearHistory.addEventListener("click", () => {
    history = [];
    activeIndex = 0;
    writeToStorage(STORAGE_KEY, history);
    render();
  });

  refs.prevClip.addEventListener("click", (event) => {
    event.stopPropagation();
    moveActive(1);
  });
  refs.nextClip.addEventListener("click", (event) => {
    event.stopPropagation();
    moveActive(-1);
  });

  refs.island.addEventListener("touchstart", (event) => {
    touchStartX = event.changedTouches[0].screenX;
  });
  refs.island.addEventListener("touchend", (event) => {
    if (touchStartX === null || !history.length) return;
    const delta = event.changedTouches[0].screenX - touchStartX;
    if (Math.abs(delta) > 35) {
      moveActive(delta > 0 ? 1 : -1);
    }
    touchStartX = null;
  });
}

async function captureClipboardNow(notifyOnError = false) {
  try {
    if (!navigator.clipboard || !navigator.clipboard.readText) {
      if (notifyOnError) showNotice("Clipboard API unavailable");
      return;
    }
    const raw = await navigator.clipboard.readText();
    const value = raw.trim();
    if (!value || value === lastClipboardRead) return;
    lastClipboardRead = value;
    addClip(value);
  } catch (error) {
    if (notifyOnError) {
      showNotice("Clipboard permission needed");
    }
  }
}

function addClip(value, source = "clipboard") {
  if (history.some((clip) => clip.value === value)) {
    const existing = history.find((clip) => clip.value === value);
    existing.timestamp = Date.now();
    history = [existing, ...history.filter((clip) => clip.value !== value)];
  } else {
    const detected = detectType(value);
    history.unshift({
      id: crypto.randomUUID(),
      value,
      type: detected.type,
      icon: detected.icon,
      favorite: false,
      source,
      timestamp: Date.now(),
    });
  }

  history = history.slice(0, MAX_HISTORY);
  activeIndex = 0;
  writeToStorage(STORAGE_KEY, history);
  render(true);
}

function moveActive(direction) {
  if (!history.length) return;
  activeIndex = (activeIndex + direction + history.length) % history.length;
  render(false);
}

function detectType(value) {
  const otpRegex = /\b\d{4,8}\b/;
  const phoneRegex = /(?:\+?\d{1,3}[ -]?)?(?:\(?\d{3}\)?[ -]?)?\d{3}[ -]?\d{4}\b/;
  const urlRegex = /^(https?:\/\/|www\.)\S+$/i;

  if (urlRegex.test(value)) return { type: "url", icon: "🔗" };
  if (otpRegex.test(value)) return { type: "otp", icon: "🔐" };
  if (phoneRegex.test(value)) return { type: "phone", icon: "📞" };
  return { type: "text", icon: "📝" };
}

function render(animate = false) {
  refs.clipCount.textContent = String(history.length);
  const latest = history[0];

  if (latest) {
    refs.clipIcon.textContent = latest.icon;
    refs.latestPreview.textContent = `${emojiByType[latest.type] || "📋 Saved"} - ${truncate(latest.value, 28)}`;
  } else {
    refs.clipIcon.textContent = "📋";
    refs.latestPreview.textContent = "Nothing saved yet";
  }

  if (activeIndex >= history.length) activeIndex = 0;
  refs.activeCard.innerHTML = renderActiveCard(history[activeIndex]);
  refs.clipList.innerHTML = history.slice(0, 8).map(renderListRow).join("");

  refs.clipList.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", onRowAction);
  });
  refs.activeCard.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", onRowAction);
  });

  renderCapsules();
  renderKeyboardTab();

  if (animate && latest) {
    pulseIsland();
    showNotice(emojiByType[latest.type] || "Clip Saved");
  }
}

function renderActiveCard(clip) {
  if (!clip) {
    return `<p class="clip-text">Copy anything to start building your clipboard stack.</p>`;
  }
  return `
    <div class="clip-top">
      <span class="type-pill">${clip.icon} ${clip.type.toUpperCase()}</span>
      <small>${new Date(clip.timestamp).toLocaleTimeString()}</small>
    </div>
    <p class="clip-text">${escapeHtml(clip.value)}</p>
    <div class="clip-actions">
      ${buildPrimaryAction(clip)}
      <button class="clip-action" data-action="paste" data-id="${clip.id}">Paste</button>
      <button class="clip-action" data-action="fav" data-id="${clip.id}">
        ${clip.favorite ? "Unpin" : "Pin"}
      </button>
    </div>
  `;
}

function renderListRow(clip, index) {
  return `
    <li>
      <span>${clip.icon} ${truncate(clip.value, 38)}</span>
      <div>
        <button class="mini-btn" data-action="focus" data-index="${index}" data-id="${clip.id}">Go</button>
      </div>
    </li>
  `;
}

function buildPrimaryAction(clip) {
  if (clip.type === "url") {
    return `<button class="clip-action" data-action="open" data-id="${clip.id}">Open Link</button>`;
  }
  if (clip.type === "phone") {
    return `<button class="clip-action" data-action="call" data-id="${clip.id}">Call</button>`;
  }
  if (clip.type === "otp") {
    return `<button class="clip-action" data-action="autofill" data-id="${clip.id}">Autofill</button>`;
  }
  return `<button class="clip-action" data-action="copy" data-id="${clip.id}">Copy</button>`;
}

async function onRowAction(event) {
  event.stopPropagation();
  const { action, id, index } = event.target.dataset;
  const clip = history.find((item) => item.id === id);
  if (!clip && action !== "focus") return;

  if (action === "focus") {
    activeIndex = Number(index);
    render(false);
    return;
  }
  if (action === "open") {
    window.open(clip.value.startsWith("http") ? clip.value : `https://${clip.value}`, "_blank");
    return;
  }
  if (action === "call") {
    window.open(`tel:${clip.value.replace(/[^\d+]/g, "")}`);
    return;
  }
  if (action === "fav") {
    clip.favorite = !clip.favorite;
    writeToStorage(STORAGE_KEY, history);
    render(false);
    return;
  }
  if (action === "autofill" || action === "paste" || action === "copy") {
    await writeClipboard(clip.value);
    showNotice(action === "autofill" ? "OTP ready to paste" : "Clip copied");
  }
}

function renderCapsules() {
  refs.capsuleGrid.innerHTML = capsules
    .map(
      (capsule) => `
      <button class="capsule-btn" data-capsule="${capsule.id}">
        <strong>${escapeHtml(capsule.name)}</strong>
        <small>${capsule.items.length} clips</small>
      </button>
    `,
    )
    .join("");

  refs.capsuleGrid.querySelectorAll("[data-capsule]").forEach((btn) => {
    btn.addEventListener("click", async (event) => {
      event.stopPropagation();
      const capsule = capsules.find((item) => item.id === event.currentTarget.dataset.capsule);
      if (!capsule) return;
      const merged = capsule.items.join("\n");
      await writeClipboard(merged);
      addClip(merged, "capsule");
      showNotice(`Capsule "${capsule.name}" ready`);
    });
  });
}

function renderKeyboardTab() {
  const keys = [...history.filter((clip) => clip.favorite), ...history.filter((clip) => !clip.favorite)].slice(0, 8);
  refs.keyboardKeys.innerHTML = keys
    .map(
      (clip) => `
      <button class="key-btn" data-key="${clip.id}">
        <strong>${clip.icon} ${clip.type.toUpperCase()}</strong>
        <small>${escapeHtml(truncate(clip.value, 34))}</small>
      </button>
    `,
    )
    .join("");

  refs.keyboardKeys.querySelectorAll("[data-key]").forEach((btn) => {
    btn.addEventListener("click", async (event) => {
      event.stopPropagation();
      const clip = history.find((item) => item.id === event.currentTarget.dataset.key);
      if (!clip) return;
      await writeClipboard(clip.value);
      showNotice("Pasted from keyboard tab");
    });
  });
}

function setPolling(enabled) {
  if (pollHandle) clearInterval(pollHandle);
  if (!enabled) return;
  pollHandle = setInterval(() => captureClipboardNow(false), POLL_MS);
}

function pulseIsland() {
  refs.island.classList.remove("pulse");
  requestAnimationFrame(() => refs.island.classList.add("pulse"));
}

function showNotice(text) {
  refs.slideNotice.textContent = text;
  refs.slideNotice.classList.remove("hidden", "show");
  requestAnimationFrame(() => refs.slideNotice.classList.add("show"));
  setTimeout(() => refs.slideNotice.classList.add("hidden"), 1600);
}

async function writeClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    showNotice("Clipboard write blocked");
  }
}

function truncate(value, max) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readFromStorage(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (error) {
    return fallback;
  }
}

function writeToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function defaultCapsules() {
  return [
    {
      id: "personal",
      name: "Personal Info Pack",
      items: ["Alex Johnson", "+1 415 555 0178", "alex@clipisland.app"],
    },
    {
      id: "coding",
      name: "Coding Snippets",
      items: [
        "git checkout -b feature/clip-island",
        "npm run lint && npm run test",
        "const isURL = /^(https?:\\/\\/|www\\.)\\S+$/i;",
      ],
    },
    {
      id: "study",
      name: "Study Notes",
      items: ["Spaced repetition beats cramming.", "Focus blocks: 50/10.", "Summarize before memorizing."],
    },
  ];
}
