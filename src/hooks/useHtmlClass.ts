import { useEffect } from "react"

const addBodyClass = (className: string) => document.documentElement.classList.add(className)
const removeBodyClass = (className: string) => document.documentElement.classList.remove(className)

export function useHtmlClass(className: string | string[]) {
  useEffect(() => {
    className instanceof Array ? className.map(addBodyClass) : addBodyClass(className)

    return () => {
      className instanceof Array ? className.map(removeBodyClass) : removeBodyClass(className)
    }
  }, [className])
}
