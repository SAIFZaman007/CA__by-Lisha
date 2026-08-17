import { create } from 'zustand'
import { api, setAccessToken, onUnauthenticated } from '@/lib/api'

/**
 * Session state. The access token is held in the API module's memory, not here
 * and not in storage; this store only tracks who is signed in.
 */
export const useAuth = create((set, get) => ({
  user: null,
  status: 'loading', // loading | authenticated | anonymous

  /** Called once on app start. Tries the refresh cookie for a silent sign-in. */
  async bootstrap() {
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
