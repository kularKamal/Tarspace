import { Logger } from "@iotinga/ts-backpack-common"
import axios, { AxiosInstance } from "axios"

const logger = new Logger("CliAPI.ts")

export class CliAPI {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: "http://localhost:5000/api/v1",
    })
  }

  async signIn(username: string, password: string): Promise<boolean> {
    try {
      const response = await this.client.post(`/login`, { username, password })
      if (response.status !== 200) {
        throw new Error(`status is not 200, but ${response.status}`)
      }
    } catch (error) {
      logger.warn("Error while signing in", error)
      return false
    }

    logger.debug("Signed in")
    return true
  }

  async signOut(): Promise<boolean> {
    try {
      const response = await this.client.delete(`/logout`)
      if (response.status !== 200) {
        throw new Error(`status is not 200, but ${response.status}`)
      }
    } catch (error) {
      logger.warn("Error while signing out", error)
      return false
    }

    logger.debug("Signed out")
    return true
  }

  onRequestError(callback: (error: any) => void) {
    this.client.interceptors.response.use(null, callback)
  }
}
