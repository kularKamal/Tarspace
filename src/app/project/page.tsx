import { Badge, Card, Flex, Grid, Table, TableBody, TableCell, TableRow, Text, Title } from "@tremor/react"
import { useContext, useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { EventState, EventStateBadges, PageHeading } from "components"
import { AppContext, AuthContext } from "contexts"
import { EventDoc, StageInfoMap } from "types"
import { formatTimestamp, isStageName, titlecase } from "utils"

type LastBuildState = Record<string, [EventState, string]>

function Page() {
  const { CouchdbManager } = useContext(AppContext)
  const { username, userDb } = useContext(AuthContext)

  const designDoc = username as string
  // if (userCtx !== undefined && userCtx.roles.includes("_admin")) {
  //   dbName = "companylog-ia6ch3s4"
  //   designDoc = "companylog"
  // }

  const { project, customer } = useParams()

  const [deliverables, setDeliverables] = useState<string[]>([])
  const [lastPublishedVersions, setLastPublishedVersions] = useState<Record<string, StageInfoMap>>({})
  const [lastBuildState, setLastBuildState] = useState<LastBuildState>({})

  const [notFound, setNotFound] = useState(false)
  const navigate = useNavigate()

  if (notFound) {
    navigate("/not-found")
  }

  useEffect(() => {
    if (!userDb) {
      return
    }

    CouchdbManager.db(userDb)
      .design(designDoc)
      .view("deliverables", {
        group_level: 3,
        reduce: true,
        start_key: [customer, project],
        end_key: [customer, project, "\uffff"],
      })
      .then(resp => {
        if (resp.total_rows === 0) {
          setNotFound(true)
        }
        setDeliverables(resp.rows.map(row => (row.key as string[])[2]))
      })
  }, [CouchdbManager, customer, designDoc, project, userDb])

  useEffect(() => {
    if (!userDb) {
      return
    }

    CouchdbManager.db(userDb)
      .design(designDoc)
      .viewQueries<(string | undefined)[], EventDoc>("latest-published-version", {
        queries: deliverables.map(d => ({
          reduce: false,
          include_docs: true,
          start_key: [customer, project, d],
          end_key: [customer, project, d, "\uffff"],
        })),
      })
      .then(resp => {
        const map: Record<string, StageInfoMap> = {}

        resp.results
          .flatMap(res => res.rows)
          .forEach(row => {
            const stageName = row.key.pop()
            const deliverableName = row.key.pop() as string

            deliverableName in map || (map[deliverableName] = {})
            if (isStageName(stageName) && row.doc) {
              map[deliverableName][stageName] = {
                latestVersion: row.value as string,
                timestamp: row.doc.timestamp,
                configurationId: row.doc.config_id as string,
                repository: row.doc.repository,
              }
            }
          })
        setLastPublishedVersions(map)
      })
  }, [CouchdbManager, customer, deliverables, designDoc, project, userDb])

  useEffect(() => {
    if (!userDb) {
      return
    }

    CouchdbManager.db(userDb)
      .design(designDoc)
      .viewQueries<(string | undefined)[], EventDoc>("events-build", {
        queries: deliverables.map(d => ({
          reduce: false,
          include_docs: true,
          descending: true,
          start_key: [customer, project, d, "\uffff"],
          end_key: [customer, project, d],
        })),
      })
      .then(resp => {
        const map: LastBuildState = {}

        resp.results
          .flatMap(res => res.rows[0])
          .forEach(row => {
            const doc = row.doc as EventDoc
            map[doc.target] = [doc.event as EventState, formatTimestamp(doc.timestamp)]
          })

        setLastBuildState(map)
      })
  }, [CouchdbManager, customer, deliverables, designDoc, project, userDb])

  return (
    <>
      <PageHeading title="Project" />

      <Grid numItemsMd={2} className="gap-6">
        {deliverables.map(deliverable => (
          <Link to={deliverable} key={deliverable}>
            <Card className="w-full hover:ring transition transition-all">
              <Flex>
                <Title>{deliverable}</Title>
                {lastBuildState[deliverable] && (
                  <div className="inline-flex items-center space-x-2">
                    {EventStateBadges[lastBuildState[deliverable][0]]}
                    <Text>on {lastBuildState[deliverable][1]}</Text>
                  </div>
                )}
              </Flex>

              <Table className="mt-4">
                <TableBody>
                  {lastPublishedVersions[deliverable] &&
                    Object.entries(lastPublishedVersions[deliverable]).map(([stageName, stageInfo]) => (
                      <TableRow key={stageName + deliverable}>
                        <TableCell>
                          <Text>{titlecase(stageName)}</Text>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge color="gray">{stageInfo.latestVersion}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Text>{formatTimestamp(stageInfo.timestamp)}</Text>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </Card>
          </Link>
        ))}
      </Grid>
    </>
  )
}

export default Page
