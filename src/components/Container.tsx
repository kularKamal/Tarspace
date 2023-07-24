import { PropsWithChildren } from "react"

const Container = (props: PropsWithChildren<{ className?: string }>) => (
  <div className={`max-w-7xl my-0 mx-auto p-8 text-center ${props.className}`}>{props.children}</div>
)

export default Container
