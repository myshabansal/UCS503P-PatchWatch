import axios from 'axios'

// Backend base URL — override via a .env file (VITE_API_BASE_URL=...) for
// non-local setups. Defaults to the local FastAPI dev server.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})
