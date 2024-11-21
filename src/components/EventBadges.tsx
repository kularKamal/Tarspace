import { Badge, BadgeProps } from "@tremor/react"
import { RefAttributes } from "react"

import { EventGroup } from "types"
import { isPending, isTimedOut } from "utils"

export type EventState = "success" | "failure" | "pending" | "timeout"

export const EventStateMessages: Record<EventState, string> = {
  pending: "In progress",
  success: "Success",
  failure: "Failure",
  timeout: "Timed out",
}

export const EventStateBadges: Record<EventState, JSX.Element> = {
  success: BadgeFactory(EventStateMessages.success, { color: "emerald", size: "xl" }),
  failure: BadgeFactory(EventStateMessages.failure, { color: "red", size: "xl" }),
  pending: BadgeFactory(EventStateMessages.pending, { color: "yellow", size: "xl" }),
  timeout: BadgeFactory(EventStateMessages.timeout, { color: "gray", size: "xl" }),
}

function BadgeFactory(text: string, props: BadgeProps & RefAttributes<HTMLSpanElement>) {
  return <Badge {...props}>{text}</Badge>
}

export function getBadge(eventGroup: EventGroup) {
  if (isPending(eventGroup)) {
    if (isTimedOut(eventGroup)) {
      return EventStateBadges.timeout
    }
    return EventStateBadges.pending
  }
  if (eventGroup.success) {
    return EventStateBadges.success
  }
  return EventStateBadges.failure
}
