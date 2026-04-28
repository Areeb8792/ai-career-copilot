import { useState } from "react";
import axios from "axios";
import "./auth.css";
import API_BASE_URL from "../config/api";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 12a4.25 4.25 0 1 0-4.25-4.25A4.25 4.25 0 0 0 12 12Zm0 1.75c-4.13 0-7.5 2.29-7.5 5.1 0 .34.28.61.62.61h13.76c.34 0 .62-.27.62-.61 0-2.81-3.37-5.1-7.5-5.1Z"
        fill="currentColor"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M17 9h-1V6.75a4 4 0 1 0-8 0V9H7a2.75 2.75 0 0 0-2.75 2.75v7.5A2.75 2.75 0 0 0 7 22h10a2.75 2.75 0 0 0 2.75-2.75v-7.5A2.75 2.75 0 0 0 17 9Zm-6.5-2.25a1.5 1.5 0 0 1 3 0V9h-3V6.75Z"
        fill="currentColor"
      />
    </svg>
  );
}

function FlameMark() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path
        d="M35.31 6.94c1.41 7.4-2.17 10.28-5.94 14.3-3.33 3.55-5.77 7.12-5.77 12.18 0 6.42 4.81 10.93 10.78 10.93 6.8 0 11.72-5.21 11.72-12.57 0-7.2-4.23-12.93-10.79-24.84Z"
        fill="currentColor"
      />
      <path
        d="M25.06 32.76c0 3.76 2.79 6.57 6.47 6.57 4.22 0 7.18-3.21 7.18-7.82 0-2.6-.87-4.96-2.83-8.52-.46 2.36-1.76 4.08-3.14 5.56-1.21 1.3-2.22 2.46-2.22 4.21 0 2.08 1.48 3.54 3.31 3.54a3.3 3.3 0 0 0 3.34-2.84c.34 3.41-1.96 5.88-5.48 5.88-3.61 0-6.63-2.76-6.63-6.58Z"
        fill="rgba(10,8,18,0.88)"
      />
      <path
        d="M32 45.6 19.44 57h25.12L32 45.6Z"
        fill="currentColor"
      />
    </svg>
  );
}

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      alert("Enter a valid email address.");
      return;
    }

    if (password.trim().length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/api/signup`, {
        email: normalizedEmail,
        password,
      });

      if (!localStorage.getItem("prometheus_signup_date")) {
        localStorage.setItem("prometheus_signup_date", new Date().toISOString());
      }
      localStorage.setItem("prometheus_username", normalizedEmail);

      alert("Account created");
      window.location.href = "/login";
    } catch (err) {
      alert(err.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-grid" />
      <div className="corner-circuits corner-left" />
      <div className="corner-circuits corner-top" />

      <main className="auth-layout">
        <section className="auth-panel">
          <header className="brand-row">
            <div className="brand-mark-shell">
              <div className="brand-mark-frame">
                <FlameMark />
              </div>
            </div>

            <div className="brand-copy">
              <h1 className="brand-title">PROMETHEUS</h1>
              <p className="brand-subtitle">AI RISK ASSESSMENT PLATFORM</p>
            </div>
          </header>

          <div className="field-group">
            <label className="field-label" htmlFor="signup-email">
              EMAIL
            </label>
            <div className="input-shell">
              <span className="input-icon">
                <UserIcon />
              </span>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                placeholder="ENTER EMAIL"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
              />
            </div>
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="signup-password">
              PASSWORD
            </label>
            <div className="input-shell">
              <span className="input-icon">
                <LockIcon />
              </span>
              <input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                placeholder="ENTER PASSWORD"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
              />
            </div>
          </div>

          <button onClick={handleSignup} className="auth-btn">
            <span>SIGN UP</span>
            <span className="auth-btn-arrow">{">"}</span>
          </button>

          <div className="auth-switch" aria-label="Authentication switch">
            <button
              type="button"
              className="switch-btn"
              onClick={() => {
                window.location.href = "/login";
              }}
            >
              LOG IN
            </button>
            <button type="button" className="switch-btn switch-btn-active">
              SIGN UP
            </button>
          </div>

          <div className="social-row" aria-label="Social sign in">
            <button type="button" className="social-btn">
              G
            </button>
            <button type="button" className="social-btn">
              in
            </button>
            <button type="button" className="social-btn">
              GH
            </button>
          </div>

          <nav className="bottom-nav" aria-label="Terminal sections">
            <button
              type="button"
              className="nav-item"
              onClick={() => {
                window.location.href = "/dashboard";
              }}
            >
              <span className="nav-dot profile-icon" />
              <span>PROFILE</span>
            </button>
            <button
              type="button"
              className="nav-item"
              onClick={() => {
                window.location.href = "/tasks";
              }}
            >
              <span className="nav-dot tasks-icon" />
              <span>TASKS</span>
            </button>
            <button
              type="button"
              className="nav-item active"
              onClick={() => {
                window.location.href = "/dashboard";
              }}
            >
              <span className="nav-dot risk-icon" />
              <span>RISK ANALYSIS</span>
            </button>
          </nav>
        </section>

        <section className="hero-panel" aria-hidden="true">
          <div className="hero-image-frame">
            <img
              src="/prometheus-hero-upscaled.png"
              alt="Prometheus holographic intelligence"
              className="hero-image"
            />
          </div>
        </section>
      </main>
    </div>
  );
}

export default Signup;
