import { ReactNode } from "react"

export type ContainerProps = {
  className?: string
  children: ReactNode
}
export const Container = ({ className, children }: ContainerProps) => (
  <div className={`max-w-7xl my-0 mx-auto p-8 text-center ${className}`}>{children}</div>
)
