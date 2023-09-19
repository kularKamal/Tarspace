import { prepareDesignDoc } from "@iotinga/ts-backpack-couchdb-client"
import { promises } from "fs"
import path from "path"
import { find } from "./project-root.mjs"

const ROOT = find().next().directory
const OUTPUT_FILE = path.join(ROOT, "src", "design-doc.json")

const artifactsMap = function (doc) {
  if (doc.type === "artifact") {
    const [project, customer] = doc.project.split("@")
    emit([customer, project, doc.name, doc.version], { _id: doc._id })
  }
}

const configurationMap = function (doc) {
  if (doc.type === "configuration") {
    const [project, customer] = doc.project.split("@")
    emit([customer, project, doc.deliverable, doc.stage], { _id: doc._id })
  }
}

const configurationLatestMap = function (doc) {
  if (doc.type === "configuration") {
    const [project, customer] = doc.project.split("@")
    emit([customer, project, doc.deliverable, doc.stage], { _id: doc._id, timestamp: doc.timestamp })
  }
}

const configurationLatestReduce = function (keys, values, rereduce) {
  let latest = {}
  let latest_date = new Date(0)

  for (let i = 0; i < values.length; i++) {
    const dt = new Date(values[i].timestamp)
    if (dt >= latest_date) {
      latest_date = dt
      latest = values[i]
    }
  }
  return latest
}

const deliverablesMap = function (doc) {
  if (doc.type === "deliverable") {
    const [project, customer] = doc.project.split("@")
    emit([customer, project, doc.name, doc.version], { _id: doc._id })
  }
}

const deliverablesSearchMap = function (doc) {
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

const deliverablesSearchReduce = function (keys, values, rereduce) {
  const out = {}
  values.forEach(v => {
    Object.assign(out, v)
  })
  return out
}

const eventsMap = function (doc) {
  if (doc.type === "event") {
    const [project, customer] = doc.project.split("@")

    emit([customer, project, doc.target, ...doc.version.split(".")], doc)
  }
}

const eventsBuildMap = function (doc) {
  if (doc.type === "event" && doc.stage === null) {
    const [project, customer] = doc.project.split("@")
    emit([customer, project, doc.target, doc.timestamp], 1)
  }
}

const eventsPublishMap = function (doc) {
  if (doc.type === "event" && doc.stage && doc.event !== "start") {
    const [project, customer] = doc.project.split("@")
    emit([customer, project, doc.target, doc.stage, doc.timestamp], doc.event.toUpperCase())
  }
}

const groupedEventsMap = function (doc) {
  if (doc.type === "event" && doc._id) {
    const [project, customer] = doc.project.split("@")
    const partialId = doc._id.substring(0, doc._id.lastIndexOf("/"))
    emit([customer, project, doc.target, partialId], doc)
  }
}

const groupedEventsReduce = function (keys, values, rereduce) {
  if (!rereduce) {
    const out = {}

    values.forEach(v => {
      if (!v._id) {
        return out
      }

      out[v.event] = {
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

const latestPublishedVersionMap = function (doc) {
  if (doc.type === "event" && doc.event === "success" && doc.stage) {
    const [project, customer] = doc.project.split("@")
    emit([customer, project, doc.target, doc.stage], doc.version)
  }
}

const latestPublishedVersionReduce = function (keys, values, rereduce) {
  // From https://gist.github.com/iwill/a83038623ba4fef6abb9efca87ae9ccb\nfunction
  function semverCompare(a, b) {
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
    if (semverCompare(current, latest) > 0) {
      latest = current
    }
  }

  return latest
}

const DESIGN_DOC_BODY = {
  name: "TEMPLATE",
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

/* eslint-disable no-console */
async function writeJson() {
  const doc = prepareDesignDoc(DESIGN_DOC_BODY)
  await promises.writeFile(OUTPUT_FILE, JSON.stringify(doc), { flag: "w+", encoding: "utf-8" })
  console.log(`Wrote to '${OUTPUT_FILE}'`)
}

writeJson()
