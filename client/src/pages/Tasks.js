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
      <div className="page-console">
        <p className="page-kicker">Task Engine</p>
        <h1 className="page-title">
          Build <span className="accent-cyan">Your Queue</span>
        </h1>
        <p className="page-copy">
          Convert risk countermeasures into execution. Add your own tasks below, then mark them complete inside the
          feed to keep your queue and completion percentage live.
        </p>

        <div
          className="mini-grid"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginTop: "18px" }}
        >
          {taskFeed.map((item) => (
            <section className="neon-card" key={item.label}>
              <p className="page-kicker">{item.label}</p>
              <h3 className={item.tone} style={{ margin: 0, fontSize: "2rem" }}>
                {item.value}
              </h3>
            </section>
          ))}
        </div>

        <div className="mini-grid" style={{ gridTemplateColumns: "1.2fr 0.8fr", marginTop: "18px" }}>
          <section className="neon-card">
            <h3 className="neon-card-title">Task Generator Feed</h3>
            <div className="scan-list">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="scan-list-item"
                  style={{
                    alignItems: "center",
                    opacity: task.completed ? 0.65 : 1,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggleTask(task.id)}
                    style={{
                      flex: 1,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "16px",
                      border: 0,
                      background: "transparent",
                      color: "inherit",
                      textAlign: "left",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    <span style={{ textDecoration: task.completed ? "line-through" : "none" }}>
                      {task.title}
                    </span>
                    <strong className={task.completed ? "status-good" : "status-cyan"}>
                      {task.completed ? "DONE" : "READY"}
                    </strong>
                  </button>

                  <button
                    type="button"
                    onClick={() => removeTask(task.id)}
                    aria-label={`Delete ${task.title}`}
                    style={{
                      marginLeft: "12px",
                      border: "1px solid rgba(255, 0, 255, 0.28)",
                      background: "rgba(255, 0, 255, 0.08)",
                      color: "var(--pink)",
                      minWidth: "36px",
                      height: "36px",
                      cursor: "pointer",
                      fontFamily: "Orbitron, sans-serif",
                    }}
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="neon-card">
            <h3 className="neon-card-title">Write Task</h3>
            <p className="page-copy">
              Enter a task here and add it to your feed. Click any task in the feed to mark it complete or reopen it.
            </p>

            <textarea
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              placeholder="Write your next task here..."
              style={{
                width: "100%",
                minHeight: "140px",
                marginTop: "12px",
                padding: "14px",
                border: "1px solid rgba(255, 0, 255, 0.24)",
                background:
                  "linear-gradient(180deg, rgba(10, 4, 20, 0.96), rgba(2, 2, 8, 0.98))",
                color: "var(--text-main)",
                resize: "vertical",
                outline: "none",
              }}
            />

            <button
              type="button"
              onClick={addTask}
              className="terminal-pill"
              style={{ marginTop: "14px", cursor: "pointer" }}
            >
              ADD TASK
            </button>

            <div style={{ marginTop: "16px" }} className="progress-meter">
              <span style={{ width: `${completionRate}%` }} />
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}

export default Tasks;
