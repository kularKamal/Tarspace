import { IconCalendar, IconClock, IconCubeSend, IconTool, Icon as TablerIcon } from "@tabler/icons-react"
import {
  Badge,
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
import { DateTime, LocaleOptions } from "luxon"
import { FC, memo } from "react"

import { EventGroup, EventType } from "types"
import { titlecase } from "utils"

export type EventsViewProps = {
  events: EventGroup[]
}

export enum EventStateMessage {
  IN_PROGRESS = "In progress",
  SUCCESS = "Success",
  FAILURE = "Failure",
}

const OPERATION_ICONS: Record<EventType, TablerIcon> = {
  build: IconTool,
  publish: IconCubeSend,
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
        <Icon icon={OPERATION_ICONS[event.type]} tooltip={event.type} size="lg" />
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
      <TableCell>
        <Badge size="xl" color={getStateColor(event)}>
          {getStateMessage(event)}
        </Badge>
      </TableCell>
    </>
  </TableRow>
))

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
        {props.events.sort(sortEventGroups).map(d => (
          <EventRow event={d} key={d.partialId} />
        ))}
      </TableBody>
    </Table>
  )
}

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
    return EventStateMessage.IN_PROGRESS
  }
  if (eventGroup.success) {
    return EventStateMessage.SUCCESS
  }
  return EventStateMessage.FAILURE
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
