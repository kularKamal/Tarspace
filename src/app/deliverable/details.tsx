import {
  IconBrandGithub,
  IconCircleCheckFilled,
  IconCircleXFilled,
  IconCloudDownload,
  IconHelpCircleFilled,
} from "@tabler/icons-react"
import {
  Button,
  Card,
  Color,
  Divider,
  Flex,
  Grid,
  Icon,
  List,
  ListItem,
  Metric,
  Text,
  Title,
  Tracker,
} from "@tremor/react"
import { DateTime } from "luxon"
import { useContext, useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import urlJoin from "url-join"

import { Skeleton } from "components"
import { AppContext, AuthContext } from "contexts"
import { DeliverableDoc, EventGroup, StageInfoMap } from "types"
import { formatTimestamp, sortEventGroupsByTime, titlecase } from "utils"

const MAX_TRACKED_EVENTS = 36

interface TrackerDatum {
  color: Color
  tooltip?: string
}

const TrackerData: Record<string, TrackerDatum> = {
  SUCCESS: {
    color: "emerald",
    tooltip: "Successful",
  },
  FAILURE: {
    color: "rose",
    tooltip: "Failed",
  },
  TIMED_OUT: {
    color: "gray",
    tooltip: "Timed out",
  },
  EMPTY: {
    color: "neutral",
  },
}

export type DetailsViewProps = {
  stages: StageInfoMap
  trackerEvents: EventGroup[]
}

type VersionUploads = Record<string, string>

function DetailsView({ stages, trackerEvents }: DetailsViewProps) {
  const { customer, project, deliverable } = useParams()

  const { CouchdbManager } = useContext(AppContext)
  const { username, userDb } = useContext(AuthContext)
  const designDoc = username as string

  const [uploads, setUploads] = useState<VersionUploads>({})

  useEffect(() => {
    if (!userDb) {
      return
    }

    CouchdbManager.db(userDb)
      .design(designDoc)
      .viewQueries<(string | undefined)[], DeliverableDoc>("deliverables", {
        queries: Object.values(stages).map(stageInfo => ({
          reduce: false,
          include_docs: true,
          start_key: [customer, project, deliverable, stageInfo.latestVersion],
          end_key: [customer, project, deliverable, stageInfo.latestVersion],
        })),
      })
      .then(resp => {
        const map: VersionUploads = {}
        resp.results
          .flatMap(res => (res.rows[0].doc ? [res.rows[0].doc] : []))
          .forEach(doc => doc.uploads && (map[doc.version] = Object.values(doc.uploads)[0]))

        setUploads(map)
      })
  }, [CouchdbManager, customer, userDb, deliverable, designDoc, project, stages])

  const sortedEvents = useMemo(
    () =>
      trackerEvents.sort(sortEventGroupsByTime).slice(0, Math.min(trackerEvents.length, MAX_TRACKED_EVENTS)).reverse(),
    [trackerEvents]
  )

  const trackerData: TrackerDatum[] = useMemo(
    () =>
      new Array(MAX_TRACKED_EVENTS - sortedEvents.length).fill(TrackerData.EMPTY).concat(
        sortedEvents.map(eg => {
          const tooltip = eg.start?.timestamp && formatTimestamp(eg.start.timestamp, DateTime.DATETIME_MED)
          if (eg.failure) {
            return { ...TrackerData.FAILURE, tooltip }
          }

          if (eg.success) {
            return { ...TrackerData.SUCCESS, tooltip }
          }

          return { ...TrackerData.TIMED_OUT, tooltip }
        })
      ),
    [sortedEvents]
  )

  const firstTs = sortedEvents.at(0)?.start?.timestamp
  const lastTs = sortedEvents.at(sortedEvents.length - 1)?.start?.timestamp

  const stagesEntries = useMemo(() => Object.entries(stages), [stages])

  return (
    <>
      <Grid numItemsMd={2} numItemsLg={Math.min(3, stagesEntries.length)} className="gap-6 mt-6">
        {stagesEntries.length === 0 ? (
          <>
            <EmptyStageCard />
            <EmptyStageCard />
          </>
        ) : (
          stagesEntries.map(([stageName, info]) => (
            <Card key={stageName}>
              <Flex flexDirection="row" justifyContent="between">
                <Metric>{titlecase(stageName)}</Metric>
                <Link to={uploads[info.latestVersion]}>
                  <Button icon={IconCloudDownload} variant="light" size="lg" tooltip={`Download deliverable`} />
                </Link>
              </Flex>
              <List className="mt-4">
                <ListItem>
                  <Flex>
                    <Text>Current version</Text>
                    <Link to={info.repository ? urlJoin(info.repository, `./tree/v${info.latestVersion}`) : ""}>
                      <Button icon={IconBrandGithub} variant="light" tooltip="See the source code for this release">
                        {info.latestVersion}
                      </Button>
                    </Link>
                  </Flex>
                </ListItem>
                <ListItem>
                  <Flex>
                    <Text>Last update date</Text>
                    <Text>{formatTimestamp(info.timestamp, DateTime.DATETIME_MED)}</Text>
                  </Flex>
                </ListItem>
              </List>
            </Card>
          ))
        )}
      </Grid>
      <Divider className="lg:hidden" />
      <Grid numItemsMd={2} className="gap-6 lg:mt-6">
        <Card>
          <Flex>
            <Title className="w-full">Builds overview</Title>
            <Flex justifyContent="end" className="-space-x-2 -mr-2">
              <Icon icon={IconCircleCheckFilled} {...TrackerData.SUCCESS} />
              <Icon icon={IconHelpCircleFilled} {...TrackerData.TIMED_OUT} />
              <Icon icon={IconCircleXFilled} {...TrackerData.FAILURE} />
            </Flex>
          </Flex>
          {trackerEvents.length > 0 ? (
            <>
              <Tracker data={trackerData} className="mt-2" />
              <Flex className="mt-2">
                <Text>{formatTimestamp(firstTs, DateTime.DATE_MED)}</Text>
                <Text>{formatTimestamp(lastTs, DateTime.DATE_MED)}</Text>
              </Flex>
            </>
          ) : (
            <EmptyTracker />
          )}
        </Card>
      </Grid>
    </>
  )
}

export default DetailsView

function EmptyTracker() {
  return (
    <>
      <Tracker data={new Array(MAX_TRACKED_EVENTS).fill(TrackerData.EMPTY)} className="mt-2" />
      <Flex className="mt-2">
        <Skeleton className="h-tremor-default w-20" />
        <Skeleton className="h-tremor-default w-20" />
      </Flex>
    </>
  )
}

function EmptyStageCard() {
  return (
    <Card>
      <Flex flexDirection="row" justifyContent="between">
        <Skeleton className="h-tremor-metric w-32" />
      </Flex>
      <List className="mt-4">
        <ListItem>
          <Flex>
            <Skeleton className="h-tremor-default w-32" />
            <Skeleton className="h-tremor-title w-32" />
          </Flex>
        </ListItem>
        <ListItem>
          <Flex>
            <Skeleton className="h-tremor-default w-32" />
            <Skeleton className="h-tremor-default w-32" />
          </Flex>
        </ListItem>
      </List>
    </Card>
  )
}
