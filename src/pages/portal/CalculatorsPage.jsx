import { useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/store/auth'
import { keys } from '@/lib/queryClient'
import { api } from '@/lib/api'
import { cmToIn, kgToLb } from '@/lib/utils'
import { PageHeading } from '@/components/portal/PortalLayout'
import { Calculators } from '@/components/sections/Calculators'
import { toast } from '@/components/ui/Toast'

function ageFrom(dateOfBirth) {
  if (!dateOfBirth) return undefined
  const born = new Date(dateOfBirth)
  const now = new Date()
  let age = now.getFullYear() - born.getFullYear()
  const monthDiff = now.getMonth() - born.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < born.getDate())) age -= 1
  return age
}

export default function CalculatorsPage() {
  const qc = useQueryClient()
  const profile = useAuth((s) => s.user?.profile)
  const setUser = useAuth((s) => s.setUser)

  const units = profile?.unit_system ?? 'imperial'

  // Pre-filled from the client's own stats, in whichever units they use, so
  // nobody retypes what the portal already knows.
  const defaults = {
    units,
    age: ageFrom(profile?.date_of_birth),
    sex: profile?.sex ?? undefined,
    activity_level: profile?.activity_level ?? undefined,
    goal: profile?.goal ?? undefined,
    weight: profile?.current_weight_kg
      ? units === 'imperial'
        ? kgToLb(profile.current_weight_kg)
        : Number(profile.current_weight_kg)
      : undefined,
    height: profile?.height_cm
      ? units === 'imperial'
        ? cmToIn(profile.height_cm)
        : Number(profile.height_cm)
      : undefined,
  }

  // Inside the portal the result is saved to the client's targets, not just shown.
  async function handleApplied() {
    const user = await api.auth.me()
    setUser(user)
    qc.invalidateQueries({ queryKey: keys.dashboard })
    qc.invalidateQueries({ queryKey: keys.profile })
    toast.success('Saved as your daily targets.')
  }

  return (
    <>
      <PageHeading eyebrow="Interactive tools" title="Calculators" />
      <Calculators defaults={defaults} onApplied={handleApplied} />
    </>
  )
}
