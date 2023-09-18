import { IconBrandGithub } from "@tabler/icons-react"
import { Button, Card, Col, Flex, Grid, Title } from "@tremor/react"
import { lazy } from "react"
import { Link } from "react-router-dom"
import urlJoin from "url-join"

import { EventGroup } from "types"

const EventsView = lazy(() => import("app/deliverable/events"))

export type VersionViewProps = {
  events: VersionEvents
}

export type VersionEvents = Record<string, EventGroup[]>
function VersionsView({ events }: VersionViewProps) {
  function sortEvents(a: [string, EventGroup[]], b: [string, EventGroup[]]) {
    function semverCompare(a: string, b: string) {
      if (a.startsWith(b + "-")) {
        return -1
      }
      if (b.startsWith(a + "-")) {
        return 1
      }
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: "case", caseFirst: "upper" })
    }

    return semverCompare(a[0], b[0])
  }

  return (
    <>
      {Object.entries(events)
        .sort(sortEvents)
        .reverse()
        .map(([version, e]) => (
          <Grid numItems={8} key={version} className="mt-6 gap-6">
            <Col numColSpanMd={1}>
              <Flex flexDirection="col" alignItems="start" className="mt-6 sticky inset-0 top-6">
                <Title>{version}</Title>
                <Link to={e[0].repository ? urlJoin(e[0].repository, `./tree/v${version}`) : ""} className="mt-2 ml-1">
                  <Button icon={IconBrandGithub} variant="light">
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
