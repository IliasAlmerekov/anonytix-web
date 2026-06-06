export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1'

// Mock mode is on until a real backend is wired up.
export const USE_MOCKS = true

// Single demo company id used in mock paths.
export const COMPANY_ID = '10729623-735e-4382-854f-33e3450bdac7'
