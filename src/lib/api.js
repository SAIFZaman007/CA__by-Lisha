import axios from 'axios'

/**
 * Resolve the API base URL once, safely.
 *
 * `VITE_API_URL` is optional. Blank (the default in every .env file) means the
 * API is served from the same origin under `/api/v1` — the Vite dev proxy
 * locally, nginx in production. It may also hold a full base
 * (`https://api.example.com/api/v1`) or just an origin
 * (`http://localhost:8000`), and `/api/v1` is appended when missing.
 *
 * `??` is not enough here: Vite turns `VITE_API_URL=` into an empty string,
 * which `??` keeps, so every request went to `/programs` instead of
 * `/api/v1/programs` and 404'd.
 */
function resolveApiBase(raw) {
  const value = String(raw ?? '').trim().replace(/\/+$/, '')
  if (!value) return '/api/v1'
  return /\/api\/v\d+$/.test(value) ? value : `${value}/api/v1`
}

export const API_BASE_URL = resolveApiBase(import.meta.env.VITE_API_URL)

export const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 20000,
  headers: { Accept: 'application/json' },
})

let accessToken = null
let onSessionLost = () => {}

export function setAccessToken(token) {
  accessToken = token
}
export function getAccessToken() {
  return accessToken
}
export function onUnauthenticated(handler) {
  onSessionLost = handler
}

http.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  return config
})

let refreshPromise = null

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const status = error.response?.status
    const isAuthRoute = original?.url?.includes('/auth/')

    if (status === 401 && !original?._retried && !isAuthRoute) {
      original._retried = true
      try {
        refreshPromise ??= http.post('/auth/refresh?audience=client').finally(() => {
          refreshPromise = null
        })
        const { data } = await refreshPromise
        // 204 (no session cookie) carries no token: the session is gone.
        if (!data?.access_token) throw new Error('No session to resume')
        setAccessToken(data.access_token)
        original.headers.Authorization = `Bearer ${data.access_token}`
        return http(original)
      } catch {
        setAccessToken(null)
        onSessionLost()
      }
    }
    return Promise.reject(error)
  },
)

/** Turn any API failure into a sentence worth showing a person. */
export function errorMessage(error, fallback = 'Something went wrong. Try again.') {
  const data = error?.response?.data
  if (data?.fields) return Object.values(data.fields)[0]
  if (typeof data?.detail === 'string') return data.detail
  if (error?.code === 'ECONNABORTED') return 'That took too long. Check your connection and retry.'
  if (!error?.response) return 'Cannot reach the server. Check your connection.'
  return fallback
}

const get = (url, params) => http.get(url, { params }).then((r) => r.data)
const post = (url, body) => http.post(url, body).then((r) => r.data)
const put = (url, body) => http.put(url, body).then((r) => r.data)
const patch = (url, body) => http.patch(url, body).then((r) => r.data)
const del = (url) => http.delete(url).then((r) => r.data)

