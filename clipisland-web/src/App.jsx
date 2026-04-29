import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "clipIsland.history.v2";
const AUTO_SAVE_KEY = "clipIsland.autoSave.v2";
const MAX_HISTORY = 50;
const POLL_MS = 3000;

const DEFAULT_CAPSULES = [
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

const typeMeta = {
  otp: { icon: "🔐", label: "OTP Saved" },
  url: { icon: "🔗", label: "Link Saved" },
  phone: { icon: "📞", label: "Number Saved" },
  text: { icon: "📝", label: "Note Saved" },
};

function App() {
  const [history, setHistory] = useState(() => readStorage(STORAGE_KEY, []));
  const [activeIndex, setActiveIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [autoSave, setAutoSave] = useState(() => readStorage(AUTO_SAVE_KEY, true));
  const [notice, setNotice] = useState("");
  const [pulse, setPulse] = useState(false);
  const [lastClipboard, setLastClipboard] = useState("");
  const [touchStartX, setTouchStartX] = useState(null);

  useEffect(() => {
    writeStorage(STORAGE_KEY, history);
  }, [history]);

  useEffect(() => {
    writeStorage(AUTO_SAVE_KEY, autoSave);
  }, [autoSave]);

  const activeClip = history[activeIndex];
  const latest = history[0];

  const keyboardClips = useMemo(() => {
    const favorites = history.filter((clip) => clip.favorite);
    const rest = history.filter((clip) => !clip.favorite);
    return [...favorites, ...rest].slice(0, 8);
  }, [history]);

  const flashNotice = useCallback((msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(""), 1600);
  }, []);

  const addClip = useCallback((value, source) => {
    const detected = detectType(value);
    setHistory((prev) => {
      const existing = prev.find((clip) => clip.value === value);
      const next = existing
        ? [{ ...existing, timestamp: Date.now() }, ...prev.filter((clip) => clip.value !== value)]
        : [
            {
              id: crypto.randomUUID(),
              value,
              type: detected.type,
              icon: detected.icon,
              source,
              favorite: false,
              timestamp: Date.now(),
            },
            ...prev,
          ];
      return next.slice(0, MAX_HISTORY);
    });
    setActiveIndex(0);
    flashNotice(typeMeta[detected.type]?.label ?? "Clip Saved");
    setPulse(true);
    setTimeout(() => setPulse(false), 700);
  }, [flashNotice]);

  const captureClipboard = useCallback(async (notifyOnError = false) => {
    try {
      if (!navigator.clipboard?.readText) {
        if (notifyOnError) flashNotice("Clipboard API unavailable");
        return;
      }
      const text = (await navigator.clipboard.readText()).trim();
      if (!text || text === lastClipboard) return;
      setLastClipboard(text);
      addClip(text, "clipboard");
    } catch {
      if (notifyOnError) flashNotice("Clipboard permission needed");
    }
  }, [addClip, flashNotice, lastClipboard]);

  useEffect(() => {
    if (!autoSave) return undefined;
    const timer = setInterval(() => {
      captureClipboard();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [autoSave, captureClipboard]);

  const moveClip = (delta) => {
    if (!history.length) return;
    setActiveIndex((prev) => (prev + delta + history.length) % history.length);
  };

  const clearHistory = () => {
    setHistory([]);
    setActiveIndex(0);
  };

  const toggleFavorite = (id) => {
    setHistory((prev) =>
      prev.map((clip) => (clip.id === id ? { ...clip, favorite: !clip.favorite } : clip)),
    );
  };

  const runPrimaryAction = async (clip, action) => {
    if (action === "open") {
      window.open(clip.value.startsWith("http") ? clip.value : `https://${clip.value}`, "_blank");
      return;
    }
    if (action === "call") {
      window.open(`tel:${clip.value.replace(/[^\d+]/g, "")}`);
      return;
    }
    await writeClipboard(clip.value);
    flashNotice(action === "autofill" ? "OTP ready to paste" : "Clip copied");
  };

  const onTouchStart = (event) => {
    setTouchStartX(event.changedTouches[0].screenX);
  };

  const onTouchEnd = (event) => {
    if (touchStartX === null || !history.length) return;
    const delta = event.changedTouches[0].screenX - touchStartX;
    if (Math.abs(delta) > 35) moveClip(delta > 0 ? 1 : -1);
    setTouchStartX(null);
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <p className="kicker">Clipboard Intelligence</p>
        <h1>ClipIsland</h1>
        <p className="subtitle">
          Dynamic Island powered clipboard memory for links, OTPs, calls, and rapid paste workflows.
        </p>
      </header>

      <section className="island-stage">
        {notice ? <div className="slide-notice">{notice}</div> : null}
        <button
          className={`dynamic-island ${isExpanded ? "expanded" : "collapsed"} ${pulse ? "pulse" : ""}`}
          onClick={(event) => {
            if (event.target.closest("button") !== event.currentTarget) return;
            setIsExpanded((prev) => !prev);
          }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="island-collapsed">
            <div className="left-cluster">
              <span className="chip-icon">{latest?.icon ?? "📋"}</span>
              <div className="counter-pill">{history.length}</div>
            </div>
            <span className="latest-preview">
              {latest ? `${typeMeta[latest.type]?.label ?? "Saved"} - ${truncate(latest.value, 28)}` : "Nothing saved yet"}
            </span>
          </div>

          <div className="island-expanded">
            <div className="expanded-top">
              <h2>Clipboard Stack</h2>
              <div className="swipe-controls">
                <button className="mini-btn" onClick={(e) => { e.stopPropagation(); moveClip(1); }}>◀</button>
                <button className="mini-btn" onClick={(e) => { e.stopPropagation(); moveClip(-1); }}>▶</button>
              </div>
            </div>

            <article className="clip-card">
              {activeClip ? (
                <>
                  <div className="clip-top">
                    <span className="type-pill">{activeClip.icon} {activeClip.type.toUpperCase()}</span>
                    <small>{new Date(activeClip.timestamp).toLocaleTimeString()}</small>
                  </div>
                  <p className="clip-text">{activeClip.value}</p>
                  <div className="clip-actions">
                    {activeClip.type === "url" ? (
                      <button className="clip-action" onClick={(e) => { e.stopPropagation(); runPrimaryAction(activeClip, "open"); }}>
                        Open Link
                      </button>
                    ) : null}
                    {activeClip.type === "phone" ? (
                      <button className="clip-action" onClick={(e) => { e.stopPropagation(); runPrimaryAction(activeClip, "call"); }}>
                        Call
                      </button>
                    ) : null}
                    {activeClip.type === "otp" ? (
                      <button className="clip-action" onClick={(e) => { e.stopPropagation(); runPrimaryAction(activeClip, "autofill"); }}>
                        Autofill
                      </button>
                    ) : null}
                    {activeClip.type === "text" ? (
                      <button className="clip-action" onClick={(e) => { e.stopPropagation(); runPrimaryAction(activeClip, "copy"); }}>
                        Copy
                      </button>
                    ) : null}
                    <button className="clip-action" onClick={(e) => { e.stopPropagation(); runPrimaryAction(activeClip, "paste"); }}>
                      Paste
                    </button>
                    <button className="clip-action" onClick={(e) => { e.stopPropagation(); toggleFavorite(activeClip.id); }}>
                      {activeClip.favorite ? "Unpin" : "Pin"}
                    </button>
                  </div>
                </>
              ) : (
                <p className="clip-text">Copy anything to start building your clipboard stack.</p>
              )}
            </article>

            <div className="stack-head">
              <h3>Recent Clips</h3>
              <button className="ghost-btn" onClick={(e) => { e.stopPropagation(); clearHistory(); }}>Clear</button>
            </div>
            <ul className="clip-list">
              {history.slice(0, 8).map((clip, idx) => (
                <li key={clip.id}>
                  <span>{clip.icon} {truncate(clip.value, 38)}</span>
                  <button className="mini-btn" onClick={(e) => { e.stopPropagation(); setActiveIndex(idx); }}>Go</button>
                </li>
              ))}
            </ul>
          </div>
        </button>
      </section>

      <section className="controls">
        <div className="toggle-row">
          <label className="switch">
            <input type="checkbox" checked={autoSave} onChange={(e) => setAutoSave(e.target.checked)} />
            <span className="slider"></span>
          </label>
          <div>
            <p className="label">Enable Auto Save Clipboard</p>
            <small>Polls clipboard every 3 seconds</small>
          </div>
        </div>
        <button className="action-btn" onClick={() => captureClipboard(true)}>Capture Clipboard Now</button>
      </section>

      <section className="capsules">
        <div className="section-head">
          <h3>Copy Capsules</h3>
          <p>Reusable bundles for one-tap productivity</p>
        </div>
        <div className="capsule-grid">
          {DEFAULT_CAPSULES.map((capsule) => (
            <button
              key={capsule.id}
              className="capsule-btn"
              onClick={async () => {
                const payload = capsule.items.join("\n");
                await writeClipboard(payload);
                addClip(payload, "capsule");
                flashNotice(`Capsule "${capsule.name}" ready`);
              }}
            >
              <strong>{capsule.name}</strong>
              <small>{capsule.items.length} clips</small>
            </button>
          ))}
        </div>
      </section>

      <section className="keyboard-tab">
        <div className="section-head">
          <h3>Smart Keyboard Tab</h3>
          <p>Tap to paste instantly from saved clips</p>
        </div>
        <div className="key-grid">
          {keyboardClips.map((clip) => (
            <button
              key={clip.id}
              className="key-btn"
              onClick={async () => {
                await writeClipboard(clip.value);
                flashNotice("Pasted from keyboard tab");
              }}
            >
              <strong>{clip.icon} {clip.type.toUpperCase()}</strong>
              <small>{truncate(clip.value, 34)}</small>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
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

function truncate(value, max) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function readStorage(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

async function writeClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Clipboard write may fail on insecure contexts.
  }
}

export default App;
