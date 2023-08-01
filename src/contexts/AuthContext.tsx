import { Logger } from "@iotinga/ts-backpack-common"
import React, { createContext, useContext, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { AppContext } from "./AppContext"
import axios from "axios"

const logger = new Logger(`AuthContext.tsx`)

type AuthContextType = {
  signIn: (username: string, password: string) => Promise<boolean>
  signOut: () => Promise<boolean>
}

type AuthContextProviderProps = {
  children?: React.ReactNode
}

export const AuthContext = createContext<AuthContextType>({
  signIn: async () => {
    return false
  },
  signOut: async () => {
    return false
  },
})

export function AuthContextProvider({ children }: AuthContextProviderProps) {
  const { CliAPIClient } = useContext(AppContext)
  const navigate = useNavigate()

  useEffect(() => {
    CliAPIClient.onRequestError(error => {
      logger.warn("An error occurred", error)
      if (error.response?.status === 401) {
        signOut()
      }
    })
  }, [])

  async function signOut(): Promise<boolean> {
    if (await CliAPIClient.signOut()) {
      navigate("/login")
      return true
    }

    return false
  }

  async function signIn(username: string, password: string): Promise<boolean> {
    if (await CliAPIClient.signIn(username, password)) {
      navigate("/")
      return true
    }
    return false
  }

  return (
    <AuthContext.Provider
      value={{
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
