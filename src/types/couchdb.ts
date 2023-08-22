import { CouchdbDoc } from "@iotinga/ts-backpack-couchdb-client"

export type ArtifactDoc = CouchdbDoc & {
  type: "artifact"
  build_id: string
  name: string
  project: string
  timestamp: string
  version: string
  uploads: {
    [filename: string]: string
  }
}

export type PublishStep = {
  name: string | null
  type: string
  continue_on_error?: string
  payload: unknown | null
}

export type DeliverableDoc = CouchdbDoc & {
  type: "deliverable"
  timestamp: string
  name: string
  repository: string
  project: string
  build_id: string
  version: string
  artifacts: string[]
  publish: PublishStep[]
}

export type EventDoc = CouchdbDoc & {
  type: "event"
  event: string
  timestamp: string
  run_id: string
  config_id: string | null
  project: string
  version: string
  repository: string
  stage: string
  target: string
}

type SingleEvent = {
  id: string
  timestamp: string
}

export type EventGroup = {
  partialId: string
  start?: SingleEvent
  stop?: SingleEvent
  success?: SingleEvent
  failure?: SingleEvent
}
