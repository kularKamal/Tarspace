import { Duration } from "luxon"

export type Config = {
  app: {
    event_timeout: Duration
  }
  couchdb: {
    protocol: "http" | "https"
    host: string
    port: number
  }
}

export const DEFAULT_CONFIG: Config = {
  app: {
    event_timeout: Duration.fromObject({ days: 1 }),
  },
  couchdb: {
    protocol: "http",
    host: "localhost",
    port: 5984,
  },
}

export const Configuration = DEFAULT_CONFIG
