import React, { createContext } from "react"

import { CliAPI } from "clients/CliAPI"
import { CouchdbClient } from "clients/Couchdb"

type AppContextType = {
  CliAPIClient: CliAPI
  CouchdbClient: CouchdbClient
}

const value: AppContextType = {
  CliAPIClient: new CliAPI(),
  CouchdbClient: new CouchdbClient(),
}

export const AppContext = createContext<AppContextType>(value)

type AuthContextProviderProps = {
  children?: React.ReactNode
}

export function AppContextProvider({ children }: AuthContextProviderProps) {
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
