import { useState } from "react"

export type ModalToggler = (show?: boolean) => void

export type ModalController = {
  isShowing: boolean
  toggle: ModalToggler
}

export function useModal(): ModalController {
  const [isShowing, setIsShowing] = useState(false)

  const toggle: ModalToggler = (show?: boolean) => setIsShowing(show ? show : !isShowing)

  return { isShowing, toggle }
}
