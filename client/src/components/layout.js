import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";
import API_BASE_URL from "../config/api";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PROFILE_IMAGE_SIZE = 2 * 1024 * 1024;

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

const formatDisplayName = (email) => {
  const value = String(email || "").trim().toLowerCase();

  if (!value) {
    return "Operator";
  }

  return value
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

function Layout({ children }) {
  const links = [
    { label: "Home", path: "/dashboard" },
    { label: "Risk", path: "/risk-management" },
    { label: "Tasks", path: "/tasks" },
    { label: "Progress", path: "/progress" },
  ];
  
  const [progressData, setProgressData] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("prometheus_progress");
        return raw ? JSON.parse(raw) : { totalXp: 0 };
      } catch {
        return { totalXp: 0 };
      }
    }
    return { totalXp: 0 };
  });

  const [account, setAccount] = useState({
    email: "",
    profileImage: "",
  });
  const [accountMessage, setAccountMessage] = useState("");
  const [accountMessageType, setAccountMessageType] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isAccountLoading, setIsAccountLoading] = useState(true);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const fileInputRef = useRef(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
  const fallbackEmail =
    typeof window !== "undefined" ? localStorage.getItem("prometheus_username") || "" : "";
  const displayEmail = account.email || fallbackEmail;
  const displayName = formatDisplayName(displayEmail);
  const avatarFallback = displayName.charAt(0).toUpperCase() || "P";

  const loadProfile = async () => {
    if (!token) {
      setAccount({ email: fallbackEmail, profileImage: "" });
      setIsAccountLoading(false);
      return;
    }

    try {
      const res = await axios.get(`${API_BASE_URL}/api/profile`, {
        headers: { authorization: token },
      });
      const user = res.data?.user || {};
      const nextAccount = {
        email: user.email || fallbackEmail,
        profileImage: user.profileImage || "",
      };

      setAccount(nextAccount);

      if (nextAccount.email) {
        localStorage.setItem("prometheus_username", nextAccount.email);
      }
    } catch (error) {
      setAccount({ email: fallbackEmail, profileImage: "" });
      setAccountMessage("Could not sync account details.");
      setAccountMessageType("error");
    } finally {
      setIsAccountLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();

    const handleProgressUpdate = () => {
      try {
        const raw = localStorage.getItem("prometheus_progress");
        if (raw) {
          setProgressData(JSON.parse(raw));
        }
      } catch {}
    };

    window.addEventListener("prometheus_progress_update", handleProgressUpdate);
    window.addEventListener("storage", handleProgressUpdate);

    return () => {
      window.removeEventListener("prometheus_progress_update", handleProgressUpdate);
      window.removeEventListener("storage", handleProgressUpdate);
    };
  }, []);
  const handlePasswordFieldChange = (key, value) => {
    setPasswordForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handlePhotoSelect = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setAccountMessage("Choose a valid image file.");
      setAccountMessageType("error");
      return;
    }

    if (file.size > MAX_PROFILE_IMAGE_SIZE) {
      setAccountMessage("Profile image must be under 2 MB.");
      setAccountMessageType("error");
      return;
    }

    if (!token) {
      setAccountMessage("Please log in again to update your profile.");
      setAccountMessageType("error");
      return;
    }

    setIsSavingPhoto(true);

    try {
      const imageDataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Unable to read image"));
        reader.readAsDataURL(file);
      });

      const res = await axios.patch(
        `${API_BASE_URL}/api/profile`,
        { profileImage: imageDataUrl },
        { headers: { authorization: token } }
      );

      const user = res.data?.user || {};
      setAccount((current) => ({
        ...current,
        email: user.email || current.email,
        profileImage: user.profileImage || "",
      }));
      setAccountMessage("Profile picture updated.");
      setAccountMessageType("success");
    } catch (error) {
      setAccountMessage(error.response?.data?.message || "Profile picture update failed.");
      setAccountMessageType("error");
    } finally {
      setIsSavingPhoto(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      setAccountMessage("Please log in again to change your password.");
      setAccountMessageType("error");
      return;
    }

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setAccountMessage("Fill in all password fields.");
      setAccountMessageType("error");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setAccountMessage("New password must be at least 6 characters.");
      setAccountMessageType("error");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setAccountMessage("New passwords do not match.");
      setAccountMessageType("error");
      return;
    }

    setIsSavingPassword(true);

    try {
      const res = await axios.patch(
        `${API_BASE_URL}/api/profile/password`,
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
        {
          headers: { authorization: token },
        }
      );

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowPasswordForm(false);
      setAccountMessage(res.data?.message || "Password updated successfully.");
      setAccountMessageType("success");
    } catch (error) {
      setAccountMessage(error.response?.data?.message || "Password update failed.");
      setAccountMessageType("error");
    } finally {
      setIsSavingPassword(false);
    }
  };

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
              <strong className="status-cyan">
                {String(Math.floor((progressData.totalXp || 0) / 100) + 1).padStart(2, "0")}
              </strong>
            </div>
            <div className="scan-list-item">
              <span>XP DATA</span>
              <strong className="status-good">
                {(progressData.totalXp || 0) % 100} / 100
              </strong>
            </div>
          </div>
        </div>

        <div className="cyber-sidebar-footer">
          <div className="cyber-led">Account</div>
          <div className="cyber-account-box">
            <div className="cyber-account-top">
              {account.profileImage ? (
                <img
                  src={account.profileImage}
                  alt={`${displayName} profile`}
                  className="cyber-account-avatar-image"
                />
              ) : (
                <div className="cyber-account-avatar">{avatarFallback}</div>
              )}
              <div className="cyber-account-copy">
                <strong>{displayName}</strong>
                <span>{displayEmail || "Active user"}</span>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="cyber-file-input"
              onChange={handlePhotoChange}
            />
            <div className="scan-list">
              <div className="scan-list-item">
                <span>ACCESS</span>
                <strong className="status-good">VERIFIED</strong>
              </div>
              <div className="scan-list-item">
                <span>SESSION</span>
                <strong className="status-cyan">{isAccountLoading ? "SYNCING" : "ONLINE"}</strong>
              </div>
              <div className="scan-list-item">
                <span>MODE</span>
                <strong className="status-alert">FOCUS</strong>
              </div>
            </div>
            <div className="cyber-account-actions">
              <button
                type="button"
                className="cyber-account-btn"
                onClick={handlePhotoSelect}
                disabled={isSavingPhoto}
              >
                {isSavingPhoto ? "Uploading..." : "Profile Photo"}
              </button>
              <button
                type="button"
                className="cyber-account-btn"
                onClick={() => setShowPasswordForm((current) => !current)}
              >
                {showPasswordForm ? "Close" : "Change Password"}
              </button>
            </div>
            {accountMessage ? (
              <div className={`cyber-account-message ${accountMessageType}`}>{accountMessage}</div>
            ) : null}
            {showPasswordForm ? (
              <form className="cyber-account-form" onSubmit={handlePasswordSubmit}>
                <input
                  type="password"
                  placeholder="Current password"
                  value={passwordForm.currentPassword}
                  onChange={(event) => handlePasswordFieldChange("currentPassword", event.target.value)}
                  className="cyber-account-input"
                />
                <input
                  type="password"
                  placeholder="New password"
                  value={passwordForm.newPassword}
                  onChange={(event) => handlePasswordFieldChange("newPassword", event.target.value)}
                  className="cyber-account-input"
                />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) => handlePasswordFieldChange("confirmPassword", event.target.value)}
                  className="cyber-account-input"
                />
                <button type="submit" className="cyber-account-submit" disabled={isSavingPassword}>
                  {isSavingPassword ? "Updating..." : "Update Password"}
                </button>
              </form>
            ) : null}
          </div>
        </div>
      </aside>

      <main className="cyber-main">{children}</main>
    </div>
  );
}

export default Layout;

