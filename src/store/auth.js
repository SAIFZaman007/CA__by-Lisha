import { create } from 'zustand'
import { api, setAccessToken, onUnauthenticated } from '@/lib/api'

let bootstrapPromise = null

const STAFF_ROLES = ['coach', 'admin']

export const useAuth = create((set, get) => ({
  user: null,
  status: 'loading', 
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

      if (STAFF_ROLES.includes(user.role)) {
        await api.auth.logout().catch(() => {})
        setAccessToken(null)
        set({ user: null, status: 'anonymous' })
        return
      }
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

    if (STAFF_ROLES.includes(user.role)) {
      await api.auth.logout().catch(() => {})
      setAccessToken(null)
      set({ user: null, status: 'anonymous' })
      throw new Error('That account signs in on the coach dashboard, not here.')
    }

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

onUnauthenticated(() => useAuth.setState({ user: null, status: 'anonymous' }))