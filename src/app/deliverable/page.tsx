import { IconAdjustments, IconFileDescription, IconHistory, IconVersions } from "@tabler/icons-react"
import {
  Accordion,
  AccordionBody,
  AccordionHeader,
  Card,
  DateRangePicker,
  DateRangePickerValue,
  Flex,
  MultiSelect,
  MultiSelectItem,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
  Text,
} from "@tremor/react"
import { DateTime } from "luxon"
import { ElementType, PropsWithChildren, Suspense, lazy, useContext, useEffect, useMemo, useState } from "react"
import { useTabs } from "react-headless-tabs"
import { useNavigate, useParams } from "react-router-dom"

import { type VersionEvents } from "app/deliverable/versions"
import { EventState, EventStateBadges, EventStateMessages, Loading, PageHeading, Skeleton } from "components"
import { AppContext, AuthContext } from "contexts"
import { EventDoc, EventGroup, STAGES_ORDER, STAGE_NAMES, SingleEvent, StageInfoMap } from "types"
import { isPending, isStageName, isTimedOut, semverCompare, titlecase } from "utils"
import { DeliverableInformations } from "types/api"
import useSWR, { mutate } from "swr"
import { Logger } from "@iotinga/ts-backpack-common"
import axios from "axios"

const ConfigurationEditor = lazy(() => import("app/deliverable/configuration"))
const DetailsView = lazy(() => import("app/deliverable/details"))
const EventsView = lazy(() => import("app/deliverable/events"))
const VersionsView = lazy(() => import("app/deliverable/versions"))

enum Tabs {
  DETAILS = "details",
  VERSIONS = "versions",
  EVENTS = "events",
  CONFIGURATION = "configuration",
}

const TAB_ICONS: Record<keyof typeof Tabs, ElementType> = {
  DETAILS: IconFileDescription,
  VERSIONS: IconVersions,
  EVENTS: IconHistory,
  CONFIGURATION: IconAdjustments,
}

type StatusFilter = Partial<Record<EventState, boolean>>

function CustomTabPanel<T extends string>(props: { name: string; currentTab?: T | null } & PropsWithChildren) {
  const Loader = (
    <Flex className="mt-[30vh]">
      <Loading />
    </Flex>
  )

  return (
    <Suspense fallback={Loader}>
      <TabPanel>{props.name === props.currentTab ? props.children : null}</TabPanel>
    </Suspense>
  )
}

