import { Duration } from "luxon"

export type Config = {
  app: {
    eventTimeout: Duration
  }
  couchdb: {
    protocol: "http" | "https"
    host: string
    port: number
  }
}

export const DEFAULT_CONFIG: Config = {
  app: {
    eventTimeout: Duration.fromObject({ days: 1 }),
  },
  couchdb: {
    protocol: "http",
    host: "localhost",
    port: 5984,
  },
}

export const PRODUCTION_CONFIG: Config = {
  app: {
    eventTimeout: Duration.fromObject({ days: 1 }),
  },
  couchdb: {
    protocol: "http",
    host: "couchdb.tinga.io",
    port: 80,
  },
}

export const Configuration = process.env.NODE_ENV === "production" ? PRODUCTION_CONFIG : DEFAULT_CONFIG
