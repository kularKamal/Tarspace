import { CouchdbDoc } from "@iotinga/ts-backpack-couchdb-client"
import { IconCalendar, IconChevronRight, IconClock, IconCloudDownload, IconTimeDuration0 } from "@tabler/icons-react"
import {
  Badge,
  Card,
  Flex,
  Grid,
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
} from "@tremor/react"
import { Breadcrumbs, BreadcrumbsElement } from "components/Breadcrumbs"
import { AppContext } from "contexts/AppContext"
import { AuthContext } from "contexts/AuthContext"
import { FC, useContext, useEffect, useState } from "react"
import { Link, useLocation, useParams } from "react-router-dom"
import { ArtifactDoc, DeliverableDoc, EventDoc, EventGroup } from "types/couchdb"
import { StageInfoMap } from "../../types/deliverables"
import { isStageName } from "../../utils/deliverables"
import { DateTime } from "luxon"

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

type EventsViewProps = { events: EventGroup[] }
function EventsView(props: EventsViewProps) {
  function formatTimestamp(timestamp?: string) {
    if (timestamp === undefined) {
      return "No timestamp"
    }

    return DateTime.fromISO(timestamp).toLocaleString()
  }

  function getStateMessage(eventGroup: EventGroup) {
    if (!eventGroup.stop) {
      return "In progress"
    }
    if (eventGroup.success) {
      return "Success"
    }
    return "Failure"
  }

  function getStateColor(eventGroup: EventGroup) {
    if (!eventGroup.stop) {
      return "yellow"
    }
    if (eventGroup.success) {
      return "green"
    }
    return "red"
  }

  return (
    <Table className="mt-6">
      <TableHead>
        <TableRow>
          <TableHeaderCell>PARTIAL ID</TableHeaderCell>
          <TableHeaderCell>INFO</TableHeaderCell>
          <TableHeaderCell>STATE</TableHeaderCell>
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
                <Text>{d.stop?.timestamp ? formatTimestamp(d.stop?.timestamp) : "In progress"}</Text>
              </Flex>
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
      .view("latest-published-version", {
        reduce: false,
        include_docs: true,
        start_key: [params.customer, params.project, params.deliverable],
        end_key: [params.customer, params.project, params.deliverable, "\uffff"],
      })
      .then(resp => {
        const map: StageInfoMap = {}
        resp.rows.forEach(row => {
          const stageName = row.key.pop()
          if (isStageName(stageName)) {
            map[stageName] = {
              latestVersion: row.value as string,
              timestamp: (row.doc as EventDoc).timestamp,
              configurationId: (row.doc as EventDoc).config_id as string,
            }
          }
        })
        setLastPublishedVersions(map)
      })

    CouchdbManager.db(dbName)
      .design(designDoc)
      .view("grouped-events", {
        reduce: false,
        include_docs: true,
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
            ...(row.value as any),
          })
        })
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
            <Grid numItemsMd={2} numItemsLg={3} className="gap-6 mt-6">
              {Object.entries(lastPublishedVersions).map(([stageName, info]) => (
                <Card key={stageName}>
                  <Metric>{stageName.toUpperCase()}</Metric>
                  <Flex>
                    <Text>Current installed version</Text>
                    <Text>{info.latestVersion}</Text>
                  </Flex>
                  <Flex>
                    <Text>Last update date</Text>
                    <Text>{DateTime.fromISO(info.timestamp).toLocaleString()}</Text>
                  </Flex>
                  <Flex>
                    <Text>Configuration</Text>
                    <Link to="">
                      <Text color="blue">LATEST</Text>
                    </Link>
                  </Flex>
                </Card>
              ))}
            </Grid>
            <div className="mt-6">
              <Card>
                <div className="h-80" />
              </Card>
            </div>
          </TabPanel>
          <TabPanel></TabPanel>
          <TabPanel>
            <EventsView events={events} />
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