export const api = {
  auth: {
    register: (body) => post('/auth/register', body),
    login: (body) => post('/auth/login', body),
    refresh: () => post('/auth/refresh?audience=client'),
    logout: () => post('/auth/logout'),
    me: () => get('/auth/me'),
    forgotPassword: (body) => post('/auth/forgot-password', body),
    resetPassword: (body) => post('/auth/reset-password', body),
    changePassword: (body) => post('/auth/change-password', body),
  },
  users: {
    me: () => get('/users/me'),
    update: (body) => patch('/users/me', body),
    profile: () => get('/users/me/profile'),
    updateProfile: (body) => patch('/users/me/profile', body),
  },
  site: {
    meta: () => get('/meta/site'),
    programs: () => get('/programs'),
    program: (slug) => get(`/programs/${slug}`),
    testimonials: () => get('/testimonials'),
    createLead: (body) => post('/leads', body),
    createBooking: (body) => post('/bookings', body),
  },
  calculators: {
    calories: (body) => post('/calculators/calories', body),
    applyCalories: (body) => post('/calculators/calories/apply', body),
    bmi: (body) => post('/calculators/bmi', body),
    cardioBurn: (body) => post('/calculators/cardio-burn', body),
    reference: () => get('/calculators/reference'),
  },
  billing: {
    summary: () => get('/billing/summary'),
    entitlement: () => get('/billing/entitlement'),
    history: (limit) => get('/billing/history', limit ? { limit } : undefined),
    invoices: () => get('/billing/invoices'),

    checkout: (programId) => post('/billing/checkout', { program_id: programId }),
    checkoutStatus: (sessionId) => get(`/billing/checkout/${sessionId}`),

    previewChange: (programId) =>
      post('/billing/change-plan/preview', { program_id: programId }),
    changePlan: (programId) => post('/billing/change-plan', { program_id: programId }),
    cancelScheduledChange: () => post('/billing/change-plan/cancel'),

    cancel: (body) => post('/billing/cancel', body ?? {}),
    resume: () => post('/billing/resume'),

    updatePaymentMethod: () => post('/billing/payment-method'),
    portal: () => post('/billing/portal'),
  },
  dashboard: { get: () => get('/dashboard') },
  workouts: {
    plan: () => get('/workouts/plan'),
    plans: () => get('/workouts/plans'),
    createCustom: (body) => post('/workouts/plans/custom', body),
    activate: (id) => post(`/workouts/plans/${id}/activate`),
    startSession: (body) => post('/workouts/sessions', body),
    sessions: (days = 30) => get('/workouts/sessions', { days }),
    updateSession: (id, body) => patch(`/workouts/sessions/${id}`, body),
    logSet: (id, body) => put(`/workouts/sessions/${id}/sets`, body),
    deleteSet: (sessionId, setId) => del(`/workouts/sessions/${sessionId}/sets/${setId}`),
    history: (exerciseId) => get(`/workouts/history/${exerciseId}`),
  },
  exercises: {
    list: (params) => get('/exercises', params),
    filters: () => get('/exercises/filters'),
    get: (id) => get(`/exercises/${id}`),
  },
  nutrition: {
    plan: () => get('/nutrition/plan'),
    day: (dow) => get(`/nutrition/plan/day/${dow}`),
    logs: (onDate) => get('/nutrition/logs', onDate ? { on_date: onDate } : undefined),
    logMeal: (body) => put('/nutrition/logs', body),
    today: () => get('/nutrition/today'),
    // Build (or refresh) the automatic plan from the client's latest numbers.
    generate: () => post('/nutrition/plan/generate'),
  },
  progress: {
    weight: (days = 180) => get('/progress/weight', { days }),
    logWeight: (body) => put('/progress/weight', body),
    measurements: () => get('/progress/measurements'),
    logMeasurements: (body) => put('/progress/measurements', body),
    photos: () => get('/progress/photos'),
    deletePhoto: (id) => del(`/progress/photos/${id}`),
    uploadPhoto: (formData) =>
      http
        .post('/progress/photos', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data),
    summary: (days = 30) => get('/progress/summary', { days }),
  },
  wellness: {
    sleep: (days = 30) => get('/wellness/sleep', { days }),
    logSleep: (body) => put('/wellness/sleep', body),
    deleteSleep: (id) => del(`/wellness/sleep/${id}`),
    cardio: (days = 30) => get('/wellness/cardio', { days }),
    logCardio: (body) => post('/wellness/cardio', body),
    updateCardio: (id, body) => patch(`/wellness/cardio/${id}`, body),
    deleteCardio: (id) => del(`/wellness/cardio/${id}`),
    summary: (days = 7) => get('/wellness/summary', { days }),
    trends: (days = 14) => get('/wellness/trends', { days }),
    activityTypes: () => get('/wellness/activity-types'),
  },
  tutorials: {
    list: (params) => get('/tutorials', params),
    filters: () => get('/tutorials/filters'),
    get: (id) => get(`/tutorials/${id}`),
    recordView: (id) => post(`/tutorials/${id}/view`).catch(() => {}),
  },
  messages: {
    thread: () => get('/messages/thread'),
    send: (body) => post('/messages/thread', body),
    unreadCount: () => get('/messages/unread-count'),

    uploadAttachment: (file, onProgress) => {
      const body = new FormData()
      body.append('file', file)
      return http
        .post('/messages/attachments', body, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 120000,
          onUploadProgress: (event) => {
            if (onProgress && event.total) {
              onProgress(Math.round((event.loaded * 100) / event.total))
            }
          },
        })
        .then((r) => r.data)
    },
    discardAttachment: (id) => del(`/messages/attachments/${id}`),
  },

  gallery: {
    list: (params) => get('/gallery', params),
    sections: () => get('/gallery/sections'),
    categories: () => get('/gallery/categories'),
    get: (slug) => get(`/gallery/${slug}`),
  },
}