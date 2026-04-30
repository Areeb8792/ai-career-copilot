import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import Layout from "../components/layout";
import API_BASE_URL from "../config/api";

const TASKS_KEY    = "prometheus_tasks";
const PROGRESS_KEY = "prometheus_progress";

const starterTasks = [
  { id: 1, title: "Translate copied countermeasures into 5 concrete weekly actions.", completed: false, rewarded: false },
  { id: 2, title: "Generate one portfolio task from your highest-risk career gap.", completed: false, rewarded: false },
  { id: 3, title: "Break your next upskilling sprint into 30-minute focus units.", completed: true,  rewarded: true  },
  { id: 4, title: "Create one measurable output for the task currently in progress.", completed: false, rewarded: false },
];

const defaultProgress = () => ({
  totalXp: 10,
  totalCompleted: 1,
  dailyHistory: { [new Date().toISOString().slice(0, 10)]: 1 },
});

/* ── helpers ─────────────────────────────────────────────────── */
const readLocal = (key, fallback) => {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; }
  catch { return fallback; }
};

const writeLocal = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
};

const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") || "" : "");

/* ── sync to server (fire-and-forget, won't crash the UI) ─────── */
const syncToServer = async (tasks, progress) => {
  const token = getToken();
  if (!token) return;
  try {
    await axios.patch(
      `${API_BASE_URL}/api/progress`,
      { tasks, progress },
      { headers: { authorization: token }, timeout: 5000 }
    );
  } catch {/* silent — localStorage still holds truth */}
};

