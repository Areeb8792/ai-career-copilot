import { NavLink } from "react-router-dom";

function PrometheusSigil() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path
        d="M32 4 50 14v20c0 12.2-7.6 22.2-18 26-10.4-3.8-18-13.8-18-26V14L32 4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        d="M35.2 13.6c1.8 7-1.9 10.2-5.4 14.1-2.6 2.9-4.1 5.5-4.1 9 0 5.2 3.8 8.7 8.5 8.7 5.5 0 9.3-4.2 9.3-10 0-5.1-2.8-9.4-8.3-21.8Z"
        fill="currentColor"
      />
      <path
        d="M31.8 44.2 24.6 52h14.8l-7.6-7.8Z"
        fill="currentColor"
      />
      <path
        d="M20 20h7M37 20h7M18 28h5M41 28h5M21 37h4M39 37h4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  );
}

function Layout({ children }) {
  const links = [
    { label: "Home", path: "/dashboard" },
    { label: "Risk", path: "/risk-management" },
    { label: "Tasks", path: "/tasks" },
    { label: "Progress", path: "/progress" },
  ];

  return (
    <div className="app-shell">
      <aside className="cyber-sidebar">
        <div className="cyber-brand-block">
          <div className="cyber-avatar cyber-avatar-large">
            <PrometheusSigil />
          </div>
          <div className="cyber-brand-copy">
            <strong>PROMETHEUS</strong>
            <span>AI RISK ASSESSMENT</span>
            <span>PLATFORM</span>
          </div>
        </div>

        <nav className="cyber-nav cyber-nav-top" aria-label="Primary navigation">
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `cyber-nav-link${isActive ? " active" : ""}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="cyber-stat-block">
          <div className="cyber-led">Current Rank</div>
          <div className="scan-list">
            <div className="scan-list-item">
              <span>LEVEL</span>
              <strong className="status-cyan">01</strong>
            </div>
            <div className="scan-list-item">
              <span>XP DATA</span>
              <strong className="status-good">0 / 100</strong>
            </div>
          </div>
        </div>

        <div className="cyber-sidebar-footer">
          <div className="cyber-led">Account</div>
          <div className="cyber-account-box">
            <div className="cyber-account-top">
              <div className="cyber-account-avatar">S</div>
              <div className="cyber-account-copy">
                <strong>Sayeed</strong>
                <span>Active User</span>
              </div>
            </div>
            <div className="scan-list">
              <div className="scan-list-item">
                <span>ACCESS</span>
                <strong className="status-good">VERIFIED</strong>
              </div>
              <div className="scan-list-item">
                <span>SESSION</span>
                <strong className="status-cyan">ONLINE</strong>
              </div>
              <div className="scan-list-item">
                <span>MODE</span>
                <strong className="status-alert">FOCUS</strong>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="cyber-main">{children}</main>
    </div>
  );
}

export default Layout;

