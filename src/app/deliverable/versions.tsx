import { IconBrandGithub } from "@tabler/icons-react"
import { Button, Card, Col, Flex, Grid, Title } from "@tremor/react"
import { lazy, useMemo } from "react"
import { Link } from "react-router-dom"
import urlJoin from "url-join"

import { EventGroup } from "types"
import { semverCompare } from "utils"

const EventsView = lazy(() => import("app/deliverable/events"))

export type VersionViewProps = {
  events: VersionEvents
}

export type VersionEvents = Record<string, EventGroup[]>
function VersionsView({ events }: VersionViewProps) {
  const sortEvents = (a: [string, EventGroup[]], b: [string, EventGroup[]]) => semverCompare(a[0], b[0])

  const sortedEvents = useMemo(() => Object.entries(events).sort(sortEvents).reverse(), [events])

  return (
    <>
      {sortedEvents.map(([version, e]) => (
        <Grid numItems={8} key={version} className="mt-6 gap-6">
          <Col numColSpanMd={1}>
            <Flex flexDirection="col" alignItems="start" className="mt-6 sticky inset-0 top-6">
              <Title>{version}</Title>
              <Link to={e[0].repository ? urlJoin(e[0].repository, `./tree/v${version}`) : ""} className="mt-2 ml-1">
                <Button icon={IconBrandGithub} variant="light" tooltip="See the source code for this version">
                  Github
                </Button>
              </Link>
            </Flex>
          </Col>
          <Col numColSpan={8} numColSpanMd={7}>
            <Card>
              <EventsView events={e} />
            </Card>
          </Col>
        </Grid>
      ))}
    </>
  )
}
export default VersionsView
