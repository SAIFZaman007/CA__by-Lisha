import { useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Send } from 'lucide-react'

import { api, errorMessage } from '@/lib/api'
import { keys } from '@/lib/queryClient'
import { useAuth } from '@/store/auth'
import { cn } from '@/lib/utils'
import { Card, CardBody, Skeleton } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PageHeading } from '@/components/portal/PortalLayout'
import { toast } from '@/components/ui/Toast'

export default function MessagesPage() {
  const qc = useQueryClient()
  const me = useAuth((s) => s.user)
  const endRef = useRef(null)

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

  const { register, handleSubmit, reset } = useForm({ defaultValues: { body: '' } })

  const send = useMutation({
    mutationFn: api.messages.send,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.thread })
      qc.invalidateQueries({ queryKey: ['messages', 'unread'] })
      reset()
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread?.messages?.length])

  if (isLoading) return <Skeleton className="h-96 w-full" />

  const messages = thread?.messages ?? []

  return (
    <>
      <PageHeading eyebrow="Your coach" title="Messages" />

      <Card className="flex h-[70vh] flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto p-5 scrollbar-thin">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="font-display text-lg text-chalk-50">Start the conversation</p>
              <p className="mt-2 max-w-sm text-sm text-chalk-400">
                Ask about your program, your form, or your food. To book a live call instead, use
                the contact page and pick a time.
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
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.body}</p>
                    <time
                      dateTime={message.created_at}
                      className={cn('mt-1 block text-[11px]', mine ? 'text-white/70' : 'text-chalk-500')}
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

        <form
          onSubmit={handleSubmit((values) => values.body.trim() && send.mutate({ body: values.body }))}
          className="flex items-end gap-3 border-t border-ink-700 p-4"
        >
          <label htmlFor="message-body" className="sr-only">
            Your message
          </label>
          <textarea
            id="message-body"
            rows={2}
            placeholder="Write a message to Coach Auto…"
            className="flex-1 resize-none rounded-md border border-ink-600 bg-ink-850 px-4 py-3 text-sm text-chalk-50 placeholder:text-chalk-500 focus:border-brand-500 focus:outline-none"
            {...register('body', { required: true })}
          />
          <Button type="submit" loading={send.isPending} aria-label="Send message">
            <Send className="size-4" />
          </Button>
        </form>
      </Card>
    </>
  )
}