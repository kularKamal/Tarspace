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
import { FC, useRef } from "react"

import { EventGroup, EventType } from "types"

export type EventsViewProps = {
  events: EventGroup[]
}

export enum EventStateMessage {
  IN_PROGRESS = "In progress",
  SUCCESS = "Success",
  FAILURE = "Failure",
}

export const EventsView: FC<EventsViewProps> = (props: EventsViewProps) => {
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

  const OperationIcon: Record<EventType, TablerIcon> = {
    build: IconTool,
    publish: IconCubeSend,
  }

  return (
    <Table className="table-fixed">
      <TableHead>
        <TableRow>
          <TableHeaderCell>Partial ID</TableHeaderCell>
          <TableHeaderCell className="text-center">Operation</TableHeaderCell>
          <TableHeaderCell>Start</TableHeaderCell>
          <TableHeaderCell>End</TableHeaderCell>
          <TableHeaderCell>State</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {props.events.sort(sortEventGroups).map(d => (
          <TableRow key={d.partialId}>
            <>
              <TableCell className="max-w-[30vh]">
                <Text className="overflow-hidden truncate">{d.partialId}</Text>
              </TableCell>
              <TableCell className="text-center">
                <Icon icon={OperationIcon[d.type]} tooltip={d.type} size="lg" />
              </TableCell>
              <TableCell>
                <Flex justifyContent="start">
                  <IconCalendar className="mr-2" />
                  <Text>{formatTimestamp(d.start?.timestamp)}</Text>
                </Flex>
                <Flex justifyContent="start">
                  <IconClock className="mr-2" />
                  <Text>{formatTimestamp(d.start?.timestamp, DateTime.TIME_SIMPLE)}</Text>
                </Flex>
              </TableCell>
              <TableCell>
                {d.failure || d.success ? (
                  <>
                    <Flex justifyContent="start">
                      <IconCalendar className="mr-2" />
                      <Text>
                        {d.failure ? formatTimestamp(d.failure?.timestamp) : formatTimestamp(d.success?.timestamp)}
                      </Text>
                    </Flex>
                    <Flex justifyContent="start">
                      <IconClock className="mr-2" />
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
            </>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
