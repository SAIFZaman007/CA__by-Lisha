import { useQuery } from '@tanstack/react-query'
import { Star } from 'lucide-react'
import { Section, SectionHeading, motion, fadeUp } from '@/components/ui/Section'
import { Skeleton } from '@/components/ui/Card'
import { api } from '@/lib/api'
import { keys } from '@/lib/queryClient'

export function Results() {
  const { data: testimonials, isLoading } = useQuery({
    queryKey: keys.testimonials,
    queryFn: api.site.testimonials,
  })

  return (
    <Section id="results">
      <SectionHeading
        eyebrow="Client results"
        title="What the work looks like"
        description="Names shortened at their request. Every figure comes from their own logged check-ins."
      />

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {isLoading
          ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-56" />)
          : testimonials?.map((item) => (
              <motion.figure
                key={item.id}
                variants={fadeUp}
                className="flex flex-col rounded-xl border border-ink-600 bg-ink-800 p-6"
              >
                <div className="flex gap-0.5" aria-label={`${item.rating} out of 5`}>
                  {Array.from({ length: item.rating }).map((_, i) => (
                    <Star key={i} className="size-3.5 fill-brand-500 text-brand-500" aria-hidden="true" />
                  ))}
                </div>
                <blockquote className="mt-4 grow text-sm leading-relaxed text-chalk-200">
                  “{item.quote}”
                </blockquote>
                <figcaption className="mt-6 flex items-end justify-between border-t border-ink-600 pt-4">
                  <div>
                    <p className="text-sm font-medium text-white">{item.client_name}</p>
                    <p className="text-xs text-chalk-500">
                      {item.level_label}
                      {item.weeks_in ? ` · week ${item.weeks_in}` : ''}
                    </p>
                  </div>
                  {item.result_metric && (
                    <p className="font-display text-lg font-bold text-brand-500">
                      {item.result_metric}
                    </p>
                  )}
                </figcaption>
              </motion.figure>
            ))}
      </div>
    </Section>
  )
}
