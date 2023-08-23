import { Logger } from "@iotinga/ts-backpack-common"
import {
  CouchdbAuthMethod,
  CouchdbConnectionParams,
  CouchdbManager,
  CouchdbSessionInfo,
  CouchdbUserCtx,
} from "@iotinga/ts-backpack-couchdb-client"
import React, { createContext, useContext, useEffect, useMemo, useState } from "react"

import { AppContext } from "contexts/AppContext"

const logger = new Logger("AuthContext")

type AuthContextType = {
  signIn: (username: string, password: string) => Promise<boolean>
  signOut: () => Promise<boolean>
  getSessionInfo: () => Promise<CouchdbSessionInfo>
  userDb?: string
  username?: string
}

type AuthContextProviderProps = {
  children?: React.ReactNode
}

export const AuthContext = createContext<AuthContextType>({
  signIn: async (username: string, password: string) => {
    return false
  },
  signOut: async () => {
    return false
  },
  getSessionInfo: async () => {
    throw Error
  },
})

export function AuthContextProvider({ children }: AuthContextProviderProps) {
  const { CouchdbParams, CouchdbManager: manager } = useContext(AppContext)

  const [userDb, setUserDb] = useState<string | undefined>(undefined)
  const [username, setUsername] = useState<string | undefined>(undefined)

  async function getSessionInfo() {
    return new CouchdbManager(CouchdbParams).sessionInfo().then(resp => {
      if (resp.userCtx?.name) {
        setUsername(resp.userCtx?.name)
        setUserDb(usernameToDbName(resp.userCtx?.name))
      }
      return resp
    })
  }

  async function signIn(username: string, password: string) {
    return manager
      .signIn(username, password)
      .then(resp => {
        setUserDb(usernameToDbName(resp.name))
        setUsername(username)
      })
      .then(
        _ => {
          return true
        },
        err => {
          logger.error(err)
          return false
        }
      )
  }

  function usernameToDbName(name: string) {
    return "userdb-" + Buffer.from(name).toString("hex")
  }

  async function signOut() {
    return manager.signOut().then(
      _ => {
        return true
      },
      err => {
        logger.error(err)
        return false
      }
    )
  }

  return (
    <AuthContext.Provider
      value={{
        signIn,
        signOut,
        userDb,
        username,
        getSessionInfo,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
