import { ReactElement } from "react"
import { createPortal } from "react-dom"

import { usePortal } from "hooks/usePortal"

export type PortalProps = {
  id?: string
  children: ReactElement
}

export function Portal({ id, children }: PortalProps) {
  const target = usePortal(id)
  return createPortal(children, target)
}
