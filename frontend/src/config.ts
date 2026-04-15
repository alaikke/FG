// API base URL — em produção usa path relativo (Nginx faz proxy), em dev usa localhost
export const API_BASE = import.meta.env.VITE_API_URL || '';
