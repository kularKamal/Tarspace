import { Logger, deepEquals } from "@iotinga/ts-backpack-common"
import React, { createContext, useContext, useState } from "react"
import axios from "axios"
import { truncate } from "fs"
import { UserSession } from "types/api"

const logger = new Logger("AuthContext")

type AuthContextType = {
  signIn: (username: string, password: string) => Promise<boolean>
  signOut: () => Promise<boolean>
  getSessionInfo: () => Promise<UserSession>
  username?: string
}

type AuthContextProviderProps = {
  children?: React.ReactNode
}

// Risposte predefinite?
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
  const [username, setUsername] = useState<string | undefined>(undefined)

  // Restituisce dati della sessione corrente
  async function getSessionInfo() {
    try {
      const token = localStorage.getItem("token")

      if (!token) {
        throw new Error("Token not found")
      }

      const response = await axios.get<UserSession>("http://localhost:8000/space/api/v1/auth/user/", {
        headers: {
          Authorization: `csrf ${token}`, // Allega token csrf
        },
        withCredentials: true, // Permetti di inviare i cookie
      })

      if (response.status === 200) {
        logger.info("Session informations obtained successfully")
        return response.data
      } else {
        throw new Error("sign in failed")
      }
    } catch (error) {
      logger.error(error)
      throw new Error("Can not access to the session")
    }
  }

  // Restituisce true se login andato bene, false se login andato male
  async function signIn(username: string, password: string): Promise<boolean> {
    // Creo variabile response che prende valore della risposta alla chiamata della funzione API
    try {
      const response = await axios.post("http://127.0.0.1:8000/space/api/v1/auth/login/", {
        username: username,
        password: password,
      })

      // Se la risposta è positiva return true
      if (response.status === 200) {
        const { message, token } = response.data // Estraggo il token dal corpo della risposta
        localStorage.setItem("token", token)

        logger.info("Login successful")
        setUsername(username)

        return true
      }
    } catch (error) {
      // Altrimenti return false
      logger.error("Invalid credentials")
      return false
    }

    return false
  }

  // Restituisce true se logout andato bene, false se logout andato male
  async function signOut(): Promise<boolean> {
    try {
      const token = localStorage.getItem("token")

      if (!token) {
        throw new Error("Token not found")
      }

      const response = await axios.post("http://localhost:8000/space/api/v1/auth/logout/", {
        headers: {
          Authorization: `csrf ${token}`, // Allega token csrf
        },
        withCredentials: true, // Permetti di inviare i cookie
      })

      if (response.status === 200) {
        logger.info("Signed out successfully")
        setUsername(undefined)
        // Rimuovi il token dal localStorage
        localStorage.removeItem("token")
        return true
      }
    } catch (error) {
      logger.error("Logout failed")
      return false
    }

    return false
  }

  return (
    <AuthContext.Provider
      value={{
        signIn,
        signOut,
        username,
        getSessionInfo,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
