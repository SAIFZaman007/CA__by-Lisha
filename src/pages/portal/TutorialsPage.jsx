import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PlayCircle, Search, Star, X } from 'lucide-react'

import { api } from '@/lib/api'
import { keys } from '@/lib/queryClient'
import { cn } from '@/lib/utils'
import { PageHeading } from '@/components/portal/PortalLayout'
import { Card, EmptyState, Skeleton } from '@/components/ui/Card'

/**
 * Video Tutorials — the library the coach records so a client never has to guess
 * at form. Recordings are hosted on YouTube or Vimeo and embedded here; nothing
 * is uploaded to or served from our own infrastructure.
 */

const CATEGORY_LABELS = {
  getting_started: 'Getting started',
  form_technique: 'Form & technique',
  warm_up: 'Warm-up',
  mobility: 'Mobility',
  cardio: 'Cardio',
  nutrition: 'Nutrition',
  equipment: 'Equipment',
  recovery: 'Recovery',
}

const LEVEL_LABELS = { level_1: 'Level 1', level_2: 'Level 2', level_3: 'Level 3' }

/** Turn a pasted watch/share link into something an iframe will actually play. */
export function embedUrl(tutorial) {
  const { provider, video_url: url } = tutorial
  if (provider === 'youtube') {
    const id = url.match(
      /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
    )?.[1]
    return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1` : null
  }
  if (provider === 'vimeo') {
    const id = url.match(/vimeo\.com\/(?:video\/)?(\d{6,})/)?.[1]
    return id ? `https://player.vimeo.com/video/${id}?dnt=1` : null
  }
  return null
}

function duration(seconds) {
  if (!seconds) return null
  const m = Math.floor(seconds / 60)
  const s = String(seconds % 60).padStart(2, '0')
  return `${m}:${s}`
}

function TutorialCard({ tutorial, onOpen }) {
  const length = duration(tutorial.duration_seconds)

  return (
    <button
      type="button"
      onClick={() => onOpen(tutorial)}
      className="group flex flex-col overflow-hidden rounded-xl border border-ink-600 bg-ink-800 text-left transition hover:border-ink-500"
    >
      <span className="relative block aspect-video overflow-hidden bg-ink-850">
        {tutorial.thumbnail_url ? (
          <img
            src={tutorial.thumbnail_url}
            alt=""
            loading="lazy"
            decoding="async"
            className="size-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <span className="flex size-full items-center justify-center">
            <PlayCircle className="size-10 text-ink-500" aria-hidden="true" />
          </span>
        )}

        <span className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition group-hover:opacity-100">
          <PlayCircle className="size-12 text-white drop-shadow-lg" aria-hidden="true" />
        </span>

        {tutorial.is_featured && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded bg-brand-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            <Star className="size-3" aria-hidden="true" /> Start here
          </span>
        )}
        {length && (
          <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-white">
            {length}
          </span>
        )}
      </span>

      <span className="flex flex-1 flex-col p-4">
        <span className="font-display text-[11px] font-semibold uppercase tracking-widest text-brand-500">
          {CATEGORY_LABELS[tutorial.category] ?? tutorial.category}
        </span>
        <span className="mt-1.5 block font-display text-lg leading-tight text-white">
          {tutorial.title}
        </span>
        {tutorial.summary && (
          <span className="mt-1.5 line-clamp-2 text-sm text-chalk-400">{tutorial.summary}</span>
        )}
        <span className="mt-3 flex flex-wrap gap-1.5 pt-1 text-[11px] text-chalk-500">
          {tutorial.target_muscle && (
            <span className="rounded border border-ink-600 px-1.5 py-0.5 capitalize">
              {tutorial.target_muscle}
            </span>
          )}
          {tutorial.equipment && (
            <span className="rounded border border-ink-600 px-1.5 py-0.5 capitalize">
              {tutorial.equipment.replace('_', ' ')}
            </span>
          )}
          <span className="rounded border border-ink-600 px-1.5 py-0.5">
            {LEVEL_LABELS[tutorial.min_level] ?? tutorial.min_level}+
          </span>
        </span>
      </span>
    </button>
  )
}

