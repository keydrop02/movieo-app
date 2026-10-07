export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export interface InstallState {
  available: boolean
  installed: boolean
}

type Listener = () => void

let deferred: BeforeInstallPromptEvent | null = null
let installed = false
let snapshot: InstallState = { available: false, installed: false }

const listeners = new Set<Listener>()

function update(next: InstallState) {
  if (next.available === snapshot.available && next.installed === snapshot.installed) return
  snapshot = next
  for (const listener of listeners) listener()
}

if (typeof window !== "undefined") {
  // A standalone launch means the app is already installed; Chrome will never
  // fire `beforeinstallprompt` in that case, so mirror it into the state.
  const standalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  if (standalone) {
    installed = true
    snapshot = { available: false, installed: true }
  }

  // Captured at module scope, not inside a component effect: Chrome fires this
  // once per load and a route-level component (settings) may not be mounted yet.
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault()
    deferred = event as BeforeInstallPromptEvent
    update({ available: true, installed })
  })
  window.addEventListener("appinstalled", () => {
    deferred = null
    installed = true
    update({ available: false, installed: true })
  })
}

export function getInstallState(): InstallState {
  return snapshot
}

export function subscribeInstall(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export async function promptInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  const event = deferred
  if (!event) return "unavailable"
  // The prompt event is single-use, so drop it before awaiting the choice.
  deferred = null
  update({ available: false, installed })
  try {
    await event.prompt()
    const { outcome } = await event.userChoice
    if (outcome === "accepted") {
      installed = true
      update({ available: false, installed: true })
    }
    return outcome
  } catch {
    return "unavailable"
  }
}