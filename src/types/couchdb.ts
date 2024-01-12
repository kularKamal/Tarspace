import { CouchdbDoc, CouchdbDocAttachment } from "@iotinga/ts-backpack-couchdb-client"

export type CouchdbAttachmentsWithExclusiveUnion = {
  [x: string]: ExclusiveUnion<CouchdbDocAttachment>
}

type DistributedKeyOf<T> = T extends object ? keyof T : never

type CreateExclusiveUnion<T, U = T> = T extends object
  ? T & Partial<Record<Exclude<DistributedKeyOf<U>, keyof T>, never>>
  : never

export type ExclusiveUnion<T> = CreateExclusiveUnion<T>

export type CompanyLogDoc = ArtifactDoc | ConfigurationDoc | DeliverableDoc | EventDoc

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

export type ConfigurationDoc = CouchdbDoc & {
  type: "configuration"
  project: string
  deliverable: string
  stage: string
  timestamp: string
  configuration: string | null
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
  uploads?: Record<string, string>
  docs?: string
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

export type SingleEvent = {
  id: string
  timestamp: string
}

export type EventOperation = "build" | "publish"

export type EventGroup = {
  partialId: string
  type: EventOperation
  version: string
  repository?: string
  stage?: string | null
  start?: SingleEvent
  success?: SingleEvent
  failure?: SingleEvent
}
