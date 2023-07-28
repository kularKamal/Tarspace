import React, { createContext } from "react"
import { CliAPI } from "../api/CliAPI"

type AppContextType = {
  CliAPIClient: CliAPI
}

type AuthContextProviderProps = {
  children?: React.ReactNode
}

export const AppContext = createContext<AppContextType>({
  CliAPIClient: new CliAPI(),
})

export function AppContextProvider({ children }: AuthContextProviderProps) {
  return (
    <AppContext.Provider
      value={{
        CliAPIClient: new CliAPI(),
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
