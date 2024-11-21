import { DateTime, LocaleOptions } from "luxon"

import { Configuration } from "config"
import { EventGroup } from "types"

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

export function isTimedOut(eventGroup: EventGroup) {
  const startTs = eventGroup.start?.timestamp ? DateTime.fromISO(eventGroup.start?.timestamp) : DateTime.fromMillis(0)
  return (
    eventGroup.success === undefined &&
    eventGroup.failure === undefined &&
    startTs.diffNow().negate() > Configuration.app.eventTimeout
  )
}

export function isPending(eventGroup: EventGroup) {
  return !eventGroup.success && !eventGroup.failure
}
