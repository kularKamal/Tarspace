import { IconCalendar, IconClock, IconCubeSend, IconTool, Icon as TablerIcon } from "@tabler/icons-react"
import {
  Badge,
  BadgeProps,
  Flex,
  Icon,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
} from "@tremor/react"
import { DateTime } from "luxon"
import { RefAttributes, memo, useMemo } from "react"

import { EventGroup, EventOperation } from "types"
import { formatTimestamp, isInProgress, isTimedOut, sortEventGroupsByTime, titlecase } from "utils"

export type EventState = "success" | "failure" | "inProgress" | "timedOut"

export const EventStateMessages: Record<EventState, string> = {
  inProgress: "In progress",
  success: "Success",
  failure: "Failure",
  timedOut: "Timed out",
}

export const EventStateBadges: Record<EventState, JSX.Element> = {
  success: BadgeFactory(EventStateMessages.success, { color: "emerald", size: "xl" }),
  failure: BadgeFactory(EventStateMessages.failure, { color: "red", size: "xl" }),
  inProgress: BadgeFactory(EventStateMessages.inProgress, { color: "yellow", size: "xl" }),
  timedOut: BadgeFactory(EventStateMessages.timedOut, { color: "gray", size: "xl" }),
}

export const OPERATION_ICONS: Record<EventOperation, TablerIcon> = {
  build: IconTool,
  publish: IconCubeSend,
}

function BadgeFactory(text: string, props: BadgeProps & RefAttributes<HTMLSpanElement>) {
  return <Badge {...props}>{text}</Badge>
}

export type EventsViewProps = {
  events: EventGroup[]
}
function EventsView(props: EventsViewProps) {
  const sorted = useMemo(() => props.events.sort(sortEventGroupsByTime), [props.events])

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

function getBadge(eventGroup: EventGroup) {
  if (isInProgress(eventGroup)) {
    if (isTimedOut(eventGroup)) {
      return EventStateBadges.timedOut
    }
    return EventStateBadges.inProgress
  }
  if (eventGroup.success) {
    return EventStateBadges.success
  }
  return EventStateBadges.failure
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
