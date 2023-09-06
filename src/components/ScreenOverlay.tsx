export type ScreenOverlayProps = {
  zIndex?: number
}

export const ScreenOverlay = ({ zIndex = 30 }: ScreenOverlayProps) => (
  <div
    className="w-full h-full fixed top-0 left-0 pointer-events-none bg-black opacity-30"
    style={{ zIndex: zIndex }}
  />
)
