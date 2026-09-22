import { StrictMode } from 'react'
import { prerenderToNodeStream } from 'react-dom/static'
import { StaticRouter } from 'react-router'
import { QueryClient, QueryClientProvider, dehydrate } from '@tanstack/react-query'
import { LazyMotion, domAnimation } from 'motion/react'

import App from './App.jsx'
import { http } from '@/lib/api'
import { collectedSeo } from '@/lib/seo'

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
  })
}

function tree(url, client) {
  return (
    <StrictMode>
      <QueryClientProvider client={client}>
        <LazyMotion features={domAnimation} strict>
          <StaticRouter location={url}>
            <App />
          </StaticRouter>
        </LazyMotion>
      </QueryClientProvider>
    </StrictMode>
  )
}

async function toHtml(node) {
  const { prelude } = await prerenderToNodeStream(node)
  let html = ''
  for await (const chunk of prelude) html += chunk
  return html
}

/**
 * @param {string} url      Route path, e.g. "/programs".
 * @param {object} options
 * @param {string} options.apiBaseUrl  Absolute API base, e.g. https://site/api/v1.
 * @returns {Promise<{html: string, seo: object|null, state: object, failedQueries: string[]}>}
 */
export async function render(url, { apiBaseUrl }) {
  http.defaults.baseURL = apiBaseUrl
  http.defaults.timeout = 8000

  const client = makeClient()

  // Pass 1: discover which queries this route uses.
  await toHtml(tree(url, client))
  const queries = client.getQueryCache().getAll()
  await Promise.allSettled(queries.map((query) => query.fetch()))

  // Anything that failed is dropped, so the page renders its normal loading
  // state rather than baking an error message into static HTML.
  const failedQueries = []
  for (const query of client.getQueryCache().getAll()) {
    if (query.state.status !== 'success') {
      failedQueries.push(JSON.stringify(query.queryKey))
      client.getQueryCache().remove(query)
    }
  }

  // Pass 2: the real HTML, with data.
  collectedSeo.current = null
  const html = await toHtml(tree(url, client))

  return {
    html,
    seo: collectedSeo.current,
    state: dehydrate(client),
    failedQueries,
  }
}