import { RefObject, useEffect, useRef } from "react"

const defaultEvents = ["mousedown", "touchstart"]

export const useClickAway = <El extends HTMLElement>(
  onClickAway: (event: Event) => void,
  ref: RefObject<El> = { current: null },
  events: string[] = defaultEvents
) => {
  const savedCallback = useRef(onClickAway)

  useEffect(() => {
    savedCallback.current = onClickAway
  }, [onClickAway])

  useEffect(() => {
    const handler = (event: Event) => {
      const { current: el } = ref

      if (!el) {
        return
      }

      if (event.target instanceof Node && !el.contains(event.target)) {
        savedCallback.current(event)
      }
    }
    for (const eventName of events) {
      document.addEventListener(eventName, handler)
    }
    return () => {
      for (const eventName of events) {
        document.removeEventListener(eventName, handler)
      }
    }
  }, [events, ref])

  return ref
}
