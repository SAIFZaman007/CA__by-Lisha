import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        const status = error?.response?.status
        if (status >= 400 && status < 500) return false
        return failureCount < 2
      },
    },
    mutations: { retry: false },
  },
})

/** Query keys in one place so invalidation never misses a cache. */
export const keys = {
  dashboard: ['dashboard'],
  profile: ['profile'],
  programs: ['programs'],
  testimonials: ['testimonials'],
  workoutPlan: ['workouts', 'plan'],
  sessions: (days) => ['workouts', 'sessions', days],
  exercises: (params) => ['exercises', params],
  mealPlan: ['nutrition', 'plan'],
  mealLogs: (date) => ['nutrition', 'logs', date],
  nutritionToday: ['nutrition', 'today'],
  weight: (days) => ['progress', 'weight', days],
  measurements: ['progress', 'measurements'],
  photos: ['progress', 'photos'],
  progressSummary: (days) => ['progress', 'summary', days],
  sleep: (days) => ['wellness', 'sleep', days],
  cardio: (days) => ['wellness', 'cardio', days],
  wellnessSummary: (days) => ['wellness', 'summary', days],
  wellnessTrends: (days) => ['wellness', 'trends', days],
  activityTypes: ['wellness', 'activity-types'],
  tutorials: (params) => ['tutorials', params],
  tutorialFilters: ['tutorials', 'filters'],
  thread: ['messages', 'thread'],
}