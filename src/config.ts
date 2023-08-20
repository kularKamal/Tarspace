export type Config = {
  couchdb: {
    protocol: "http" | "https"
    host: string
    port: number
  }
}

export const DEFAULT_CONFIG: Config = {
  couchdb: {
    protocol: "http",
    host: "localhost",
    port: 5984,
  },
}
