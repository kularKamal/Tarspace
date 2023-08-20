import { CouchdbAuthMethod, CouchdbConnectionParams, CouchdbManager } from "@iotinga/ts-backpack-couchdb-client"
import React, { createContext } from "react"

import { CliAPI } from "api/CliAPI"
import { DEFAULT_CONFIG } from "config"

type AppContextType = {
  CliAPIClient: CliAPI
  CouchdbManager: CouchdbManager
  CouchdbParams: CouchdbConnectionParams
}

const connectionParams: CouchdbConnectionParams = {
  protocol: DEFAULT_CONFIG.couchdb.protocol,
  host: DEFAULT_CONFIG.couchdb.host,
  port: DEFAULT_CONFIG.couchdb.port,
  authMethod: CouchdbAuthMethod.COOKIE_RFC2109,
}

function createManager(connectionParams: CouchdbConnectionParams) {
  return new CouchdbManager(connectionParams)
}

const value: AppContextType = {
  CliAPIClient: new CliAPI(),
  CouchdbManager: createManager(connectionParams),
  CouchdbParams: connectionParams,
}

export const AppContext = createContext<AppContextType>(value)

type AuthContextProviderProps = {
  children?: React.ReactNode
}

export function AppContextProvider({ children }: AuthContextProviderProps) {
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
