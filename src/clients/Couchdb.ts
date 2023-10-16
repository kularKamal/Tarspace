import { CouchdbAuthMethod, CouchdbConnectionParams, CouchdbManager } from "@iotinga/ts-backpack-couchdb-client"

import { Configuration } from "config"

const defaultConnectionParams: CouchdbConnectionParams = {
  protocol: Configuration.couchdb.protocol,
  host: Configuration.couchdb.host,
  port: Configuration.couchdb.port,
  authMethod: CouchdbAuthMethod.COOKIE_RFC2109,
}

export class CouchdbClient extends CouchdbManager {
  constructor(public connectionParams = defaultConnectionParams) {
    super(connectionParams)
  }
}
