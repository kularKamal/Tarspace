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
import { Configuration } from "config"
import { DateTime, LocaleOptions } from "luxon"
import { FC, RefAttributes, memo } from "react"

import { EventGroup, EventOperation } from "types"
import { titlecase } from "utils"

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

const OPERATION_ICONS: Record<EventOperation, TablerIcon> = {
  build: IconTool,
  publish: IconCubeSend,
}

function BadgeFactory(text: string, props: BadgeProps & RefAttributes<HTMLSpanElement>) {
  return <Badge {...props}>{text}</Badge>
}

export type EventsViewProps = {
  events: EventGroup[]
}
export const EventsView: FC<EventsViewProps> = (props: EventsViewProps) => {
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
        {props.events.sort(sortEventGroupsByTime).map(d => (
          <EventRow event={d} key={d.partialId} />
        ))}
      </TableBody>
    </Table>
  )
}

const EventRow: FC<{ event: EventGroup }> = memo(({ event }) => (
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

export function formatTimestamp(
  timestamp?: string,
  formatOpts?: Intl.DateTimeFormatOptions | undefined,
  opts?: LocaleOptions | undefined
) {
  if (timestamp === undefined) {
    return "Unknown"
  }

  return DateTime.fromISO(timestamp).toLocaleString(formatOpts, opts)
}

function getBadge(eventGroup: EventGroup) {
  if (!eventGroup.success && !eventGroup.failure) {
    const startTs = eventGroup.start?.timestamp ? DateTime.fromISO(eventGroup.start?.timestamp) : DateTime.fromMillis(0)
    if (startTs.diffNow().negate() > Configuration.app.event_timeout) {
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

export function sortEventGroupsByTime(a: EventGroup, b: EventGroup) {
  const aStop = a.success || a.failure
  const bStop = b.success || b.failure

  const aStartTS = a.start ? DateTime.fromISO(a.start.timestamp) : DateTime.fromMillis(0)
  const bStartTS = b.start ? DateTime.fromISO(b.start.timestamp) : DateTime.fromMillis(0)

  const aStopTS = aStop ? DateTime.fromISO(aStop.timestamp) : aStartTS
  const bStopTS = bStop ? DateTime.fromISO(bStop.timestamp) : bStartTS

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
