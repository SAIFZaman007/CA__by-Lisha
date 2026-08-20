import { create } from 'zustand'
import { api, setAccessToken, onUnauthenticated } from '@/lib/api'

// One bootstrap per page load, no matter how many times it is called.
//
// React StrictMode double-invokes effects in development, so `bootstrap()` ran
// twice on every mount. Both calls hit /auth/refresh with the same cookie; the
// first rotated the token and the second presented one that had just been
// revoked — which the server read as a replay and signed the session out. That
// is why a reload logged you straight back out.
//
// The server now tolerates the race, but firing the second request at all is
// still waste. Holding the in-flight promise means later callers await the
// first result instead of starting another round trip.
let bootstrapPromise = null

/**
 * Session state. The access token is held in the API module's memory, not here
 * and not in storage; this store only tracks who is signed in.
 */
export const useAuth = create((set, get) => ({
  user: null,
  status: 'loading', // loading | authenticated | anonymous

  /** Called once on app start. Tries the refresh cookie for a silent sign-in. */
  bootstrap() {
    bootstrapPromise ??= get()
      ._doBootstrap()
      .finally(() => {
        bootstrapPromise = null
      })
    return bootstrapPromise
  },

  async _doBootstrap() {
    try {
      const { access_token } = await api.auth.refresh()
      setAccessToken(access_token)
      const user = await api.auth.me()
      set({ user, status: 'authenticated' })
    } catch {
      setAccessToken(null)
      set({ user: null, status: 'anonymous' })
    }
  },

  async login(credentials) {
    const { access_token } = await api.auth.login(credentials)
    setAccessToken(access_token)
    const user = await api.auth.me()
    set({ user, status: 'authenticated' })
    return user
  },

  async register(details) {
    const { access_token } = await api.auth.register(details)
    setAccessToken(access_token)
    const user = await api.auth.me()
    set({ user, status: 'authenticated' })
    return user
  },

  async logout() {
    try {
      await api.auth.logout()
    } finally {
      setAccessToken(null)
      bootstrapPromise = null
      set({ user: null, status: 'anonymous' })
    }
  },

  setUser: (user) => set({ user }),

  get units() {
    return get().user?.profile?.unit_system ?? 'imperial'
  },
}))

// If a refresh fails mid-session, drop the user cleanly rather than leaving
// the portal in a half-signed-in state.
onUnauthenticated(() => useAuth.setState({ user: null, status: 'anonymous' }))