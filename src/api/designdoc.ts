import { CouchdbDesignDocDefinition } from "@iotinga/ts-backpack-couchdb-client"
import { CompanyLogDoc, ConfigurationDoc, EventDoc, EventGroup } from "types"

declare function emit(args: unknown, value: unknown): void

export function designDocIdFor(username: string) {
  return `_design/${username}`
}

export function createDesignDoc(username: string): CouchdbDesignDocDefinition<CompanyLogDoc> {
  return {
    name: username,
    language: "javascript",
    views: {
      artifacts: {
        map: artifactsMap,
      },
      configurations: {
        map: configurationMap,
      },
      "configurations-latest": {
        map: configurationLatestMap,
        reduce: configurationLatestReduce,
      },
      deliverables: {
        map: deliverablesMap,
        reduce: "_count",
      },
      "deliverables-search": {
        map: deliverablesSearchMap,
        reduce: deliverablesSearchReduce,
      },
      events: {
        map: eventsMap,
        reduce: "_count",
      },
      "events-build": {
        map: eventsBuildMap,
        reduce: "_count",
      },
      "events-publish": {
        map: eventsPublishMap,
        reduce: "_count",
      },
      "grouped-events": {
        map: groupedEventsMap,
        reduce: groupedEventsReduce,
      },
      "latest-published-version": {
        map: latestPublishedVersionMap,
        reduce: latestPublishedVersionReduce,
      },
    },
  }
}

const artifactsMap = function (doc: CompanyLogDoc) {
  if (doc.type === "artifact") {
    const [project, customer] = doc.project.split("@")
    emit([customer, project, doc.name, doc.version], { _id: doc._id })
  }
}

const configurationMap = function (doc: CompanyLogDoc) {
  if (doc.type === "configuration") {
    const [project, customer] = doc.project.split("@")
    emit([customer, project, doc.deliverable, doc.stage], { _id: doc._id })
  }
}

const configurationLatestMap = function (doc: CompanyLogDoc) {
  if (doc.type === "configuration") {
    const [project, customer] = doc.project.split("@")
    emit([customer, project, doc.deliverable, doc.stage], { _id: doc._id, timestamp: doc.timestamp })
  }
}

const configurationLatestReduce = function (keys: unknown[], values: unknown[], rereduce: boolean) {
  let latest = {}
  let latest_date = new Date(0)

  for (let i = 0; i < values.length; i++) {
    const dt = new Date((values[i] as ConfigurationDoc).timestamp)
    if (dt >= latest_date) {
      latest_date = dt
      latest = values[i] as ConfigurationDoc
    }
  }
  return latest
}

const deliverablesMap = function (doc: CompanyLogDoc) {
  if (doc.type === "deliverable") {
    const [project, customer] = doc.project.split("@")
    emit([customer, project, doc.name, doc.version], { _id: doc._id })
  }
}

const deliverablesSearchMap = function (doc: CompanyLogDoc) {
  if (doc.type === "deliverable") {
    const [project, customer] = doc.project.split("@")
    emit([customer, project, doc.name], {
      slug: `${project}/${customer}/${doc.name}`,
      name: doc.name,
      artifacts: doc.artifacts,
      repository: doc.repository,
      project: doc.project,
    })
  }
}

const deliverablesSearchReduce = function (keys: unknown[], values: unknown[], rereduce: boolean) {
  const out = {}
  values.forEach(v => {
    Object.assign(out, v)
  })
  return out
}

const eventsMap = function (doc: CompanyLogDoc) {
  if (doc.type === "event") {
    const [project, customer] = doc.project.split("@")

    emit([customer, project, doc.target, ...doc.version.split(".")], doc)
  }
}

const eventsBuildMap = function (doc: CompanyLogDoc) {
  if (doc.type === "event" && doc.stage === null) {
    const [project, customer] = doc.project.split("@")
    emit([customer, project, doc.target, doc.timestamp], 1)
  }
}

const eventsPublishMap = function (doc: CompanyLogDoc) {
  if (doc.type === "event" && doc.stage && doc.event !== "start") {
    const [project, customer] = doc.project.split("@")
    emit([customer, project, doc.target, doc.stage, doc.timestamp], doc.event.toUpperCase())
  }
}

const groupedEventsMap = function (doc: CompanyLogDoc) {
  if (doc.type === "event" && doc._id) {
    const [project, customer] = doc.project.split("@")
    const partialId = doc._id.substring(0, doc._id.lastIndexOf("/"))
    emit([customer, project, doc.target, partialId], doc)
  }
}

const groupedEventsReduce = function (keys: unknown[], values: unknown[], rereduce: boolean) {
  if (!rereduce) {
    const out: Partial<EventGroup> = {}

    const values_cast = values as EventDoc[]
    values_cast.forEach((v: EventDoc) => {
      if (!v._id) {
        return out
      }

      out[v.event as "start" | "success" | "failure"] = {
        id: v._id,
        timestamp: v.timestamp,
      }
      out.type = v.stage ? "publish" : "build"
      out.stage = v.stage
      out.version = v.version
      out.repository = v.repository
    })
    return out
  }

  const out = {}
  values.forEach(v => {
    Object.assign(out, v)
  })
  return out
}

const latestPublishedVersionMap = function (doc: CompanyLogDoc) {
  if (doc.type === "event" && doc.event === "success" && doc.stage) {
    const [project, customer] = doc.project.split("@")
    emit([customer, project, doc.target, doc.stage], doc.version)
  }
}

const latestPublishedVersionReduce = function (keys: unknown[], values: unknown[], rereduce: boolean) {
  // From https://gist.github.com/iwill/a83038623ba4fef6abb9efca87ae9ccb\nfunction
  function semverCompare(a: string, b: string) {
    if (a.startsWith(b + "-")) {
      return -1
    }
    if (b.startsWith(a + "-")) {
      return 1
    }
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: "case", caseFirst: "upper" })
  }

  let latest = "0.0.0"
  for (let i = 0; i < values.length; i++) {
    if (typeof values[i] !== "string") {
      continue
    }

    const current = values[i]
    if (semverCompare(current as string, latest) > 0) {
      latest = current as string
    }
  }

  return latest
}
