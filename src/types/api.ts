export type CustomersInformations = Array<{
  name: string
  id: string
  number_of_projects: number
}>

export type UserSession = {
  id: number
  username: string
  first_name: string
  last_name: string
  email: string
}

export type CustomerByNameInformations = {
  name: string
  id: string
  projects: Array<{
    name: string
    uri: string
    number_of_deliverables: number
  }>
}

export type ProjectInformations = {
  name: string
  customer: string
  id: string
  deliverables: Array<{
    name: string
    uri: string
    stages: {
      production: {
        current_published_version: string
        last_published_at: string
        download_uri: string
        current_configuration_uri: string
      }
      staging: {
        current_published_version: string
        last_published_at: string
        download_uri: string
        current_configuration_uri: string
      }
      delivery: {
        current_published_version: string
        last_published_at: string
        download_uri: string
        current_configuration_uri: string
      }
    }
    last_build_event: {
      id: string
      outcome: "success" | "failure" | "pending" | "timeout"
      timestamp: string
      type: string
      stage: string
      version: string
      source_code_uri: string
      external_ref: string
      external_ref_uri: string
    }
    repository_uri: string
    project: string
    customer: string
  }>
}

export type DeliverableInformations = {
  name: string
  project: string
  customer: string
  id: string
  stages: {
    production: {
      current_published_version: string
      last_published_at: string
      download_uri: string
      current_configuration_uri: string
    }
    staging: {
      current_published_version: string
      last_published_at: string
      download_uri: string
      current_configuration_uri: string
    }
    delivery: {
      current_published_version: string
      last_published_at: string
      download_uri: string
      current_configuration_uri: string
    }
  }
  can_publish_from_ui: boolean
  latest_build_events: Array<{
    id: string
    outcome: "success" | "failure" | "pending" | "timeout"
    timestamp: string
    type: string
    stage: string
    version: string
    source_code_uri: string
    external_ref: string
    external_ref_uri: string
  }>
  repository_uri: string
}
