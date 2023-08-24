import { Card, Flex, SearchSelect, SearchSelectItem } from "@tremor/react"
import { FC, useContext, useEffect, useState } from "react"

import { AppContext, AuthContext } from "contexts"
import { ArtifactDoc } from "types"

export type Artifact = {
  name: string
  url: string
}

export type ArtifactTableProps = { artifacts: string[] }

export const ArtifactsTable: FC<ArtifactTableProps> = props => {
  const { CouchdbManager } = useContext(AppContext)
  const { username } = useContext(AuthContext)

  const dbName = "userdb-" + Buffer.from(username as string).toString("hex")
  const designDoc = username as string

  const [artifacts, setArtifacts] = useState<ArtifactDoc[]>([])
  const [selectedArtifact, setSelectedArtifact] = useState<string | null>(null)
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null)

  useEffect(() => {
    CouchdbManager.db(dbName)
      .design(designDoc)
      .viewQueries("artifacts", {
        queries: props.artifacts.map(a => ({
          reduce: false,
          include_docs: true,
          start_key: ["IRSAP", "NOW2", a],
          end_key: ["IRSAP", "NOW2", a, "\uffff"],
        })),
      })
      .then(resp => {
        setArtifacts(
          resp.results
            .flatMap(q => q.rows)
            .map(row => row.doc)
            .filter(doc => doc !== undefined) as ArtifactDoc[]
        )
      })
  }, [CouchdbManager, dbName, designDoc, props.artifacts])

  return (
    <Card>
      <Flex className="space-x-4" justifyContent="start" alignItems="center">
        <SearchSelect
          value={selectedArtifact || ""}
          onValueChange={value => {
            setSelectedArtifact(value)
            setSelectedVersion(null)
          }}
          placeholder="Customer"
          className="max-w-xs"
        >
          {props.artifacts.map(artifact => (
            <SearchSelectItem key={artifact} value={artifact}>
              {artifact}
            </SearchSelectItem>
          ))}
        </SearchSelect>

        <SearchSelect
          value={selectedVersion || ""}
          onValueChange={value => {
            setSelectedVersion(value)
          }}
          placeholder="Project"
          className="max-w-xs"
          disabled={selectedArtifact === undefined}
        >
          {artifacts
            .filter(doc => doc.name === selectedArtifact)
            .map((doc, index) => (
              <SearchSelectItem key={index} value={doc.version}>
                {doc.version}
              </SearchSelectItem>
            ))}
        </SearchSelect>
      </Flex>
    </Card>
  )
}
