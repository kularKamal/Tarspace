import { Badge, BadgeProps } from "@tremor/react"
import { RefAttributes } from "react"

import { EventGroup } from "types"
import { isInProgress, isTimedOut } from "utils"

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

function BadgeFactory(text: string, props: BadgeProps & RefAttributes<HTMLSpanElement>) {
  return <Badge {...props}>{text}</Badge>
}

export function getBadge(eventGroup: EventGroup) {
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
