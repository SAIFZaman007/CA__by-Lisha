import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { ImagePlus, Send, X } from 'lucide-react'

import { api, errorMessage } from '@/lib/api'
import { keys } from '@/lib/queryClient'
import { useAuth } from '@/store/auth'
import { cn } from '@/lib/utils'
import { Card, Skeleton } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PageHeading } from '@/components/portal/PortalLayout'
import { toast } from '@/components/ui/Toast'

const MAX_ATTACHMENTS = 6
const MAX_MB = 6

/**
 * Images inside a message bubble.
 *
 * One image renders full width; two or more go into a two-column grid. The
 * distinction matters because a single progress photo squeezed into half a
 * bubble is unreadable, which is the entire reason the client sent it.
 */
function Attachments({ attachments }) {
  if (!attachments?.length) return null

  return (
    <div className={cn('mt-2 gap-1.5', attachments.length === 1 ? 'block' : 'grid grid-cols-2')}>
      {attachments.map((attachment) => (
        <a
          key={attachment.id}
          href={attachment.url}
          target="_blank"
          rel="noreferrer"
          className="block overflow-hidden rounded-md"
        >
          <img
            src={attachment.url}
            alt={attachment.original_name || 'Shared photo'}
            width={attachment.width ?? undefined}
            height={attachment.height ?? undefined}
            loading="lazy"
            decoding="async"
            className="w-full object-cover"
          />
        </a>
      ))}
    </div>
  )
}

/**
 * The composer's pending strip.
 *
 * Previews come from `URL.createObjectURL` on the local File, not from the
 * server. The bytes are already in the browser, so a round trip to fetch them
 * back would only add latency to the one moment the client is waiting.
 */
function PendingStrip({ pending, onRemove }) {
  if (!pending.length) return null

  return (
    <div className="flex flex-wrap gap-2 border-t border-ink-700 px-4 pt-3">
      {pending.map((item) => (
        <div key={item.localId} className="relative">
          <img
            src={item.previewUrl}
            alt=""
            className={cn(
              'size-16 rounded-md object-cover',
              item.status === 'uploading' && 'opacity-40',
            )}
          />
          {item.status === 'uploading' && (
            <span className="absolute inset-0 grid place-items-center text-[10px] font-bold text-white">
              {item.progress}%
            </span>
          )}
          <button
            type="button"
            onClick={() => onRemove(item)}
            aria-label="Remove image"
            className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-ink-950 text-chalk-300 ring-1 ring-ink-600 transition hover:text-white"
          >
            <X className="size-3" />
          </button>
        </div>
      ))}
    </div>
  )
}

