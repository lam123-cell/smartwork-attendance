// API Base URL từ environment variables
export const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api/v1';

// App constants
export const APP_NAME = (import.meta as any).env?.VITE_APP_NAME || '';
export const APP_VERSION = (import.meta as any).env?.VITE_APP_VERSION || '1.0.0';

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
