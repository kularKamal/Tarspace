import { Card, CardProps } from "@tremor/react"
import { forwardRef } from "react"

export const ClickableCard = forwardRef<HTMLDivElement, CardProps>((props, ref) => {
  const { className = "", ...other } = props
  return <Card className="w-full hover:ring transition transition-all" ref={ref} {...other} />
})
