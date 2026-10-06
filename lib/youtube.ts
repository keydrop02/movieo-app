declare global {
  interface Window {
    YT: {
      Player: new (div: HTMLElement, opts: Record<string, unknown>) => {
        mute: () => void
        unMute: () => void
        destroy: () => void
        getIframe: () => HTMLIFrameElement
        onError?: (e: { data?: number }) => void
      }
    }
    onYouTubeIframeAPIReady: () => void
  }
}

let ytApiPromise: Promise<void> | null = null

/** How long to wait for the iframe API before giving up and reporting failure. */
const YT_API_TIMEOUT_MS = 10_000

export function loadYtApi(): Promise<void> {
  if (ytApiPromise) return ytApiPromise

  ytApiPromise = new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") return resolve()
    if (window.YT?.Player) return resolve()

    // An ad blocker, a privacy browser, or a locked-down network can stop the
    // script from ever calling back. Without a deadline the cached promise would
    // never settle and every caller would hang on a spinner indefinitely.
    const timer = setTimeout(() => {
      cleanup()
      reject(new Error("youtube-api-timeout"))
    }, YT_API_TIMEOUT_MS)

    const previous = window.onYouTubeIframeAPIReady
    function cleanup() {
      clearTimeout(timer)
      if (window.onYouTubeIframeAPIReady === handleReady) {
        window.onYouTubeIframeAPIReady = previous
      }
    }
    function handleReady() {
      // Chain rather than replace, so we do not clobber a handler that another
      // part of the page already installed.
      if (typeof previous === "function") previous()
      cleanup()
      resolve()
    }

    const tag = document.createElement("script")
    tag.src = "https://www.youtube.com/iframe_api"
    tag.async = true
    tag.onerror = () => {
      cleanup()
      reject(new Error("youtube-api-load-failed"))
    }
    document.head.appendChild(tag)
    window.onYouTubeIframeAPIReady = handleReady
  })

  // A failed load must not be cached, or every later attempt reuses the
  // rejection forever with no way to retry.
  ytApiPromise.catch(() => {
    ytApiPromise = null
  })

  return ytApiPromise
}