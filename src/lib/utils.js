import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge Tailwind classes without conflicts. */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// --- Units -------------------------------------------------------------------
// Everything is stored in metric. The UI shows whatever the client prefers.

export const KG_PER_LB = 0.45359237

export const kgToLb = (kg) => (kg == null ? null : Math.round(kg / KG_PER_LB * 10) / 10)
export const lbToKg = (lb) => (lb == null ? null : Math.round(lb * KG_PER_LB * 100) / 100)
export const cmToIn = (cm) => (cm == null ? null : Math.round((cm / 2.54) * 10) / 10)
export const inToCm = (inches) => (inches == null ? null : Math.round(inches * 2.54 * 10) / 10)

export function formatWeight(kg, units = 'imperial', { decimals = 1 } = {}) {
  if (kg == null) return '—'
  const value = units === 'imperial' ? kgToLb(kg) : kg
  return `${Number(value).toFixed(decimals)} ${units === 'imperial' ? 'lbs' : 'kg'}`
}

export function formatLength(cm, units = 'imperial') {
  if (cm == null) return '—'
  return units === 'imperial' ? `${cmToIn(cm)}"` : `${cm} cm`
}

/** Signed change, e.g. "-2.4 lbs" or "+0.5". */
export function formatDelta(value, suffix = '') {
  if (value == null) return '—'
  const rounded = Math.round(value * 10) / 10
  return `${rounded > 0 ? '+' : ''}${rounded}${suffix}`
}

// --- Misc --------------------------------------------------------------------

export const clamp = (n, min, max) => Math.min(Math.max(n, min), max)

export const pct = (value, target) =>
  !target ? 0 : clamp(Math.round((value / target) * 100), 0, 100)

export const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** JS Sunday-first weekday to our Monday-first index. */
export const todayIndex = () => (new Date().getDay() + 6) % 7

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}
