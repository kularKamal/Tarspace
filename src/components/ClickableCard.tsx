import { Card, CardProps } from "@tremor/react"
import { forwardRef } from "react"
import { twMerge } from "tailwind-merge"

export const ClickableCard = forwardRef<HTMLDivElement, CardProps>((props, ref) => {
  const { className = "", ...other } = props
  return <Card className={twMerge("w-full hover:ring transition transition-all", className)} ref={ref} {...other} />
})
