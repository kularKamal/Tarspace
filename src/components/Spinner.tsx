import { CSSProperties } from "react"

export type SpinnerProps = {
  width?: number
  height?: number
}
export function Spinner({ width = 32, height = 32 }: SpinnerProps) {
  const style: CSSProperties = {
    background: "transparent !important",
    width: width,
    height: height,
    borderRadius: "100%",
    border: "2px solid",
    borderBottomColor: "transparent",
    display: "inline-block",
    animationFillMode: "both",
  }

  return <span className="border-tremor-ring text-tremor-brand animate-spin" style={style} />
}
