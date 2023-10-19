import { forwardRef } from "react"

export type ScreenOverlayProps = {
  zIndex?: number
}

export const ScreenOverlay = forwardRef<HTMLDivElement, ScreenOverlayProps>(({ zIndex = 20 }, forwardedRef) => (
  <div
    className="w-full h-full fixed inset-0 bg-tremor-background-emphasis/25 backdrop-blur"
    aria-hidden
    style={{
      zIndex: zIndex,
    }}
    ref={forwardedRef}
  />
))
