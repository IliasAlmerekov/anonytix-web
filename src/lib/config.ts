export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL
  ?? (import.meta.env.DEV ? 'http://localhost:8080/api/v1' : '/api/v1')

// Safe default: real API unless mocks are explicitly enabled.
// (A missing var in prod must NOT silently fall back to mock data.)
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'
export const USE_DASHBOARD_MOCKS =
  import.meta.env.VITE_USE_DASHBOARD_MOCKS === 'true'

export const COMPANY_ID =
  import.meta.env.VITE_COMPANY_ID ?? '10729623-735e-4382-854f-33e3450bdac7'
