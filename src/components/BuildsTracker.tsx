import { IconCircleCheckFilled, IconCircleXFilled, IconHelpCircleFilled } from "@tabler/icons-react"
import { Color, Flex, Icon, Text, Title, Tracker } from "@tremor/react"
import { DateTime } from "luxon"

import { Skeleton } from "components"
import { memo, useMemo } from "react"
import { EventGroup } from "types"
import { formatTimestamp, isTimedOut, sortEventGroupsByTime } from "utils"

const MAX_TRACKED_EVENTS = 36

interface TrackerDatum {
  color: Color
  tooltip?: string
}

const TrackerData: Record<string, TrackerDatum> = {
  SUCCESS: {
    color: "emerald",
    tooltip: "Successful",
  },
  FAILURE: {
    color: "rose",
    tooltip: "Failed",
  },
  TIMED_OUT: {
    color: "gray",
    tooltip: "Timed out",
  },
  IN_PROGRESS: {
    color: "yellow",
    tooltip: "In progress",
  },
  EMPTY: {
    color: "neutral",
  },
}

export type BuildsTrackerProps = {
  trackerEvents: EventGroup[]
}

export const BuildsTracker = memo(({ trackerEvents }: BuildsTrackerProps) => {
  const sortedEvents = useMemo(
    () =>
      trackerEvents.sort(sortEventGroupsByTime).slice(0, Math.min(trackerEvents.length, MAX_TRACKED_EVENTS)).reverse(),
    [trackerEvents]
  )

  const trackerData: TrackerDatum[] = useMemo(
    () =>
      new Array(MAX_TRACKED_EVENTS - sortedEvents.length).fill(TrackerData.EMPTY).concat(
        sortedEvents.map(eg => {
          const tooltip = eg.start?.timestamp && formatTimestamp(eg.start.timestamp, DateTime.DATETIME_MED)
          if (eg.failure) {
            return { ...TrackerData.FAILURE, tooltip }
          }

          if (eg.success) {
            return { ...TrackerData.SUCCESS, tooltip }
          }

          if (isTimedOut(eg)) {
            return { ...TrackerData.TIMED_OUT, tooltip }
          }

          return { ...TrackerData.IN_PROGRESS, tooltip }
        })
      ),
    [sortedEvents]
  )

  const firstTs = sortedEvents.at(0)?.start?.timestamp
  const lastTs = sortedEvents.at(sortedEvents.length - 1)?.start?.timestamp

  return (
    <>
      <Flex>
        <Title className="w-full">Builds overview</Title>
        <Flex justifyContent="end" className="-space-x-2 -mr-2">
          <Icon icon={IconCircleCheckFilled} {...TrackerData.SUCCESS} />
          <Icon icon={IconHelpCircleFilled} {...TrackerData.TIMED_OUT} />
          <Icon icon={IconCircleXFilled} {...TrackerData.FAILURE} />
        </Flex>
      </Flex>
      {trackerEvents.length > 0 ? (
        <>
          <Tracker data={trackerData} className="mt-2" />
          <Flex className="mt-2">
            <Text>{formatTimestamp(firstTs, DateTime.DATE_MED)}</Text>
            <Text>{formatTimestamp(lastTs, DateTime.DATE_MED)}</Text>
          </Flex>
        </>
      ) : (
        <>
          <Tracker data={new Array(MAX_TRACKED_EVENTS).fill(TrackerData.EMPTY)} className="mt-2" />
          <Flex className="mt-2">
            <Skeleton className="h-tremor-default w-20" />
            <Skeleton className="h-tremor-default w-20" />
          </Flex>
        </>
      )}
    </>
  )
})
