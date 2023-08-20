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

export type EventDoc = {
  type: "event"
  event: string
  timestamp: "2023-06-19T13:01:59.501207"
  run_id: "build:/NOW2@IRSAP/1.8.116/github-actions-926"
  config_id: null
  project: "NOW2@IRSAP"
  version: "1.8.116"
  repository: "https://github.com/irsap-spa/now2"
  stage: null
  target: "config-elasticsearch"
}
