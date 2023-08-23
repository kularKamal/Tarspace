import { CouchdbDoc } from "@iotinga/ts-backpack-couchdb-client"
import {
  IconBrandGithub,
  IconCalendar,
  IconChevronRight,
  IconClock,
  IconCloudDownload,
  IconExternalLink,
} from "@tabler/icons-react"
import {
  Badge,
  Button,
  Card,
  Flex,
  Grid,
  Icon,
  List,
  ListItem,
  Metric,
  SearchSelect,
  SearchSelectItem,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
  Title,
} from "@tremor/react"
import { DateTime, LocaleOptions } from "luxon"
import { FC, useContext, useEffect, useState } from "react"
import { Link, useLocation, useParams } from "react-router-dom"

import { Breadcrumbs, BreadcrumbsElement } from "components"
import { AppContext, AuthContext } from "contexts"
import { ArtifactDoc, DeliverableDoc, EventDoc, EventGroup, StageInfoMap } from "types"
import { isStageName } from "utils"

const ChevronIcon = () => <IconChevronRight height={18} />
const DownloadIcon = () => <IconCloudDownload size={32} />

type Artifact = {
  name: string
  url: string
}

type ArtifactTableProps = { artifacts: string[] }

const ArtifactsTable: FC<ArtifactTableProps> = props => {
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

type EventsViewProps = {
  events: EventGroup[]
}

const EventsView: FC<EventsViewProps> = (props: EventsViewProps) => {
  function formatTimestamp(
    timestamp?: string,
    formatOpts?: Intl.DateTimeFormatOptions | undefined,
    opts?: LocaleOptions | undefined
  ) {
    if (timestamp === undefined) {
      return "Unknown"
    }

    return DateTime.fromISO(timestamp).toLocaleString(formatOpts, opts)
  }

  function getStateMessage(eventGroup: EventGroup) {
    if (!eventGroup.success && !eventGroup.failure) {
      return "In progress"
    }
    if (eventGroup.success) {
      return "Success"
    }
    return "Failure"
  }

  function getStateColor(eventGroup: EventGroup) {
    if (!eventGroup.success && !eventGroup.failure) {
      return "yellow"
    }
    if (eventGroup.success) {
      return "green"
    }
    return "red"
  }

  function getFormattedTime(eventGroup: EventGroup) {
    if (eventGroup.failure) {
      return formatTimestamp(eventGroup.failure.timestamp, DateTime.TIME_SIMPLE)
    }
    if (eventGroup.success) {
      return formatTimestamp(eventGroup.success.timestamp, DateTime.TIME_SIMPLE)
    }

    return null
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Partial ID</TableHeaderCell>
          <TableHeaderCell>Start</TableHeaderCell>
          <TableHeaderCell>End</TableHeaderCell>
          <TableHeaderCell>State</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {props.events.map((d, index) => (
          <TableRow key={index}>
            <TableCell>{d.partialId}</TableCell>
            <TableCell>
              <Flex justifyContent="start">
                <IconCalendar className="mr-5" />
                <Text>{formatTimestamp(d.start?.timestamp)}</Text>
              </Flex>
              <Flex justifyContent="start">
                <IconClock className="mr-5" />
                <Text>{formatTimestamp(d.start?.timestamp, DateTime.TIME_SIMPLE)}</Text>
              </Flex>
            </TableCell>
            <TableCell>
              {d.failure || d.success ? (
                <>
                  <Flex justifyContent="start">
                    <IconCalendar className="mr-5" />
                    <Text>
                      {d.failure ? formatTimestamp(d.failure?.timestamp) : formatTimestamp(d.success?.timestamp)}
                    </Text>
                  </Flex>
                  <Flex justifyContent="start">
                    <IconClock className="mr-5" />
                    <Text>{getFormattedTime(d) || "In progress"}</Text>
                  </Flex>
                </>
              ) : (
                <Text>-</Text>
              )}
            </TableCell>
            <TableCell>
              <Badge size="xl" color={getStateColor(d)}>
                {getStateMessage(d)}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function Page() {
  const location = useLocation()
  const crumbs: BreadcrumbsElement[] = [
    {
      name: location.pathname.split("/").pop() as string,
      route: location.pathname,
    },
  ]

  const params = useParams()

  const { CouchdbManager } = useContext(AppContext)
  const { username } = useContext(AuthContext)

  const dbName = "userdb-" + Buffer.from(username as string).toString("hex")
  const designDoc = username as string

  const [publishEvents, setPublishEvents] = useState<CouchdbDoc[]>([])
  const [events, setEvents] = useState<EventGroup[]>([])
  const [deliverables, setDeliverables] = useState<DeliverableDoc[]>([])
  const [lastPublishedVersions, setLastPublishedVersions] = useState<StageInfoMap>({})

  function sortEventGroups(a: EventGroup, b: EventGroup) {
    const aStop = a.success || a.failure
    const bStop = b.success || b.failure

    const aStartTS = (a.start && DateTime.fromISO(a.start.timestamp)) || DateTime.fromMillis(0)
    const bStartTS = (b.start && DateTime.fromISO(b.start.timestamp)) || DateTime.fromMillis(0)

    const aStopTS = (aStop && DateTime.fromISO(aStop.timestamp)) || aStartTS
    const bStopTS = (bStop && DateTime.fromISO(bStop.timestamp)) || bStartTS

    if (aStartTS < bStartTS) {
      return 1
    }

    if (aStopTS < bStopTS) {
      return 1
    }

    if (aStopTS > bStopTS) {
      return -1
    }

    return 0
  }

  useEffect(() => {
    CouchdbManager.db(dbName)
      .design(designDoc)
      .view("events-publish", {
        reduce: false,
        include_docs: true,
        start_key: [params.customer, params.project, params.deliverable],
        end_key: [params.customer, params.project, params.deliverable, "\uffff"],
      })
      .then(resp => {
        setPublishEvents(resp.rows.map(row => row.doc).filter(doc => doc !== undefined) as CouchdbDoc[])
      })

    CouchdbManager.db(dbName)
      .design(designDoc)
      .view("deliverables", {
        reduce: false,
        include_docs: true,
        start_key: [params.customer, params.project, params.deliverable],
        end_key: [params.customer, params.project, params.deliverable, "\uffff"],
      })
      .then(resp => {
        setDeliverables(resp.rows.map(row => row.doc).filter(doc => doc !== undefined) as DeliverableDoc[])
      })

    CouchdbManager.db(dbName)
      .design(designDoc)
      .view<(string | undefined)[], EventDoc>("latest-published-version", {
        reduce: false,
        include_docs: true,
        start_key: [params.customer, params.project, params.deliverable],
        end_key: [params.customer, params.project, params.deliverable, "\uffff"],
      })
      .then(resp => {
        const map: StageInfoMap = {}
        resp.rows.forEach(row => {
          const stageName = row.key.pop()
          if (isStageName(stageName) && row.doc) {
            map[stageName] = {
              latestVersion: row.value as string,
              timestamp: row.doc.timestamp,
              configurationId: row.doc.config_id as string,
              repository: row.doc.repository,
            }
          }
        })
        setLastPublishedVersions(map)
      })

    CouchdbManager.db(dbName)
      .design(designDoc)
      .view("grouped-events", {
        reduce: true,
        group: true,
        // include_docs: true,
        start_key: [params.customer, params.project, params.deliverable],
        end_key: [params.customer, params.project, params.deliverable, "\uffff"],
      })
      .then(resp => {
        const groupedEvents: EventGroup[] = []
        resp.rows.forEach(row => {
          const partialId = row.key.pop()
          if (partialId === undefined) {
            return
          }
          groupedEvents.push({
            partialId,
            ...(row.value as Partial<EventGroup>),
          })
        })
        groupedEvents.sort(sortEventGroups)
        setEvents(groupedEvents)
      })
  }, [CouchdbManager, dbName, designDoc, params])

  return (
    <>
      <Flex>
        <div>
          <Metric className="text-left">Deliverable</Metric>
          <Text className="text-left">{params.deliverable}</Text>
        </div>
        <Breadcrumbs crumbs={crumbs} />
      </Flex>

      <TabGroup className="mt-6">
        <TabList variant="line">
          <Tab id="details">Details</Tab>
          <Tab>Versions</Tab>
          <Tab>Events</Tab>
          <Tab>Artifacts</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <Grid
              numItemsMd={2}
              numItemsLg={Math.min(3, Object.entries(lastPublishedVersions).length)}
              className="gap-6 mt-6"
            >
              {Object.entries(lastPublishedVersions).map(([stageName, info]) => (
                <Card key={stageName}>
                  <Metric>{stageName}</Metric>
                  <List className="mt-4">
                    <ListItem>
                      <Flex>
                        <Text>Current installed version</Text>
                        <Text>{info.latestVersion}</Text>
                      </Flex>
                    </ListItem>
                    <ListItem>
                      <Flex>
                        <Text>Last update date</Text>
                        <Text>{DateTime.fromISO(info.timestamp).toLocaleString()}</Text>
                      </Flex>
                    </ListItem>
                    <ListItem>
                      <Flex>
                        <Text>Configuration</Text>
                        <Link to="">
                          <Text color="blue">LATEST</Text>
                        </Link>
                      </Flex>
                    </ListItem>
                  </List>
                </Card>
              ))}
            </Grid>
            <Grid numItems={2} className="gap-6">
              <div className="mt-6">
                <Card>
                  <Icon icon={IconBrandGithub} variant="light" size="xl" color="blue" />
                  <Title className="mt-6">Repository</Title>
                  <Text className="mt-2">The source code for this deliverable can be found at the following link.</Text>
                  <Flex className="mt-6 pt-4 border-t">
                    <Link
                      to={
                        (Object.values(lastPublishedVersions)[0] &&
                          Object.values(lastPublishedVersions)[0].repository) ||
                        "#"
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="xs" variant="light" icon={IconExternalLink} iconPosition="right">
                        Visit
                      </Button>
                    </Link>
                  </Flex>
                </Card>
              </div>
            </Grid>
          </TabPanel>
          <TabPanel></TabPanel>
          <TabPanel>
            <Card className="mt-6">
              <EventsView events={events} />
            </Card>
          </TabPanel>
          <TabPanel>
            {/* <Grid numItemsMd={3} className="gap-4 mt-6">
              <ArtifactCard />
              <ArtifactCard />
              <ArtifactCard />
              <ArtifactCard />
              <ArtifactCard />
              <ArtifactCard />
              <ArtifactCard />
              <ArtifactCard />
            </Grid> */}
            {/* <ArtifactsTable /> */}
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </>
  )
}

export default Page
