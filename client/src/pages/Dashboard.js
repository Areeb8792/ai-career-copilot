import { useNavigate } from "react-router-dom";
import Layout from "../components/layout";
import "./theme.css";
import "./dashboard.css";

const featureCards = [
  {
    id: "01",
    title: "Risk_Matrix",
    accent: "pink",
    copy:
      "Advanced neural analysis evaluating your workflow against fast-moving AI capability curves and displacement pressure.",
    link: "INITIATE_CALC",
    icon: "∆",
    path: "/risk-management",
  },
  {
    id: "02",
    title: "Survival_Tasks",
    accent: "cyan",
    copy:
      "Dynamic objective generation that converts risk into weekly tasks, mission checkpoints, and skill-defense routines.",
    link: "VIEW_OBJECTIVES",
    icon: "◫",
    path: "/tasks",
  },
  {
    id: "03",
    title: "Progress_Report",
    accent: "lime",
    copy:
      "An adaptive AI layer that helps you handle repetitive load while you move toward higher-value human judgment work.",
    link: "DEPLOY_AGENT",
    icon: "◉",
    path: "/progress",
  },
];

function Dashboard() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="dashboard-page cyber-home">
        <section className="cyber-home-hero">
          <div className="cyber-home-badge">SYSTEM_STATUS: OPTIMAL // VERSION_2.4.0</div>

          <h1 className="cyber-home-title">
            <span className="glitch-line glitch-animated" data-text="ARE_YOU_">
              ARE_YOU_
            </span>
            <span className="glitch-line accent secondary glitch-animated" data-text="OBSOLETE?">
              OBSOLETE?
            </span>
          </h1>

          <p className="cyber-home-copy">
            The AI wave is approaching. We calculate your <span>displacement risk</span>, generate your{" "}
            <span>survival tasks</span>, and deploy a <span>neural assistant</span> to execute them.
          </p>

          <div className="cyber-home-actions">
            <button
              type="button"
              className="cyber-home-primary"
              onClick={() => navigate("/risk-management")}
            >
              RUN_DIAGNOSTIC
            </button>

            <div className="cyber-home-recent">
              <small>Recent_Scans</small>
              <div className="recent-seeds">
                <span>A</span>
                <span>B</span>
                <span>C</span>
                <strong>+12K</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="cyber-home-section">
          <div className="section-head">
            <div>
              <p className="section-kicker">Integrated neural solutions for vocational survival.</p>
              <h2>
                CORE_<span>MODULES</span>
              </h2>
            </div>
            <div className="section-code">0x4F_X_88</div>
          </div>

          <div className="feature-grid">
            {featureCards.map((card) => (
              <article key={card.id} className={`feature-card ${card.accent}`}>
                <div className="feature-id">{card.id}</div>
                <div className="feature-icon">{card.icon}</div>
                <h3>{card.title}</h3>
                <p>{card.copy}</p>
                <button type="button" onClick={() => navigate(card.path)}>
                  {card.link}
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="cyber-home-final">
          <div className="final-core">
            <h2>
              EVOLVE_<span>OR_PERISH</span>
            </h2>
            <p>
              Join 420,000+ professionals who are augmenting their existence before the system resets.
            </p>
            <div className="final-actions">
              <button type="button" className="final-primary">
                GET_CONNECTED
              </button>
              <button type="button" className="final-secondary">
                READ_MANIFESTO
              </button>
            </div>
          </div>
        </section>

        <footer className="cyber-home-footer">
          <div className="footer-brand">
            <div className="footer-chip">◈</div>
            <div>
              <strong>DEVELOPER_CORE</strong>
              <p>
                Engineered by Sayyed Areeb. Providing high-fidelity neural assessments and professional augmentation protocols.
                <br />
                <span style={{ color: "var(--cyan)", marginTop: "8px", display: "inline-block", letterSpacing: "0.05em" }}>
                  COMMS: sayyedareeb90@gmail.com
                </span>
              </p>
            </div>
          </div>

          <div className="footer-links">
            <div>
              <small>DIRECTORIES</small>
              <a href="#home">Matrix_Home</a>
              <a href="#matrix">Diagnostic_Tool</a>
              <a href="#proxy">Neural_Proxy</a>
              <a href="#tiers">Clearance_Tiers</a>
            </div>
            <div>
              <small>UPLINK_PORTALS</small>
              <a href="https://www.linkedin.com/in/areeb564/" target="_blank" rel="noreferrer">LinkedIn</a>
              <a href="https://www.instagram.com/areeb_._._?igsh=MWVsbHN0Y2tlMG4wOA==" target="_blank" rel="noreferrer">Instagram</a>
              <a href="mailto:sayyedareeb90@gmail.com">Email Uplink</a>
            </div>
          </div>
        </footer>
      </div>
    </Layout>
  );
}

export default Dashboard;
