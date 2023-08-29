import { CouchdbDoc } from "@iotinga/ts-backpack-couchdb-client"
import {
  Accordion,
  AccordionBody,
  AccordionHeader,
  Badge,
  Card,
  DateRangePicker,
  DateRangePickerValue,
  Flex,
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
import { useNavigate, useParams } from "react-router-dom"

import { DetailsView } from "app/deliverable/details"
import { EventState, EventStateBadges, EventStateMessages, EventsView } from "app/deliverable/events"
import { VersionEvents, VersionsView } from "app/deliverable/versions"
import { Breadcrumbs } from "components"
import { AppContext, AuthContext } from "contexts"
import { EventDoc, EventGroup, SingleEvent, StageInfoMap } from "types"
import { isStageName, titlecase } from "utils"
import { FilesView } from "./files"

enum Tabs {
  DETAILS = "details",
  VERSIONS = "versions",
  EVENTS = "events",
  FILES = "files",
  CONFIGURATION = "configuration",
}

type StatusFilter = Partial<Record<EventState, boolean>>

function CustomTabPanel<T extends string>(props: { name: string; currentTab?: T | null } & PropsWithChildren) {
  return (
    <TabPanel>
      <HeadlessTab hidden={props.name !== props.currentTab}>{props.children}</HeadlessTab>
    </TabPanel>
  )
}

function Page() {
  const { customer, project, deliverable, tab } = useParams()
  const navigate = useNavigate()

  const { CouchdbManager } = useContext(AppContext)
  const { username } = useContext(AuthContext)

  const dbName = "userdb-" + Buffer.from(username as string).toString("hex")
  const designDoc = username as string

  const [lastPublishedVersions, setLastPublishedVersions] = useState<StageInfoMap>({})
  const [events, setEvents] = useState<VersionEvents>({})
  const [eventsList, setEventsList] = useState<EventGroup[]>([])

  const [selectedTab, setSelectedTab] = useTabs(Object.values(Tabs), tab ?? Tabs.DETAILS)

  useEffect(() => {
    CouchdbManager.db(dbName)
      .design(designDoc)
      .view<(string | undefined)[], EventGroup & CouchdbDoc>("grouped-events", {
        reduce: true,
        group: true,
        start_key: [customer, project, deliverable],
        end_key: [customer, project, deliverable, "\uffff"],
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

    CouchdbManager.db(dbName)
      .design(designDoc)
      .view<(string | undefined)[], EventDoc>("latest-published-version", {
        reduce: false,
        include_docs: true,
        start_key: [customer, project, deliverable],
        end_key: [customer, project, deliverable, "\uffff"],
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
  }, [CouchdbManager, customer, dbName, deliverable, designDoc, project])

  return (
    <>
      <Flex>
        <div>
          <Metric className="text-left">Deliverable</Metric>
          <Text className="text-left">{deliverable}</Text>
        </div>
        <Breadcrumbs ignoreLast={tab !== undefined} />
      </Flex>

      <TabGroup
        className="mt-6"
        defaultIndex={Math.max(
          Object.values(Tabs).findIndex(t => t === tab),
          0
        )}
      >
        <TabList variant="line">
          {Object.entries(Tabs).map(([key, tabName]) => (
            <Tab
              key={key}
              onClick={() => {
                setSelectedTab(tabName)
                navigate(`../${tabName}`, { relative: "path" })
              }}
            >
              {titlecase(tabName)}
            </Tab>
          ))}
        </TabList>
        <TabPanels>
          <CustomTabPanel name={Tabs.DETAILS} currentTab={selectedTab}>
            <DetailsView stages={lastPublishedVersions} trackerEvents={eventsList.filter(eg => eg.type === "build")} />
          </CustomTabPanel>
          <CustomTabPanel name={Tabs.VERSIONS} currentTab={selectedTab}>
            <VersionsView events={events} />
          </CustomTabPanel>
          <CustomTabPanel name={Tabs.EVENTS} currentTab={selectedTab}>
            <EventsPanel eventsList={eventsList} />
          </CustomTabPanel>
          <CustomTabPanel name={Tabs.FILES} currentTab={selectedTab}>
            {customer && project && deliverable
              ? Object.entries(lastPublishedVersions).map(([stageName, info]) => (
                  <Card className="mt-6" key={stageName}>
                    <Flex justifyContent="start" className="space-x-2 mb-6">
                      <Title>{titlecase(stageName)}</Title>
                      <Badge color="gray">{info.latestVersion}</Badge>
                    </Flex>
                    <FilesView
                      customer={customer}
                      project={project}
                      deliverable={deliverable}
                      version={info.latestVersion}
                    />
                  </Card>
                ))
              : null}
          </CustomTabPanel>
          <CustomTabPanel name={Tabs.CONFIGURATION} currentTab={selectedTab}></CustomTabPanel>
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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>({
    failure: true,
    inProgress: true,
    timedOut: true,
    success: true,
  })
  const [opFilter, setOpFilter] = useState()

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
        <DateRangePicker placeholder="Filter start dates..." enableYearNavigation onValueChange={setStartRange} />
        <MultiSelect
          placeholder="Select status..."
          defaultValue={Object.keys(statusFilter)}
          onValueChange={value => {
            const statusFilter = (value as EventState[]).reduce((acc, v) => {
              acc[v] = true
              return acc
            }, {} as StatusFilter)
            setStatusFilter(statusFilter)
          }}
        >
          {Object.keys(EventStateMessages).map(eventState => (
            <MultiSelectItem key={eventState} value={eventState}>
              {EventStateBadges[eventState as EventState]}
            </MultiSelectItem>
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
          <DateRangePicker placeholder="Filter end dates..." enableYearNavigation onValueChange={setEndRange} />
        </AccordionBody>
      </Accordion>
      <EventsView events={visibleEvents} />
    </Card>
  )
}