export default function MessagesPage() {
  const qc = useQueryClient()
  const me = useAuth((s) => s.user)
  const endRef = useRef(null)
  const fileRef = useRef(null)

  // Pending attachments: uploaded to the server but not yet attached to a
  // message. Each carries the local preview URL so the strip renders instantly
  // and the server id so the send can claim it.
  const [pending, setPending] = useState([])

  const { data: thread, isLoading } = useQuery({
    queryKey: keys.thread,
    queryFn: api.messages.thread,
    // Open conversation: poll fast so a reply appears without a reload, and
    // pause while the tab is hidden.
    refetchInterval: 8_000,
    refetchIntervalInBackground: false,
  })

  // Announce a reply that arrived while the page was already open.
  //
  // Seeded from the first render rather than from zero: without that, simply
  // opening a conversation that already had messages would fire a toast for
  // history the client has read many times.
  const seenCount = useRef(null)
  useEffect(() => {
    const messages = thread?.messages ?? []
    if (seenCount.current === null) {
      seenCount.current = messages.length
      return
    }
    if (messages.length > seenCount.current) {
      const arrived = messages.slice(seenCount.current)
      // Our own sent message comes back through the same refetch; only a
      // message from the coach is news.
      if (arrived.some((message) => message.sender_id !== me?.id)) {
        toast.success('New message from Coach Auto')
        qc.invalidateQueries({ queryKey: ['messages', 'unread'] })
      }
    }
    seenCount.current = messages.length
  }, [thread?.messages, me?.id, qc])

  // Object URLs are a real allocation, not a string. Released on unmount so a
  // long session spent sending photos does not hold every one of them in
  // memory until the tab closes.
  useEffect(
    () => () => pending.forEach((item) => URL.revokeObjectURL(item.previewUrl)),
    // Intentionally empty: this is an unmount cleanup, and depending on
    // `pending` would revoke previews the moment the list changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const { register, handleSubmit, reset } = useForm({ defaultValues: { body: '' } })

  function discard(item) {
    URL.revokeObjectURL(item.previewUrl)
    setPending((list) => list.filter((entry) => entry.localId !== item.localId))
    // Best effort. If this fails the row is orphaned, and the server sweeps
    // unbound attachments older than a day — so there is nothing to tell the
    // client about here.
    if (item.id) api.messages.discardAttachment(item.id).catch(() => {})
  }

  async function onFiles(event) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = '' // let the same file be picked twice

    const room = MAX_ATTACHMENTS - pending.length
    if (files.length > room) {
      toast.error(`You can attach up to ${MAX_ATTACHMENTS} images per message.`)
    }

    for (const file of files.slice(0, Math.max(room, 0))) {
      // Checked here as well as on the server. Rejecting a 20 MB photo after
      // it has crawled up a gym connection is not a rejection anyone thanks
      // you for.
      if (file.size > MAX_MB * 1024 * 1024) {
        toast.error(
          `${file.name} is ${(file.size / 1024 / 1024).toFixed(0)} MB — the limit is ${MAX_MB} MB.`,
        )
        continue
      }

      const localId = crypto.randomUUID()
      const previewUrl = URL.createObjectURL(file)
      setPending((list) => [...list, { localId, previewUrl, status: 'uploading', progress: 0 }])

      try {
        const uploaded = await api.messages.uploadAttachment(file, (progress) =>
          setPending((list) =>
            list.map((item) => (item.localId === localId ? { ...item, progress } : item)),
          ),
        )
        setPending((list) =>
          list.map((item) =>
            item.localId === localId ? { ...item, id: uploaded.id, status: 'ready' } : item,
          ),
        )
      } catch (failure) {
        toast.error(errorMessage(failure))
        URL.revokeObjectURL(previewUrl)
        setPending((list) => list.filter((item) => item.localId !== localId))
      }
    }
  }

  const send = useMutation({
    mutationFn: api.messages.send,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.thread })
      qc.invalidateQueries({ queryKey: ['messages', 'unread'] })
      pending.forEach((item) => URL.revokeObjectURL(item.previewUrl))
      setPending([])
      reset()
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  function onSubmit(values) {
    const body = values.body.trim()
    const ready = pending.filter((item) => item.status === 'ready' && item.id)

    if (!body && !ready.length) return
    if (pending.some((item) => item.status === 'uploading')) {
      toast.error('Wait for the images to finish uploading.')
      return
    }
    send.mutate({ body, attachment_ids: ready.map((item) => item.id) })
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread?.messages?.length])

  if (isLoading) return <Skeleton className="h-96 w-full" />

  const messages = thread?.messages ?? []
  const uploading = pending.some((item) => item.status === 'uploading')

  return (
    <>
      <PageHeading eyebrow="Your coach" title="Messages" />

      <Card className="flex h-[70vh] flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto p-5 scrollbar-thin">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="font-display text-lg text-chalk-50">Start the conversation</p>
              <p className="mt-2 max-w-sm text-sm text-chalk-400">
                Ask about your program, your form, or your food — and send a photo if it is
                easier to show than describe. To book a live call instead, use the contact page
                and pick a time.
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const mine = message.sender_id === me?.id
              return (
                <div key={message.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[80%] rounded-lg px-4 py-2.5 sm:max-w-md',
                      mine ? 'bg-brand-500 text-white' : 'bg-ink-700 text-chalk-200',
                    )}
                  >
                    {!mine && (
                      <p className="mb-1 font-display text-[11px] font-bold tracking-widest text-brand-400 uppercase">
                        Coach Auto
                      </p>
                    )}
                    {message.body && (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.body}</p>
                    )}
                    <Attachments attachments={message.attachments} />
                    <time
                      dateTime={message.created_at}
                      className={cn(
                        'mt-1 block text-[11px]',
                        mine ? 'text-white/70' : 'text-chalk-500',
                      )}
                    >
                      {new Date(message.created_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </time>
                  </div>
                </div>
              )
            })
          )}
          <div ref={endRef} />
        </div>

        <PendingStrip pending={pending} onRemove={discard} />

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex items-end gap-2 border-t border-ink-700 p-4"
        >
          <label htmlFor="message-body" className="sr-only">
            Your message
          </label>
          <textarea
            id="message-body"
            rows={2}
            placeholder="Write a message to Coach Auto…"
            className="flex-1 resize-none rounded-md border border-ink-600 bg-ink-850 px-4 py-3 text-sm text-chalk-50 placeholder:text-chalk-500 focus:border-brand-500 focus:outline-none"
            {...register('body')}
          />

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={onFiles}
            className="sr-only"
            aria-hidden="true"
            tabIndex={-1}
          />
          <Button
            type="button"
            variant="subtle"
            onClick={() => fileRef.current?.click()}
            disabled={pending.length >= MAX_ATTACHMENTS}
            aria-label="Attach an image"
            title={
              pending.length >= MAX_ATTACHMENTS
                ? `Up to ${MAX_ATTACHMENTS} images per message`
                : 'Attach an image'
            }
          >
            <ImagePlus className="size-4" />
          </Button>

          <Button
            type="submit"
            loading={send.isPending}
            disabled={uploading}
            aria-label="Send message"
          >
            <Send className="size-4" />
          </Button>
        </form>
      </Card>
    </>
  )
}