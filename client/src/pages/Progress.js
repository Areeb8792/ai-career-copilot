import { useMemo } from "react";
import Layout from "../components/layout";

const PROGRESS_STORAGE_KEY = "prometheus_progress";
const SIGNUP_DATE_KEY = "prometheus_signup_date";

const readStoredProgress = () => {
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    return raw
      ? JSON.parse(raw)
      : {
          totalXp: 0,
          totalCompleted: 0,
          dailyHistory: {},
        };
  } catch {
    return {
      totalXp: 0,
      totalCompleted: 0,
      dailyHistory: {},
    };
  }
};

const getStreakCount = (dailyHistory) => {
  let streak = 0;
  const cursor = new Date();

  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if ((dailyHistory[key] || 0) > 0) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

function Progress() {
  const progressData = useMemo(readStoredProgress, []);
  const signupDate = localStorage.getItem(SIGNUP_DATE_KEY) || new Date().toISOString();

  const totalXp = progressData.totalXp || 0;
  const totalCompleted = progressData.totalCompleted || 0;
  const currentLevel = Math.floor(totalXp / 100) + 1;
  const xpIntoLevel = totalXp % 100;
  const streakDays = getStreakCount(progressData.dailyHistory || {});

  const last14Days = useMemo(() => {
    const days = [];
    const today = new Date();

    for (let offset = 13; offset >= 0; offset -= 1) {
      const date = new Date(today);
      date.setDate(today.getDate() - offset);
      const key = date.toISOString().slice(0, 10);
      const count = (progressData.dailyHistory || {})[key] || 0;

      days.push({
        key,
        label: date.toLocaleDateString("en-US", { day: "2-digit", month: "short" }),
        count,
      });
    }

    return days;
  }, [progressData.dailyHistory]);

  const signalCards = [
    { label: "LEVEL", value: `LV ${String(currentLevel).padStart(2, "0")}`, tone: "status-cyan" },
    { label: "TOTAL XP GAINED", value: `${totalXp} XP`, tone: "status-good" },
    { label: "TASKS COMPLETED", value: `${totalCompleted}`, tone: "status-alert" },
    { label: "DAILY TASK STREAK", value: `${streakDays} DAYS`, tone: "status-cyan" },
  ];

  const recentUplink = [
    ["CURRENT LEVEL", `LEVEL ${currentLevel}`],
    ["XP TO NEXT LEVEL", `${100 - xpIntoLevel === 100 ? 0 : 100 - xpIntoLevel} XP`],
    ["ACCOUNT ACTIVE SINCE", new Date(signupDate).toLocaleDateString("en-GB")],
  ];

  return (
    <Layout>
      <div className="page-console">
        <p className="page-kicker">Progress Monitor</p>
        <h1 className="page-title">
          Track <span className="accent-cyan">The Climb</span>
        </h1>
        <p className="page-copy">
          Your progress board now tracks real XP, level growth, completed tasks, and daily streak momentum based on
          what you finish in the task engine.
        </p>

        <div className="mini-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginTop: "18px" }}>
          {signalCards.map((item) => (
            <section className="neon-card" key={item.label}>
              <p className="page-kicker">{item.label}</p>
              <h3 className={item.tone} style={{ margin: 0, fontSize: "2rem" }}>
                {item.value}
              </h3>
            </section>
          ))}
        </div>

        <div className="mini-grid" style={{ gridTemplateColumns: "1.1fr 0.9fr", marginTop: "18px" }}>
          <section className="neon-card">
            <h3 className="neon-card-title">Signal Strength</h3>
            <div className="mini-grid">
              <div>
                <div className="scan-list-item" style={{ marginBottom: "8px" }}>
                  <span>LEVEL PROGRESS</span>
                  <strong className="status-cyan">{xpIntoLevel}/100 XP</strong>
                </div>
                <div className="progress-meter">
                  <span style={{ width: `${xpIntoLevel}%` }} />
                </div>
              </div>

              <div>
                <div className="scan-list-item" style={{ marginBottom: "8px" }}>
                  <span>TASK COMPLETION</span>
                  <strong className="status-good">{totalCompleted} DONE</strong>
                </div>
                <div className="progress-meter">
                  <span style={{ width: `${Math.min(100, totalCompleted * 10)}%` }} />
                </div>
              </div>

              <div>
                <div className="scan-list-item" style={{ marginBottom: "8px" }}>
                  <span>STREAK POWER</span>
                  <strong className="status-alert">{streakDays} DAYS</strong>
                </div>
                <div className="progress-meter">
                  <span style={{ width: `${Math.min(100, streakDays * 12)}%` }} />
                </div>
              </div>
            </div>
          </section>

          <section className="neon-card">
            <h3 className="neon-card-title">Recent Uplink</h3>
            <div className="scan-list">
              {recentUplink.map(([label, value]) => (
                <div className="scan-list-item" key={label}>
                  <span>{label}</span>
                  <strong className="status-cyan">{value}</strong>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mini-grid" style={{ gridTemplateColumns: "1fr", marginTop: "18px" }}>
          <section className="neon-card">
            <h3 className="neon-card-title">Daily Completion Streak</h3>
            <p className="page-copy">
              This graph shows how many tasks you completed each day across the last two weeks. Keep the cells lit to
              maintain your streak.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(14, minmax(0, 1fr))",
                gap: "10px",
                marginTop: "18px",
              }}
            >
              {last14Days.map((day) => {
                const intensity =
                  day.count >= 3 ? "linear-gradient(135deg, var(--lime), var(--cyan))"
                    : day.count === 2 ? "linear-gradient(135deg, var(--pink), var(--cyan))"
                    : day.count === 1 ? "rgba(0, 255, 255, 0.45)"
                    : "rgba(255, 255, 255, 0.05)";

                return (
                  <div key={day.key} style={{ textAlign: "center" }}>
                    <div
                      title={`${day.label}: ${day.count} task(s) completed`}
                      style={{
                        height: "56px",
                        border: "1px solid rgba(255, 0, 255, 0.16)",
                        background: intensity,
                        boxShadow:
                          day.count > 0
                            ? "0 0 12px rgba(0, 255, 255, 0.18), 0 0 12px rgba(255, 0, 255, 0.14)"
                            : "none",
                      }}
                    />
                    <div style={{ marginTop: "8px", color: "var(--text-dim)", fontSize: "0.75rem" }}>
                      {day.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}

export default Progress;
