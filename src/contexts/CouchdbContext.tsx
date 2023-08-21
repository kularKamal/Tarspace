import { Logger } from "@iotinga/ts-backpack-common"
import { Couchdb, CouchdbSessionInfo } from "@iotinga/ts-backpack-couchdb-client"
import React, { createContext, useContext, useEffect, useState } from "react"

import { AppContext } from "contexts/AppContext"
import { AuthContext } from "contexts/AuthContext"

const logger = new Logger("AuthContext")

type CouchdbContextType = {
  db?: Couchdb
}

type CouchdbContextProviderProps = {
  children?: React.ReactNode
}

export const CouchdbContext = createContext<CouchdbContextType>({
  db: undefined,
})

export function CouchdbContextProvider({ children }: CouchdbContextProviderProps) {
  const { CouchdbParams } = useContext(AppContext)
  const { userDb } = useContext(AuthContext)

  let db: Couchdb | undefined
  if (userDb !== undefined) {
    db = new Couchdb(CouchdbParams, userDb)
  }

  return (
    <CouchdbContext.Provider
      value={{
        db: db,
      }}
    >
      {children}
    </CouchdbContext.Provider>
  )
}
