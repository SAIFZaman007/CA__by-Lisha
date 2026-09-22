import { createElement, lazy, useState } from 'react'

const RELOAD_FLAG = 'ca:chunk-reloaded'

const isChunkError = (error) =>
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError/i.test(
    error?.message ?? '',
  )

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function loadWithRetry(factory) {
  try {
    return await factory()
  } catch (first) {
    if (!isChunkError(first)) throw first

    await wait(350)
    try {
      return await factory()
    } catch (second) {
      let alreadyReloaded
      try {
        alreadyReloaded = sessionStorage.getItem(RELOAD_FLAG) === '1'
        sessionStorage.setItem(RELOAD_FLAG, '1')
      } catch {
        throw second
      }

      if (alreadyReloaded) throw second

      window.location.reload()
      return await new Promise(() => {})
    }
  }
}

/**
 * `React.lazy` with chunk-error recovery and a `preload()` hook.
 *
 * Once the chunk has loaded (via `preload()`, or a previous render), the
 * component renders the module directly — no Suspense, no async step. That
 * is what lets a prerendered page hydrate in a single pass: main.jsx
 * preloads the landing route before calling hydrateRoot. Without it, the
 * route's Suspense boundary would stay dehydrated while its chunk downloads,
 * and any state update in that window (the silent session check, for one)
 * makes React discard the server HTML and render the page again from
 * scratch — a visible flash and a wasted prerender.
 */
export function lazyWithRetry(factory) {
  let module = null
  let pending = null

  const load = () => {
    pending ??= loadWithRetry(factory).then((loaded) => {
      module = loaded
      return loaded
    })
    return pending
  }

  const LazyComponent = lazy(load)

  function RouteComponent(props) {
    // Decided once per mount, so a later re-render never swaps the element
    // type (which would remount the page and throw away its state).
    const [ready] = useState(() => module)
    return ready ? createElement(ready.default, props) : createElement(LazyComponent, props)
  }
  RouteComponent.preload = load
  return RouteComponent
}

export function clearChunkReloadFlag() {
  try {
    sessionStorage.removeItem(RELOAD_FLAG)
  } catch {
    /* nothing to clear */
  }
}