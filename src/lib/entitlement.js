import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api'
import { keys } from '@/lib/queryClient'
import { useAuth } from '@/store/auth'

/** Feature names, matching `services.entitlements` on the API. */
export const FEATURES = {
  dashboard: 'dashboard',
  workouts: 'workouts',
  exerciseVideos: 'exercise_videos',
  mealPlan: 'meal_plan',
  progress: 'progress_tracking',
  sleepCardio: 'sleep_cardio',
  tutorials: 'tutorials',
  messaging: 'messaging',
  calculators: 'calculators',
  billing: 'billing',
  profile: 'profile',
}

export function useEntitlement() {
  const authenticated = useAuth((s) => s.status === 'authenticated')

  const query = useQuery({
    queryKey: keys.billingEntitlement,
    queryFn: api.billing.entitlement,
    enabled: authenticated,
    // A subscription changes rarely, and a stale answer only ever shows a
    // locked panel a second longer — the server is what actually refuses.
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: true,
  })

  const features = query.data?.features ?? []

  return {
    ...query,
    entitlement: query.data ?? null,
    isSubscribed: Boolean(query.data?.is_subscribed),
    level: query.data?.level ?? null,
    program: query.data?.program ?? null,
    /** True only once the answer is in: never guess access while loading. */
    has: (feature) => features.includes(feature),
    /** Still resolving, so screens can hold rather than flash a lock. */
    isResolving: authenticated && query.isPending,
  }
}