import { IconCalendar, IconClock, IconCubeSend, IconTool, Icon as TablerIcon } from "@tabler/icons-react"
import { Flex, Icon, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow, Text } from "@tremor/react"
import { DateTime } from "luxon"
import { memo, useMemo } from "react"
import { Link, useParams } from "react-router-dom"

import { getBadge, Skeleton } from "components"
import { EventGroup, EventOperation } from "types"
import { formatTimestamp, sortEventGroupsByTime, titlecase } from "utils"
import { DeliverableInformations } from "types/api"
import useSWR, { mutate } from "swr"
import { Logger } from "@iotinga/ts-backpack-common"
import axios from "axios"

export const OPERATION_ICONS: Record<EventOperation, TablerIcon> = {
  build: IconTool,
  publish: IconCubeSend,
}

export type EventsViewProps = {
  events: EventGroup[]
}
function EventsView(props: EventsViewProps) {
  const sorted = useMemo(() => props.events.sort(sortEventGroupsByTime), [props.events])

  const { customer, project, deliverable } = useParams()
  // Fetch project information
  const {
    data: deliverableInfo,
    isLoading,
    error,
  } = useSWR("a", async () => {
    const response = await axios.get<DeliverableInformations>(
      `http://localhost:8000/space/api/v1/customers/${customer}/projects/${project}/deliverables/${deliverable}`,
      { withCredentials: true }
    )
    return response.data
  })

  if (isLoading) {
    return <div>Loading customers...</div> // Indication during loading
  }

  if (error) {
    return <div>Error fetching customers: {error.message}</div> // Display an error if the API fails
  }

  if (!deliverableInfo) {
    return <Skeleton className="h-screen w-full" />
  }

  return (
    <Table className="table-fixed">
      <TableHead>
        <TableRow>
          <TableHeaderCell>Partial ID</TableHeaderCell>
          <TableHeaderCell>Stage</TableHeaderCell>
          <TableHeaderCell className="text-center">Operation</TableHeaderCell>
          <TableHeaderCell>Start</TableHeaderCell>
          <TableHeaderCell>End</TableHeaderCell>
          <TableHeaderCell>State</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {sorted.map(d => (
          <EventRow event={d} key={d.partialId} />
        ))}
      </TableBody>
    </Table>
  )
}
export default EventsView

type EventRowProps = { event: EventGroup }
const EventRow = memo<EventRowProps>(({ event }) => (
  <TableRow key={event.partialId}>
    <>
      <TableCell className="max-w-[30vh]">
        <Text className="overflow-hidden truncate">{event.partialId}</Text>
      </TableCell>
      <TableCell>
        <Text>{event.stage ? titlecase(event.stage) : "-"}</Text>
      </TableCell>
      <TableCell className="text-center">
        <Icon icon={OPERATION_ICONS[event.type]} tooltip={titlecase(event.type)} size="lg" />
      </TableCell>
      <TableCell>
        <Flex justifyContent="start">
          <IconCalendar className="mr-2" />
          <Text>{formatTimestamp(event.start?.timestamp)}</Text>
        </Flex>
        <Flex justifyContent="start">
          <IconClock className="mr-2" />
          <Text>{formatTimestamp(event.start?.timestamp, DateTime.TIME_SIMPLE)}</Text>
        </Flex>
      </TableCell>
      <TableCell>
        {event.failure || event.success ? (
          <>
            <Flex justifyContent="start">
              <IconCalendar className="mr-2" />
              <Text>
                {event.failure ? formatTimestamp(event.failure?.timestamp) : formatTimestamp(event.success?.timestamp)}
              </Text>
            </Flex>
            <Flex justifyContent="start">
              <IconClock className="mr-2" />
              <Text>{getFormattedTime(event) || "In progress"}</Text>
            </Flex>
          </>
        ) : (
          <Text>-</Text>
        )}
      </TableCell>
      <TableCell>{getBadge(event)}</TableCell>
    </>
  </TableRow>
))

function getFormattedTime(eventGroup: EventGroup) {
  if (eventGroup.failure) {
    return formatTimestamp(eventGroup.failure.timestamp, DateTime.TIME_SIMPLE)
  }
  if (eventGroup.success) {
    return formatTimestamp(eventGroup.success.timestamp, DateTime.TIME_SIMPLE)
  }

  return null
}
