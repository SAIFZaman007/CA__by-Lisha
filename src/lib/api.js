import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1'

export const http = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // sends the HttpOnly refresh cookie
  timeout: 20000,
  headers: { Accept: 'application/json' },
})

// The access token lives in memory only. Nothing sensitive goes into
// localStorage, so an XSS bug cannot walk away with a session.
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

// When the access token expires mid-session, refresh once and replay the
// request. Concurrent 401s share a single refresh rather than stampeding.
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
        // `audience=client` tells the API which of the two isolated session
        // cookies to read — this app's, not the coach dashboard's. See
        // REFRESH_COOKIE_NAMES in the backend's auth endpoint for why the two
        // apps no longer share one cookie slot.
        refreshPromise ??= http.post('/auth/refresh?audience=client').finally(() => {
          refreshPromise = null
        })
        const { data } = await refreshPromise
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

    // Images go up on their own request, before the message that references
    // them exists. A slow upload never blocks the text box, and a validation
    // slip on the message never costs the client a re-upload.
    //
    // `onProgress` gets real bytes-sent from axios rather than a spinner: on a
    // gym connection a silent upload is indistinguishable from a frozen page,
    // and people respond to that by tapping send again.
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