function Page() {
  const logger = new Logger("App")
  const { customer, project, deliverable, tab } = useParams()
  const navigate = useNavigate()

  const { username } = useContext(AuthContext)
  const designDoc = username as string

  const [lastPublishedVersions, setLastPublishedVersions] = useState<StageInfoMap>({})
  const [events, setEvents] = useState<VersionEvents>({})
  const [eventsList, setEventsList] = useState<EventGroup[]>([])

  const [selectedTab, setSelectedTab] = useTabs(Object.values(Tabs), (tab as Tabs) ?? Tabs.DETAILS)

  const [notFound, setNotFound] = useState(false)

  if (notFound) {
    navigate("/not-found")
  }
  useEffect(() => setSelectedTab((tab as Tabs) ?? Tabs.DETAILS), [tab, setSelectedTab])
  const trackerEvents = useMemo(() => eventsList.filter(eg => eg.type === "build"), [eventsList])

  return (
    <>
      <PageHeading title="Deliverable" ignoreLast={selectedTab !== undefined} />

      <TabGroup
        defaultIndex={Math.max(
          Object.values(Tabs).findIndex(t => t === selectedTab),
          0
        )}
      >
        <TabList>
          {Object.entries(Tabs).map(([key, tabName]) => (
            <Tab
              key={key}
              onClick={() => {
                setSelectedTab(tabName)
                navigate(`../${tabName}`, { relative: "path", replace: true })
              }}
              icon={TAB_ICONS[key as keyof typeof Tabs]}
            >
              {titlecase(tabName)}
            </Tab>
          ))}
        </TabList>
        <TabPanels>
          <CustomTabPanel name={Tabs.DETAILS} currentTab={selectedTab}>
            <DetailsView stages={lastPublishedVersions} trackerEvents={trackerEvents} />
          </CustomTabPanel>
          <CustomTabPanel name={Tabs.VERSIONS} currentTab={selectedTab}>
            <VersionsView events={events} />
          </CustomTabPanel>
          <CustomTabPanel name={Tabs.EVENTS} currentTab={selectedTab}>
            <EventsPanel eventsList={eventsList} />
          </CustomTabPanel>
          <CustomTabPanel name={Tabs.CONFIGURATION} currentTab={selectedTab}>
            {customer && project && deliverable ? (
              <ConfigurationEditor
                customer={customer}
                project={project}
                deliverable={deliverable}
                stages={STAGES_ORDER}
              />
            ) : null}
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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>({
    failure: true,
    pending: true,
    timeout: true,
    success: true,
  })
  const [opFilter, setOpFilter] = useState()

  const visibleEvents = eventsList.filter(e => {
    const isInRange = isEventInRange(startRange, e.start) && isEventInRange(endRange, e.failure || e.success)
    const isStatusInFilter =
      (e.success && statusFilter.success) ||
      (e.failure && statusFilter.failure) ||
      (isTimedOut(e) && statusFilter.timeout) ||
      (isPending(e) && statusFilter.pending)

    return isInRange && isStatusInFilter
  })

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
    <Card className="mt-6 p-0">
      <div className="sticky px-6 pt-6 inset-0 z-10 bg-tremor-background dark:bg-dark-tremor-background border-b-tremor-border dark:border-b-dark-tremor-background-subtle border-b rounded-t-tremor-default">
        <Flex className="space-x-4" justifyContent="start" alignItems="center">
          <DateRangePicker
            placeholder="Filter start dates..."
            selectPlaceholder="Range..."
            enableYearNavigation
            onValueChange={setStartRange}
          />
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
            <DateRangePicker
              placeholder="Filter end dates..."
              selectPlaceholder="Range..."
              enableYearNavigation
              onValueChange={setEndRange}
            />
          </AccordionBody>
        </Accordion>
      </div>
      <div className="px-6">
        <EventsView events={visibleEvents} />
      </div>
    </Card>
  )
}

// useEffect(() => {
//   if (!userDb) {
//     return
//   }

//   CouchdbClient.db(userDb)
//     .design(designDoc)
//     .view<(string | undefined)[], EventGroup & CouchdbDoc>("grouped-events", {
//       reduce: true,
//       group: true,
//       start_key: [customer, project, deliverable],
//       end_key: [customer, project, deliverable, "\uffff"],
//     })
//     .then(resp => {
//       const groupedEvents: VersionEvents = {}
//       const eventsList: EventGroup[] = []
//       resp.rows.forEach(row => {
//         const partialId = row.key.pop()
//         if (partialId === undefined) {
//           return
//         }
//         const value = row.value as EventGroup
//         eventsList.push(value)
//         value.partialId = partialId
//         groupedEvents[value.version] ??= []
//         groupedEvents[value.version].push(value)
//       })
//       setEvents(groupedEvents)
//       setEventsList(eventsList)

//       if (eventsList.length === 0) {
//         setNotFound(true)
//       }
//     })
// }, [CouchdbClient, customer, deliverable, designDoc, project, userDb])

// useEffect(() => {
//   if (!userDb) {
//     return
//   }

//   CouchdbClient.db(userDb)
//     .design(designDoc)
//     .viewQueries<(string | undefined)[], EventDoc>("latest-published-version", {
//       queries: Object.values(STAGE_NAMES).map(stageName => ({
//         reduce: false,
//         include_docs: true,
//         start_key: [customer, project, deliverable, stageName],
//         end_key: [customer, project, deliverable, stageName],
//       })),
//     })
//     .then(resp => {
//       const map: StageInfoMap = {}
//       resp.results
//         .map(res => ({
//           ...res,
//           rows: [...res.rows.sort((a, b) => semverCompare(a.doc?.version as string, b.doc?.version as string))],
//         }))
//         .flatMap(res => res.rows)
//         .forEach(row => {
//           const stageName = row.key.pop()
//           if (isStageName(stageName) && row.doc) {
//             map[stageName] = {
//               latestVersion: row.value as string,
//               timestamp: row.doc.timestamp,
//               configurationId: row.doc.config_id as string,
//               repository: row.doc.repository,
//             }
//           }
//         })
//       setLastPublishedVersions(map)
//     })
// }, [CouchdbClient, customer, deliverable, designDoc, project, userDb])