/* ═══════════════════════════════════════════════════════════════ */
function Tasks() {
  const [tasks,      setTasks]      = useState(() => readLocal(TASKS_KEY, starterTasks));
  const [progress,   setProgress]   = useState(() => readLocal(PROGRESS_KEY, defaultProgress()));
  const [taskInput,  setTaskInput]  = useState("");
  const [syncStatus, setSyncStatus] = useState("idle"); // idle | syncing | synced | error
  const [loaded,     setLoaded]     = useState(false);

  const syncTimer = useRef(null);

  /* ── load from server on mount ──────────────────────────────── */
  useEffect(() => {
    const token = getToken();
    if (!token) { setLoaded(true); return; }

    axios
      .get(`${API_BASE_URL}/api/progress`, {
        headers: { authorization: token },
        timeout: 6000,
      })
      .then(({ data }) => {
        if (Array.isArray(data.tasks) && data.tasks.length > 0) {
          setTasks(data.tasks);
          writeLocal(TASKS_KEY, data.tasks);
        }
        if (data.progress && typeof data.progress.totalXp === "number") {
          setProgress(data.progress);
          writeLocal(PROGRESS_KEY, data.progress);
          window.dispatchEvent(new Event("prometheus_progress_update"));
        }
      })
      .catch(() => {/* fallback to localStorage already set */})
      .finally(() => setLoaded(true));
  }, []);

  /* ── debounced auto-save whenever tasks or progress change ─── */
  const scheduleSave = useCallback((nextTasks, nextProgress) => {
    clearTimeout(syncTimer.current);
    setSyncStatus("syncing");
    syncTimer.current = setTimeout(async () => {
      await syncToServer(nextTasks, nextProgress);
      setSyncStatus("synced");
      setTimeout(() => setSyncStatus("idle"), 2000);
    }, 800);
  }, []);

  /* ── persist to localStorage + schedule server sync ─────────── */
  const commitTasks = useCallback((nextTasks, nextProgress) => {
    setTasks(nextTasks);
    writeLocal(TASKS_KEY, nextTasks);
    if (nextProgress) {
      setProgress(nextProgress);
      writeLocal(PROGRESS_KEY, nextProgress);
      window.dispatchEvent(new Event("prometheus_progress_update"));
    }
    scheduleSave(nextTasks, nextProgress ?? progress);
  }, [progress, scheduleSave]);

  /* ── derived stats ──────────────────────────────────────────── */
  const totalTasks      = tasks.length;
  const completedTasks  = tasks.filter(t => t.completed).length;
  const pendingTasks    = totalTasks - completedTasks;
  const completionRate  = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const taskFeed = useMemo(() => [
    { label: "AI TASK QUEUE",    value: `${String(totalTasks).padStart(2,"0")} TOTAL`, tone: "status-cyan"  },
    { label: "PENDING TASKS",    value: `${String(pendingTasks).padStart(2,"0")} OPEN`, tone: "status-alert" },
    { label: "COMPLETION RATE",  value: `${completionRate}%`,                           tone: "status-good"  },
  ], [completionRate, pendingTasks, totalTasks]);

  /* ── actions ────────────────────────────────────────────────── */
  const addTask = () => {
    const cleaned = taskInput.trim();
    if (!cleaned) { alert("Enter a task first."); return; }
    const nextTasks = [{ id: Date.now(), title: cleaned, completed: false, rewarded: false }, ...tasks];
    commitTasks(nextTasks, null);
    setTaskInput("");
  };

  const toggleTask = (id) => {
    let nextProgress = null;
    const nextTasks = tasks.map(task => {
      if (task.id !== id) return task;
      const nextCompleted = !task.completed;
      if (nextCompleted && !task.rewarded) {
        const today = new Date().toISOString().slice(0, 10);
        nextProgress = {
          totalXp:        (progress.totalXp        || 0) + 10,
          totalCompleted: (progress.totalCompleted  || 0) + 1,
          dailyHistory:   { ...(progress.dailyHistory || {}), [today]: ((progress.dailyHistory || {})[today] || 0) + 1 },
        };
        return { ...task, completed: true, rewarded: true };
      }
      return { ...task, completed: nextCompleted };
    });
    commitTasks(nextTasks, nextProgress);
  };

  const removeTask = (id) => {
    const nextTasks = tasks.filter(t => t.id !== id);
    commitTasks(nextTasks, null);
  };

  /* ── sync indicator label ────────────────────────────────────── */
  const syncLabel = {
    idle:    { text: "ALL_CHANGES_SAVED",  color: "rgba(255,255,255,0.15)" },
    syncing: { text: "SYNCING_TO_SERVER…", color: "var(--accent-amber)"   },
    synced:  { text: "SERVER_SYNC_OK ✓",  color: "var(--accent-emerald)"  },
    error:   { text: "SYNC_FAILED (local only)", color: "#ef4444"         },
  }[syncStatus];

  /* ── render ─────────────────────────────────────────────────── */
  return (
    <Layout>
      <div className="page-console" style={{ padding: 0, border: "none", background: "transparent", boxShadow: "none" }}>

        {/* Sync status bar */}
        <div className="font-tech" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.2em", color: syncLabel.color }}>
          {syncStatus === "syncing" && (
            <span style={{ display: "inline-block", width: "6px", height: "6px", background: "var(--accent-amber)", borderRadius: "50%", animation: "pulse 1s infinite" }} />
          )}
          {syncLabel.text}
          {!getToken() && <span style={{ color: "rgba(255,255,255,0.2)", marginLeft: "8px" }}>— LOG_IN_TO_ENABLE_CLOUD_SYNC</span>}
        </div>

        {/* Top Stats Row */}
        <div className="mini-grid tasks-feed-grid" style={{ marginBottom: "24px" }}>
          <section className="card-grad clip-angle glow-box-purple flex-col" style={{ padding: "12px", border: "1px solid rgba(124, 58, 237, 0.4)", display: "flex", justifyContent: "space-between", height: "80px" }}>
            <span className="font-tech" style={{ fontSize: "0.6rem", color: "var(--accent-purple)", textTransform: "uppercase", letterSpacing: "0.15em" }}>Total_Directives</span>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span className="font-led text-white" style={{ fontSize: "2.5rem", lineHeight: 1 }}>{String(totalTasks).padStart(2, "0")}</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(124, 58, 237, 0.4)" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            </div>
          </section>

          <section className="card-grad clip-angle glow-box-amber flex-col" style={{ padding: "12px", border: "1px solid rgba(251, 191, 36, 0.4)", display: "flex", justifyContent: "space-between", height: "80px" }}>
            <span className="font-tech" style={{ fontSize: "0.6rem", color: "var(--accent-amber)", textTransform: "uppercase", letterSpacing: "0.15em" }}>Pending_Actions</span>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span className="font-led text-white" style={{ fontSize: "2.5rem", lineHeight: 1 }}>{String(pendingTasks).padStart(2, "0")}</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(251, 191, 36, 0.4)" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"/></svg>
            </div>
          </section>

          <section className="card-grad clip-angle glow-box-emerald flex-col" style={{ padding: "12px", border: "1px solid rgba(16, 185, 129, 0.4)", display: "flex", justifyContent: "space-between", height: "80px" }}>
            <span className="font-tech" style={{ fontSize: "0.6rem", color: "var(--accent-emerald)", textTransform: "uppercase", letterSpacing: "0.15em" }}>Sync_Completion</span>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span className="font-led text-white" style={{ fontSize: "2.5rem", lineHeight: 1 }}>{completionRate}%</span>
              <svg className="animate-spin-slow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            </div>
          </section>
        </div>

        <div className="mini-grid tasks-split-grid">
          {/* ACTIVE QUEUE */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(124, 58, 237, 0.3)", paddingBottom: "8px", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "0.8rem", fontWeight: 900, color: "var(--accent-purple)", textTransform: "uppercase", letterSpacing: "0.2em" }}>Active_Queue</h3>
              <span className="font-tech" style={{ fontSize: "0.55rem", color: "var(--text-dim)", textTransform: "uppercase" }}>Priority: Critical</span>
            </div>

            {!loaded ? (
              <div className="font-tech" style={{ padding: "24px", textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.2em" }}>
                LOADING_FROM_SERVER…
              </div>
            ) : (
              <div className="scan-list" style={{ maxHeight: "600px", overflowY: "auto", paddingRight: "8px" }}>
                {tasks.map((task, idx) => (
                  <div
                    key={task.id}
                    className="clip-angle group"
                    style={{
                      padding: "12px", display: "flex", justifyContent: "space-between", alignItems: "center",
                      gap: "16px", background: "rgba(30, 41, 59, 0.4)",
                      borderLeft: `2px solid ${task.completed ? "var(--accent-emerald)" : "var(--accent-purple)"}`,
                      opacity: task.completed ? 0.5 : 1,
                      filter: task.completed ? "grayscale(0.6)" : "none",
                      transition: "all 0.3s ease",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1 }}>
                      <span className="font-tech" style={{ fontSize: "0.55rem", color: task.completed ? "var(--accent-emerald)" : "var(--accent-purple)" }}>UID: P0{idx + 1}-X</span>
                      <h4 style={{ margin: 0, fontSize: "0.9rem", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "-0.05em", textDecoration: task.completed ? "line-through" : "none" }}>
                        {task.title}
                      </h4>
                      <p className="font-tech" style={{ margin: 0, fontSize: "0.65rem", color: "var(--text-dim)", lineHeight: 1.2 }}>Execute subroutine and maintain sync alignment.</p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <button onClick={() => toggleTask(task.id)} className="clip-angle" style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.4)", color: "var(--accent-emerald)", cursor: "pointer", transition: "all 0.2s" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                      </button>
                      <button onClick={() => removeTask(task.id)} className="clip-angle" style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(251, 191, 36, 0.1)", border: "1px solid rgba(251, 191, 36, 0.4)", color: "var(--accent-amber)", cursor: "pointer" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DIRECT COMMAND ENTRY */}
          <div className="clip-angle" style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(251, 191, 36, 0.3)", padding: "16px", backdropFilter: "blur(12px)", display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "0.8rem", fontWeight: 900, color: "var(--accent-amber)", textTransform: "uppercase", letterSpacing: "0.2em", borderBottom: "1px solid rgba(251, 191, 36, 0.2)", paddingBottom: "8px" }}>
              DIRECT_COMMAND_ENTRY
            </h3>

            <div>
              <label className="font-tech" style={{ display: "block", fontSize: "0.6rem", color: "var(--accent-amber)", textTransform: "uppercase", marginBottom: "4px" }}>Directive_Title</label>
              <input
                value={taskInput}
                onChange={e => setTaskInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addTask()}
                placeholder="ENTER_TASK_HEADING"
                className="font-tech clip-angle"
                style={{ width: "100%", background: "var(--bg-slate-800)", border: "1px solid rgba(255, 255, 255, 0.1)", padding: "10px", fontSize: "0.8rem", color: "var(--accent-purple)", outline: "none", transition: "all 0.2s", textTransform: "uppercase" }}
              />
            </div>

            <div>
              <label className="font-tech" style={{ display: "block", fontSize: "0.6rem", color: "var(--accent-amber)", textTransform: "uppercase", marginBottom: "4px" }}>Subroutine_Parameters</label>
              <textarea
                placeholder="SPECIFY_OBJECTIVES"
                className="font-tech clip-angle"
                style={{ width: "100%", height: "80px", background: "var(--bg-slate-800)", border: "1px solid rgba(255, 255, 255, 0.1)", padding: "10px", fontSize: "0.8rem", color: "var(--text-dim)", outline: "none", resize: "none", transition: "all 0.2s" }}
              />
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <div className="clip-angle" style={{ flex: 1, padding: "8px", background: "rgba(124, 58, 237, 0.05)", border: "1px solid rgba(124, 58, 237, 0.2)", textAlign: "center" }}>
                <span className="font-tech" style={{ display: "block", fontSize: "0.55rem", color: "var(--text-dim)", textTransform: "uppercase" }}>REWARD</span>
                <span className="font-led" style={{ fontSize: "0.9rem", color: "var(--accent-purple)" }}>+10 XP</span>
              </div>
              <div className="clip-angle" style={{ flex: 1, padding: "8px", background: "rgba(251, 191, 36, 0.05)", border: "1px solid rgba(251, 191, 36, 0.2)", textAlign: "center" }}>
                <span className="font-tech" style={{ display: "block", fontSize: "0.55rem", color: "var(--text-dim)", textTransform: "uppercase" }}>RISK</span>
                <span className="font-led" style={{ fontSize: "0.9rem", color: "var(--accent-amber)" }}>LOW</span>
              </div>
            </div>

            {/* Cloud sync indicator */}
            <div className="font-tech" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.5rem", textTransform: "uppercase", letterSpacing: "0.15em", color: syncLabel.color, padding: "6px 8px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>
              {syncLabel.text}
            </div>

            <button
              onClick={addTask}
              className="clip-angle"
              style={{ width: "100%", padding: "14px", background: "var(--accent-amber)", color: "#0f172a", fontSize: "0.8rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", cursor: "pointer", border: "none", boxShadow: "0 0 12px rgba(251, 191, 36, 0.25)", transition: "all 0.2s" }}
            >
              INITIALIZE_TASK
            </button>
          </div>
        </div>

      </div>
    </Layout>
  );
}

export default Tasks;
