import { Badge, Flex, Grid, Icon, Table, TableBody, TableCell, TableRow, Text, Title } from "@tremor/react"
import { useContext, useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { IconRocketOff } from "@tabler/icons-react"
import { ClickableCard, EventState, EventStateBadges, PageHeading } from "components"
import { Skeleton } from "components/Skeleton"
import { AppContext, AuthContext } from "contexts"
import { EventDoc, StageInfoMap } from "types"
import { formatTimestamp, isStageName, titlecase } from "utils"

type LastBuildState = Record<string, [EventState, string]>

function Page() {
  const { CouchdbClient } = useContext(AppContext)
  const { username, userDb } = useContext(AuthContext)

  const designDoc = username as string
  // if (userCtx !== undefined && userCtx.roles.includes("_admin")) {
  //   dbName = "companylog-ia6ch3s4"
  //   designDoc = "companylog"
  // }

  const { project, customer } = useParams()

  const [deliverables, setDeliverables] = useState<string[]>([])
  const [lastPublishedVersions, setLastPublishedVersions] = useState<Record<string, StageInfoMap> | null>(null)
  const [lastBuildState, setLastBuildState] = useState<LastBuildState | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [notFound, setNotFound] = useState(false)
  const navigate = useNavigate()

  if (notFound) {
    navigate("/not-found")
  }

  useEffect(() => {
    if (!userDb) {
      return
    }

    CouchdbClient.db(userDb)
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
  }, [CouchdbClient, customer, designDoc, project, userDb])

  useEffect(() => {
    if (!userDb) {
      return
    }

    CouchdbClient.db(userDb)
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
  }, [CouchdbClient, customer, deliverables, designDoc, project, userDb])

  useEffect(() => {
    if (!userDb) {
      return
    }

    CouchdbClient.db(userDb)
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
          .filter(row => row !== undefined)
          .forEach(row => {
            const doc = row.doc as EventDoc
            map[doc.target] = [doc.event as EventState, formatTimestamp(doc.timestamp)]
          })

        setLastBuildState(map)
      })
  }, [CouchdbClient, customer, deliverables, designDoc, project, userDb])

  return (
    <>
      <PageHeading title="Project" />

      <Grid numItemsMd={2} className="gap-6">
        {deliverables.map(deliverable => (
          <Link to={deliverable} key={deliverable}>
            <ClickableCard>
              <Flex>
                <Title>{deliverable}</Title>
                {lastBuildState && Object.keys(lastBuildState).length > 0 ? (
                  lastBuildState[deliverable] && (
                    <div className="inline-flex items-center space-x-2">
                      {EventStateBadges[lastBuildState[deliverable][0]]}
                      <Text>on {lastBuildState[deliverable][1]}</Text>
                    </div>
                  )
                ) : (
                  <Skeleton className="h-tremor-default w-48" />
                )}
              </Flex>

              <Table className="mt-4 h-full">
                {lastPublishedVersions && Object.keys(lastPublishedVersions).length > 0 ? (
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
                ) : (
                  <TableBody>
                    <LoadingStageRow />
                    <LoadingStageRow />
                  </TableBody>
                )}
              </Table>
            </ClickableCard>
          </Link>
        ))}
      </Grid>
    </>
  )
}

export default Page

const LoadingStageRow = () => (
  <TableRow>
    <TableCell>
      <Skeleton className="h-tremor-default w-32" />
    </TableCell>
    <TableCell className="text-center">
      <Skeleton className="h-tremor-default w-32" />
    </TableCell>
    <TableCell className="text-right">
      <Skeleton className="h-tremor-default w-32" />
    </TableCell>
  </TableRow>
)

const EmptyStageCard = () => (
  <Flex flexDirection="col" className="h-full space-y-8" justifyContent="center">
    <Flex className="space-x-4" justifyContent="center">
      <Icon icon={IconRocketOff} size="xl" className="text-tremor-content-subtle" />

      <div>
        <Title>No deployment found</Title>
        <Text className="text-tremor-content-subtle">This deliverable has never been deployed.</Text>
      </div>
    </Flex>
  </Flex>
)
