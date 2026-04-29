import { useEffect, useMemo, useState } from "react";
import Layout from "../components/layout";

const TASKS_STORAGE_KEY = "prometheus_tasks";
const PROGRESS_STORAGE_KEY = "prometheus_progress";

const starterTasks = [
  { id: 1, title: "Translate copied countermeasures into 5 concrete weekly actions.", completed: false, rewarded: false },
  { id: 2, title: "Generate one portfolio task from your highest-risk career gap.", completed: false, rewarded: false },
  { id: 3, title: "Break your next upskilling sprint into 30-minute focus units.", completed: true, rewarded: true },
  { id: 4, title: "Create one measurable output for the task currently in progress.", completed: false, rewarded: false },
];

const createDefaultProgress = () => ({
  totalXp: 10,
  totalCompleted: 1,
  dailyHistory: {
    [new Date().toISOString().slice(0, 10)]: 1,
  },
});

const readStoredTasks = () => {
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : starterTasks;
  } catch {
    return starterTasks;
  }
};

const readStoredProgress = () => {
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : createDefaultProgress();
  } catch {
    return createDefaultProgress();
  }
};

function Tasks() {
  const [taskInput, setTaskInput] = useState("");
  const [tasks, setTasks] = useState(readStoredTasks);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const taskFeed = useMemo(
    () => [
      { label: "AI TASK QUEUE", value: `${String(totalTasks).padStart(2, "0")} TOTAL`, tone: "status-cyan" },
      { label: "PENDING TASKS", value: `${String(pendingTasks).padStart(2, "0")} OPEN`, tone: "status-alert" },
      { label: "COMPLETION RATE", value: `${completionRate}%`, tone: "status-good" },
    ],
    [completionRate, pendingTasks, totalTasks]
  );

  useEffect(() => {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    const cleaned = taskInput.trim();

    if (!cleaned) {
      alert("Enter a task first.");
      return;
    }

    setTasks((current) => [
      {
        id: Date.now(),
        title: cleaned,
        completed: false,
        rewarded: false,
      },
      ...current,
    ]);
    setTaskInput("");
  };

  const toggleTask = (id) => {
    setTasks((current) =>
      current.map((task) => {
        if (task.id !== id) {
          return task;
        }

        const nextCompleted = !task.completed;

        if (nextCompleted && !task.rewarded) {
          const today = new Date().toISOString().slice(0, 10);
          const progress = readStoredProgress();
          const updatedProgress = {
            totalXp: (progress.totalXp || 0) + 10,
            totalCompleted: (progress.totalCompleted || 0) + 1,
            dailyHistory: {
              ...(progress.dailyHistory || {}),
              [today]: ((progress.dailyHistory || {})[today] || 0) + 1,
            },
          };

          localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(updatedProgress));
          window.dispatchEvent(new Event("prometheus_progress_update"));

          return {
            ...task,
            completed: true,
            rewarded: true,
          };
        }

        return {
          ...task,
          completed: nextCompleted,
        };
      })
    );
  };

  const removeTask = (id) => {
    setTasks((current) => current.filter((task) => task.id !== id));
  };

  return (
    <Layout>
      <div className="page-console" style={{ padding: 0, border: "none", background: "transparent", boxShadow: "none" }}>
        
        {/* Top Stats Row */}
        <div className="mini-grid tasks-feed-grid" style={{ marginBottom: "24px" }}>
          <section className="neon-card" style={{ padding: "16px", borderColor: "rgba(0, 255, 255, 0.2)" }}>
            <p className="page-kicker" style={{ color: "var(--cyan)", fontSize: "0.7rem" }}>TOTAL_DIRECTIVES</p>
            <h3 className="pixel-font" style={{ margin: 0, fontSize: "2.8rem", color: "var(--text-main)" }}>
              {String(totalTasks).padStart(2, "0")}
            </h3>
            <div style={{ position: "absolute", bottom: "16px", right: "16px", color: "var(--cyan)", opacity: 0.5 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            </div>
          </section>
          
          <section className="neon-card" style={{ padding: "16px", borderColor: "rgba(255, 0, 255, 0.2)" }}>
            <p className="page-kicker" style={{ color: "var(--pink)", fontSize: "0.7rem" }}>PENDING_ACTIONS</p>
            <h3 className="pixel-font" style={{ margin: 0, fontSize: "2.8rem", color: "var(--text-main)" }}>
              {String(pendingTasks).padStart(2, "0")}
            </h3>
            <div style={{ position: "absolute", bottom: "16px", right: "16px", color: "var(--pink)", opacity: 0.5 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"/></svg>
            </div>
          </section>

          <section className="neon-card" style={{ padding: "16px", borderColor: "rgba(0, 255, 0, 0.2)" }}>
            <p className="page-kicker" style={{ color: "var(--lime)", fontSize: "0.7rem" }}>SYNC_COMPLETION</p>
            <h3 className="pixel-font" style={{ margin: 0, fontSize: "2.8rem", color: "var(--text-main)" }}>
              {completionRate}%
            </h3>
            <div style={{ position: "absolute", bottom: "16px", right: "16px", color: "var(--lime)", opacity: 0.5 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            </div>
          </section>
        </div>

        <div className="mini-grid tasks-split-grid">
          {/* ACTIVE QUEUE */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "16px", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
              <h3 className="neon-card-title" style={{ margin: 0, color: "var(--cyan)" }}>ACTIVE_QUEUE</h3>
              <span style={{ fontSize: "0.6rem", color: "var(--text-dim)", letterSpacing: "0.1em" }}>SCROLL_TO_EXPLORE</span>
            </div>
            
            <div className="scan-list" style={{ maxHeight: "600px", overflowY: "auto", paddingRight: "8px" }}>
              {tasks.map((task, idx) => (
                <div
                  key={task.id}
                  className="neon-card"
                  style={{
                    padding: "16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "16px",
                    borderLeft: `3px solid ${task.completed ? 'var(--lime)' : 'var(--cyan)'}`,
                    opacity: task.completed ? 0.5 : 1,
                    transition: "opacity 0.2s"
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <span style={{ display: "block", fontSize: "0.65rem", color: "var(--cyan)", letterSpacing: "0.1em", marginBottom: "4px" }}>UID: P0{idx + 1}-X</span>
                    <strong style={{ display: "block", fontSize: "1.1rem", textDecoration: task.completed ? "line-through" : "none", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {task.title}
                    </strong>
                    <span style={{ display: "block", fontSize: "0.8rem", color: "var(--text-dim)", marginTop: "4px" }}>Execute subroutine and maintain sync alignment.</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <button
                      onClick={() => toggleTask(task.id)}
                      style={{ width: "36px", height: "36px", background: "rgba(0, 255, 0, 0.05)", border: "1px solid rgba(0, 255, 0, 0.2)", color: "var(--lime)", cursor: "pointer", display: "grid", placeItems: "center" }}
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => removeTask(task.id)}
                      style={{ width: "36px", height: "36px", background: "rgba(255, 0, 255, 0.05)", border: "1px solid rgba(255, 0, 255, 0.2)", color: "var(--pink)", cursor: "pointer", display: "grid", placeItems: "center" }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DIRECT COMMAND ENTRY */}
          <div>
            <div style={{ marginBottom: "16px", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
              <h3 className="neon-card-title" style={{ margin: 0, color: "var(--pink)" }}>DIRECT_COMMAND_ENTRY</h3>
            </div>

            <div className="neon-card" style={{ padding: "24px" }}>
              <label style={{ display: "block", fontSize: "0.7rem", color: "var(--pink)", letterSpacing: "0.1em", marginBottom: "8px", textTransform: "uppercase" }}>DIRECTIVE_TITLE</label>
              <input
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                placeholder="ENTER_TASK_HEADING"
                style={{ width: "100%", padding: "12px", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-main)", fontFamily: "inherit", marginBottom: "20px" }}
              />

              <label style={{ display: "block", fontSize: "0.7rem", color: "var(--pink)", letterSpacing: "0.1em", marginBottom: "8px", textTransform: "uppercase" }}>SUBROUTINE_PARAMETERS</label>
              <textarea
                placeholder="SPECIFY_TASK_DESCRIPTION_AND_GOALS"
                style={{ width: "100%", height: "100px", padding: "12px", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-main)", fontFamily: "inherit", resize: "none", marginBottom: "20px" }}
              />

              <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
                <div style={{ flex: 1, background: "rgba(0, 255, 255, 0.05)", border: "1px solid rgba(0, 255, 255, 0.1)", padding: "12px", textAlign: "center" }}>
                  <span style={{ display: "block", fontSize: "0.6rem", color: "var(--text-dim)", letterSpacing: "0.1em" }}>XP_REWARD</span>
                  <strong style={{ color: "var(--cyan)", fontSize: "1.1rem" }}>+10 CREDITS</strong>
                </div>
                <div style={{ flex: 1, background: "rgba(255, 0, 255, 0.05)", border: "1px solid rgba(255, 0, 255, 0.1)", padding: "12px", textAlign: "center" }}>
                  <span style={{ display: "block", fontSize: "0.6rem", color: "var(--text-dim)", letterSpacing: "0.1em" }}>RISK_FACTOR</span>
                  <strong style={{ color: "var(--pink)", fontSize: "1.1rem" }}>LOW_LATENCY</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={addTask}
                style={{ width: "100%", padding: "16px", background: "var(--pink)", border: "none", color: "black", fontSize: "1.1rem", fontWeight: "bold", letterSpacing: "0.1em", cursor: "pointer", clipPath: "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)" }}
              >
                INITIALIZE_TASK
              </button>
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}

export default Tasks;
