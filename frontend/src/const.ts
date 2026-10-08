import { TOKEN_STORAGE_KEY } from "@shared/const";

export { ONE_YEAR_MS } from "@shared/const";

// The sign-in JWT lives in localStorage and is sent as a Bearer header, like the other cok apps.
export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token: string) => {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    // Storage unavailable; the session simply will not persist.
  }
};

export const clearToken = () => {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
};

// Sends the browser to the sign-in page, remembering where to return afterwards.
export const startLogin = () => {
  if (window.location.pathname === "/login") return;
  const next = `${window.location.pathname}${window.location.search}`;
  window.location.href = `/login?next=${encodeURIComponent(next)}`;
};
