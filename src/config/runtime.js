const LOCAL_BACKEND_URL = "http://localhost:4000";
const isBrowser = typeof window !== "undefined";
const browserOrigin = isBrowser ? window.location.origin : LOCAL_BACKEND_URL;

export const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? LOCAL_BACKEND_URL : browserOrigin);
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.DEV ? LOCAL_BACKEND_URL : browserOrigin);
