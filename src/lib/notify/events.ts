export const NOTIF_CHANGED_EVENT = "umrahqu:notif-changed"

export function emitNotificationsChanged() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(NOTIF_CHANGED_EVENT))
}

export function onNotificationsChanged(cb: () => void) {
  if (typeof window === "undefined") return () => {}
  window.addEventListener(NOTIF_CHANGED_EVENT, cb)
  return () => window.removeEventListener(NOTIF_CHANGED_EVENT, cb)
}