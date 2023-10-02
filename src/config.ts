import { Duration } from "luxon"

export type Config = {
  app: {
    eventTimeout: Duration
    forceLocale?: string
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
    forceLocale: "it-IT",
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
    forceLocale: "it-IT",
  },
  couchdb: {
    protocol: "https",
    host: "couchdb.tinga.io",
    port: 443,
  },
}

export const Configuration =
  process.env.NODE_ENV === "production" || process.env.REACT_APP_CONFIG_OVERRIDE === "production"
    ? PRODUCTION_CONFIG
    : DEFAULT_CONFIG
