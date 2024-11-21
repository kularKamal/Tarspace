import { IconRocketOff } from "@tabler/icons-react"
import { Badge, Bold, Flex, Grid, Icon, TableCell, TableRow, Text, Title } from "@tremor/react"
import { memo, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { twMerge } from "tailwind-merge"

import { ClickableCard, EventState, Skeleton } from "components"
import { AppContext, AuthContext } from "contexts"
import { useHtmlClass } from "hooks"
import { DeliverableDoc, EventDoc, STAGES_ORDER, STAGE_NAMES, StageInfoMap } from "types"
import { formatTimestamp, isStageName, titlecase } from "utils"

type LastPublishedVersionMap = Record<string, StageInfoMap>
type LastBuildState = Record<string, Record<string, [EventState, string]>>

const backgroundClass: Record<EventState, string> = {
  success: "bg-opacity-10 dark:bg-opacity-10 bg-green-500 border-green-700 dark:bg-green-500 dark:border-green-700",
  failure: "bg-opacity-10 dark:bg-opacity-10 bg-rose-500 border-rose-700 dark:bg-rose-500 dark:border-rose-700",
  pending: "bg-opacity-10 dark:bg-opacity-10 bg-amber-500 border-amber-700 dark:bg-amber-500 dark:border-amber-700",
  timeout: "bg-opacity-10 dark:bg-opacity-10 bg-gray-500 border-gray-700 dark:bg-gray-500 dark:border-gray-700",
}

const textClass: Record<EventState, string> = {
  success: "text-green-700 dark:text-green-500",
  failure: "text-rose-700 dark:text-rose-500",
  pending: "text-amber-700 dark:text-amber-500",
  timeout: "text-gray-700 dark:text-gray-500",
}

export default function Page() {
  const { username } = useContext(AuthContext)

  const designDoc = username as string

  const [deliverablesKeys, setDeliverablesKeys] = useState<string[][]>([])
  const [deliverableDocs, setDeliverableDocs] = useState<DeliverableDoc[]>([])
  const [lastPublishedVersions, setLastPublishedVersions] = useState<LastPublishedVersionMap | null>(null)
  const [lastBuildState, setLastBuildState] = useState<LastBuildState | null>(null)

  useHtmlClass(["scrollbar-hidden", "dark"])

  const getDeliverableBuildState = useCallback(
    (deliverable: DeliverableDoc): EventState => {
      if (!lastBuildState || !lastBuildState[deliverable.project]) {
        return "timeout"
      }

      const artifactStates = lastBuildState[deliverable.project]
      for (const a of deliverable.artifacts) {
        if (!artifactStates[a]) {
          continue
        }

        const [state, _] = artifactStates[a]

        if (state !== "success") {
          return state
        }
      }

      return "success"
    },
    [lastBuildState]
  )

  const sortDeliverablesByLastBuild = useCallback(
    (a: DeliverableDoc, b: DeliverableDoc): number => {
      if (!lastBuildState || !lastBuildState[a.project] || !lastBuildState[b.project]) {
        return 1
      }

      const aTimestamp = a.artifacts
        .map(artifact => lastBuildState[a.project][artifact][1])
        .reduce((acc, current) => (current >= acc ? current : acc))

      const bTimestamp = b.artifacts
        .map(artifact => lastBuildState[b.project][artifact][1])
        .reduce((acc, current) => (current >= acc ? current : acc))

      return -aTimestamp.localeCompare(bTimestamp)
    },
    [lastBuildState]
  )

  const sortedDeliverables = useMemo(
    () => deliverableDocs.sort(sortDeliverablesByLastBuild),
    [deliverableDocs, sortDeliverablesByLastBuild]
  )

  function urlFromDeliverableDoc(deliverable: DeliverableDoc) {
    const projectFragment = deliverable.project.split("@").reverse().join("/")
    return `/deliverables/${projectFragment}/${deliverable.name}`
  }

  return (
    <Grid numItemsMd={9} className="gap-1 text-tremor-label">
      {sortedDeliverables.map(deliverable => (
        <Link to={urlFromDeliverableDoc(deliverable)} key={urlFromDeliverableDoc(deliverable)}>
          {lastPublishedVersions ? (
            <DashboardCard
              deliverable={deliverable}
              lastPublishedVersion={lastPublishedVersions[deliverable.name]}
              buildState={getDeliverableBuildState(deliverable)}
            />
          ) : null}
        </Link>
      ))}
    </Grid>
  )
}

const LoadingStageRow = () => (
  <TableRow>
    <TableCell>
      <Skeleton className="h-tremor-default w-16" />
    </TableCell>
    <TableCell className="text-center">
      <Skeleton className="h-tremor-default w-16" />
    </TableCell>
    <TableCell className="text-right">
      <Skeleton className="h-tremor-default w-16" />
    </TableCell>
  </TableRow>
)

const EmptyStageCard = () => (
  <Flex flexDirection="col" className="h-full space-y-8 mt-8" justifyContent="center">
    <Flex className="space-x-4 h-full" justifyContent="center">
      <Icon icon={IconRocketOff} size="xl" className="text-tremor-content-subtle" />

      <div>
        <Title>No deployment found</Title>
        <Text className="text-tremor-content-subtle">This deliverable has never been deployed.</Text>
      </div>
    </Flex>
  </Flex>
)

type DashboardCardProps = {
  buildState: EventState
  deliverable: DeliverableDoc
  lastPublishedVersion: LastPublishedVersionMap[keyof LastPublishedVersionMap]
}
const DashboardCard = memo(({ lastPublishedVersion, deliverable, buildState }: DashboardCardProps) => {
  const getBgClass = (state: EventState, className: string) =>
    twMerge(backgroundClass[state] || backgroundClass["timeout"], className)

  const getTextClass = (state: EventState, className: string) =>
    twMerge(textClass[state] || textClass["timeout"], className)

  return (
    <ClickableCard className={getBgClass(buildState, "px-2 py-1 border-2 h-full")} data-state={buildState}>
      <h4 className={getTextClass(buildState, "font-semibold truncate")}>{deliverable.name}</h4>
      <h4 className={getTextClass(buildState, "font-semibold truncate text-tremor-dashboard")}>
        {deliverable.project}
      </h4>
      {lastPublishedVersion && (
        <Grid className="mt-2 w-full gap-1" numItems={3}>
          {Object.keys(lastPublishedVersion).length > 0 ? (
            Object.values(STAGE_NAMES)
              .sort((a, b) => STAGES_ORDER.indexOf(a) - STAGES_ORDER.indexOf(b))
              .map(stageName =>
                stageName && lastPublishedVersion[stageName] ? (
                  <Flex className="space-y-1" alignItems="center" flexDirection="col" key={stageName + deliverable}>
                    <Bold className={getTextClass(buildState, "text-tremor-dashboard")}>{titlecase(stageName)}</Bold>
                    <Badge color="gray" size="xs" className="[&>p]:text-tremor-label">
                      {lastPublishedVersion[stageName]!.latestVersion}
                    </Badge>
                    <p className="text-tremor-dashboard dark:text-dark-tremor-content text-tremor-dashboard">
                      {formatTimestamp(lastPublishedVersion[stageName]!.timestamp)}
                    </p>
                  </Flex>
                ) : (
                  <div key={stageName + deliverable} />
                )
              )
          ) : (
            <>
              <LoadingStageRow />
              <LoadingStageRow />
            </>
          )}
        </Grid>
      )}
    </ClickableCard>
  )
})
