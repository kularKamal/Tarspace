import { CouchdbDoc } from "@iotinga/ts-backpack-couchdb-client"
import { IconBrandGithub, IconExternalLink } from "@tabler/icons-react"
import {
  Accordion,
  AccordionBody,
  AccordionHeader,
  Button,
  Card,
  DateRangePicker,
  DateRangePickerValue,
  Flex,
  Grid,
  Icon,
  List,
  ListItem,
  Metric,
  MultiSelect,
  MultiSelectItem,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
  Text,
  Title,
} from "@tremor/react"
import { DateTime } from "luxon"
import { PropsWithChildren, useContext, useEffect, useState } from "react"
import { TabPanel as HeadlessTab, useTabs } from "react-headless-tabs"
import { Link, useParams } from "react-router-dom"

import { EventStateMessage, EventsView } from "app/deliverable/events"
import { VersionEvents, VersionsView } from "app/deliverable/versions"
import { ArtifactCard, Breadcrumbs } from "components"
import { AppContext, AuthContext } from "contexts"
import { EventDoc, EventGroup, SingleEvent, StageInfoMap } from "types"
import { isStageName, titlecase } from "utils"

enum Tabs {
  DETAILS = "details",
  VERSIONS = "versions",
  EVENTS = "events",
  ARTIFACTS = "artifacts",
}

type StatusFilter = {
  [key in EventStateMessage]?: boolean
}

function CustomTabPanel<T extends string>(props: { name: string; currentTab?: T | null } & PropsWithChildren) {
  return (
    <TabPanel>
      <HeadlessTab hidden={props.name !== props.currentTab}>{props.children}</HeadlessTab>
    </TabPanel>
  )
}

function Page() {
  const params = useParams()

  const { CouchdbManager } = useContext(AppContext)
  const { username } = useContext(AuthContext)

  const dbName = "userdb-" + Buffer.from(username as string).toString("hex")
  const designDoc = username as string

  const [events, setEvents] = useState<VersionEvents>({})
  const [eventsList, setEventsList] = useState<EventGroup[]>([])
  const [lastPublishedVersions, setLastPublishedVersions] = useState<StageInfoMap>({})

  const [selectedTab, setSelectedTab] = useTabs(Object.values(Tabs), params.tab ?? Tabs.DETAILS)

  useEffect(() => {
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
      .view<(string | undefined)[], EventGroup & CouchdbDoc>("grouped-events", {
        reduce: true,
        group: true,
        start_key: [params.customer, params.project, params.deliverable],
        end_key: [params.customer, params.project, params.deliverable, "\uffff"],
      })
      .then(resp => {
        const groupedEvents: VersionEvents = {}
        const eventsList: EventGroup[] = []
        resp.rows.forEach(row => {
          const partialId = row.key.pop()
          if (partialId === undefined) {
            return
          }
          const value = row.value as EventGroup
          eventsList.push(value)
          value.partialId = partialId
          groupedEvents[value.version] ??= []
          groupedEvents[value.version].push(value)
        })
        setEvents(groupedEvents)
        setEventsList(eventsList)
      })
  }, [CouchdbManager, dbName, designDoc, params])

  return (
    <>
      <Flex>
        <div>
          <Metric className="text-left">Deliverable</Metric>
          <Text className="text-left">{params.deliverable}</Text>
        </div>
        <Breadcrumbs ignoreLast={params.tab !== undefined} />
      </Flex>

      <TabGroup className="mt-6" defaultIndex={Object.values(Tabs).findIndex(t => t === params.tab) || 1}>
        <TabList variant="line">
          {Object.entries(Tabs).map(([k, v]) => (
            <Tab key={k} onClick={() => setSelectedTab(v)}>
              {titlecase(v)}
            </Tab>
          ))}
        </TabList>
        <TabPanels>
          <CustomTabPanel name={Tabs.DETAILS} currentTab={selectedTab}>
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
            <Grid numItemsMd={2} className="gap-6">
              <div className="mt-6">
                <Card>
                  <Icon icon={IconBrandGithub} variant="light" size="lg" color="blue" />
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
          </CustomTabPanel>
          <CustomTabPanel name={Tabs.VERSIONS} currentTab={selectedTab}>
            <VersionsView events={events} />
          </CustomTabPanel>
          <CustomTabPanel name={Tabs.EVENTS} currentTab={selectedTab}>
            <EventsPanel eventsList={eventsList} />
          </CustomTabPanel>
          <CustomTabPanel name={Tabs.ARTIFACTS} currentTab={selectedTab}>
            <Grid numItemsMd={3} className="gap-4 mt-6">
              <ArtifactCard />
              <ArtifactCard />
              <ArtifactCard />
              <ArtifactCard />
              <ArtifactCard />
              <ArtifactCard />
              <ArtifactCard />
              <ArtifactCard />
            </Grid>
          </CustomTabPanel>
        </TabPanels>
      </TabGroup>
    </>
  )
}

export default Page

type EventsPanelProps = {
  eventsList: EventGroup[]
}
const EventsPanel = ({ eventsList }: EventsPanelProps) => {
  const [startRange, setStartRange] = useState<DateRangePickerValue>({
    from: new Date(0),
    to: new Date(),
  })
  const [endRange, setEndRange] = useState<DateRangePickerValue>({
    from: new Date(0),
    to: new Date(),
  })
  const [statusFilters, setStatusFilter] = useState<StatusFilter>({})

  // const visibleEvents = useMemo(
  //   () =>
  //     eventsList.filter(e => isEventInRange(startRange, e.start) && isEventInRange(endRange, e.failure || e.success)),
  //   [eventsList, startRange, endRange]
  // )
  const visibleEvents = eventsList.filter(
    e => isEventInRange(startRange, e.start) && isEventInRange(endRange, e.failure || e.success)
  )

  function isEventInRange(range: DateRangePickerValue, e?: SingleEvent) {
    if (!e) {
      return true
    }

    const from = DateTime.fromJSDate(range.from ?? new Date(0))
    const to = DateTime.fromJSDate(range.to ?? new Date())
    const dt = DateTime.fromISO(e.timestamp)

    return from < dt && dt < to
  }

  return (
    <Card className="mt-6">
      <Flex className="space-x-4" justifyContent="start" alignItems="center">
        <DateRangePicker placeholder="Select start dates" enableYearNavigation onValueChange={setStartRange} />
        <MultiSelect
          onValueChange={value => {
            const statusFilter = (value as EventStateMessage[]).reduce((acc, v) => {
              acc[v] = true
              return acc
            }, {} as StatusFilter)
            setStatusFilter(statusFilter)
          }}
        >
          {Object.values(EventStateMessage).map(m => (
            <MultiSelectItem key={m} value={m} />
          ))}
        </MultiSelect>
      </Flex>
      <Accordion className="w-full p-0 mt-4 mb-4 border-none overflow-visible w-fit">
        <AccordionHeader className="px-2 pt-0 flex-row-reverse w-fit">
          <Flex>
            <Text className="text-left ml-4 mb-0.5">Advanced search</Text>
          </Flex>
        </AccordionHeader>
        <AccordionBody className="px-0">
          <DateRangePicker placeholder="Select end dates" enableYearNavigation onValueChange={setEndRange} />
        </AccordionBody>
      </Accordion>
      <EventsView events={visibleEvents} />
    </Card>
  )
}
