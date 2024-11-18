import { useHtmlClass } from "hooks"
import React, { createContext } from "react"
import { useDarkMode } from "usehooks-ts"

type AppContextType = {}

const value: AppContextType = {}

export const AppContext = createContext<AppContextType>(value)

type AuthContextProviderProps = {
  children?: React.ReactNode
}

export function AppContextProvider({ children }: AuthContextProviderProps) {
  const { isDarkMode } = useDarkMode()

  useHtmlClass(isDarkMode ? "dark" : "light")

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
