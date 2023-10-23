import { ReactNode } from "react"

export default function Layout({ children }: { children: ReactNode }) {
  return <div className="max-w-screen p-1 text-center">{children}</div>
}