function PlayerDialog({ tutorial, onClose }) {
  const dialogRef = useRef(null)
  const src = tutorial ? embedUrl(tutorial) : null

  useEffect(() => {
    if (!tutorial) return undefined
    const onKey = (event) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [tutorial, onClose])

  if (!tutorial) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close video"
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={tutorial.title}
        tabIndex={-1}
        className="relative flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-ink-600 bg-ink-850 focus:outline-none"
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink-600 px-5 py-4">
          <div className="min-w-0">
            <p className="font-display text-[11px] font-semibold uppercase tracking-widest text-brand-500">
              {CATEGORY_LABELS[tutorial.category] ?? tutorial.category}
            </p>
            <h2 className="mt-1 truncate text-xl text-white">{tutorial.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close video"
            className="shrink-0 rounded-lg p-1.5 text-chalk-400 transition hover:bg-ink-700 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="aspect-video w-full shrink-0 bg-black">
          {src ? (
            <iframe
              src={src}
              title={tutorial.title}
              className="size-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            /* A direct MP4 link plays natively — no third-party player needed. */
            <video src={tutorial.video_url} controls playsInline className="size-full">
              <track kind="captions" />
            </video>
          )}
        </div>

        {tutorial.description && (
          <div className="overflow-y-auto px-5 py-4">
            <p className="whitespace-pre-line text-sm leading-relaxed text-chalk-200">
              {tutorial.description}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function FilterChip({ active, children, ...props }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition',
        active
          ? 'border-brand-500 bg-brand-500/10 text-brand-400'
          : 'border-ink-600 bg-ink-850 text-chalk-400 hover:border-ink-500 hover:text-white',
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export default function TutorialsPage() {
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [category, setCategory] = useState(null)
  const [playing, setPlaying] = useState(null)

  // Typing should not fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  const params = useMemo(
    () => ({ ...(debounced && { search: debounced }), ...(category && { category }) }),
    [debounced, category],
  )

  const { data: filters } = useQuery({
    queryKey: keys.tutorialFilters,
    queryFn: api.tutorials.filters,
    staleTime: 10 * 60_000,
  })

  const { data: tutorials, isPending } = useQuery({
    queryKey: keys.tutorials(params),
    queryFn: () => api.tutorials.list(params),
  })

  function open(tutorial) {
    setPlaying(tutorial)
    api.tutorials.recordView(tutorial.id)
  }

  return (
    <>
      <PageHeading
        eyebrow="Coached by video"
        title="Video Tutorials"
        action={
          <div className="relative w-full sm:w-72">
            <Search
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-chalk-500"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search movements or topics"
              aria-label="Search tutorials"
              className="w-full rounded-md border border-ink-600 bg-ink-850 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-chalk-500 focus:border-brand-500 focus:outline-none"
            />
          </div>
        }
      />

      <p className="-mt-2 mb-5 max-w-2xl text-sm text-chalk-400">
        Watch the movement before you load the bar. Every clip is recorded by your coach and
        matched to the exercises in your programme.
      </p>

      {filters?.categories?.length > 0 && (
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <FilterChip active={category === null} onClick={() => setCategory(null)}>
            All
          </FilterChip>
          {filters.categories.map((value) => (
            <FilterChip
              key={value}
              active={category === value}
              onClick={() => setCategory(category === value ? null : value)}
            >
              {CATEGORY_LABELS[value] ?? value}
            </FilterChip>
          ))}
        </div>
      )}

      {isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-72 rounded-xl" />
          ))}
        </div>
      ) : tutorials?.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tutorials.map((tutorial) => (
            <TutorialCard key={tutorial.id} tutorial={tutorial} onOpen={open} />
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={PlayCircle}
            title={debounced || category ? 'Nothing matches that' : 'No tutorials yet'}
            description={
              debounced || category
                ? 'Try a different search, or clear the filters to see the whole library.'
                : 'Your coach is recording these now. Message them if there is a movement you want covered first.'
            }
          />
        </Card>
      )}

      <PlayerDialog tutorial={playing} onClose={() => setPlaying(null)} />
    </>
  )
}