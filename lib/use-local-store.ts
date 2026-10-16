"use client"

import { useCallback, useMemo, useSyncExternalStore } from "react"

/**
 * Keys written by this app. A cross-tab `storage` event for anything under this
 * prefix (or `null`, which is a `clear()`) invalidates every subscribed store.
 */
const STORAGE_PREFIX = "movieo:"

type Store<T> = {
  get: () => T
  subscribe: (listener: () => void) => () => void
  invalidate: () => void
}

function createStore<T>(
  read: () => T,
  subscribeExternal?: (onChange: () => void) => () => void,
): Store<T> {
  let cached: T
  let hasValue = false
  const listeners = new Set<() => void>()

  // Cache the result so the snapshot is referentially stable between reads.
  // Without this, `useSyncExternalStore` would loop forever on a fresh array.
  const get = (): T => {
    if (!hasValue) {
      cached = read()
      hasValue = true
    }
    return cached
  }

  const invalidate = () => {
    hasValue = false
    for (const listener of listeners) listener()
  }

  const subscribe = (listener: () => void) => {
    listeners.add(listener)
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key.startsWith(STORAGE_PREFIX)) invalidate()
    }
    window.addEventListener("storage", onStorage)
    const unsubscribeExternal = subscribeExternal?.(invalidate)
    return () => {
      listeners.delete(listener)
      window.removeEventListener("storage", onStorage)
      unsubscribeExternal?.()
    }
  }

  return { get, subscribe, invalidate }
}

/**
 * Read a synchronous client-only store (localStorage, module state) without a
 * hydration mismatch. `useSyncExternalStore` renders `serverValue` on the
 * server, then re-reads on the client so both trees match on first paint.
 *
 * Pass `subscribeExternal` for same-tab writes that don't fire a `storage`
 * event; otherwise call the returned `invalidate` after mutating the source.
 */
export function useStoredValue<T>(
  read: () => T,
  serverValue: T,
  subscribeExternal?: (onChange: () => void) => () => void,
): [T, () => void] {
  const store = useMemo(() => createStore(read, subscribeExternal), [read, subscribeExternal])
  const getServerSnapshot = useCallback(() => serverValue, [serverValue])
  const value = useSyncExternalStore(store.subscribe, store.get, getServerSnapshot)
  return [value, store.invalidate]
}
