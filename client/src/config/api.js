const isLocalhost = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
const defaultUrl = isLocalhost ? "http://localhost:5000" : "";
const API_BASE_URL = (process.env.REACT_APP_API_URL || defaultUrl).replace(/\/$/, "");

export default API_BASE_URL;
