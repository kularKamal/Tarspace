import {
  IconBrandGithub,
  IconCircleCheckFilled,
  IconCircleXFilled,
  IconExternalLink,
  IconHelpCircleFilled,
} from "@tabler/icons-react"
import {
  Button,
  Card,
  Color,
  Divider,
  Flex,
  Grid,
  Icon,
  List,
  ListItem,
  Metric,
  Text,
  Title,
  Tracker,
} from "@tremor/react"
import { DateTime } from "luxon"
import { Link } from "react-router-dom"

import { formatTimestamp, sortEventGroupsByTime } from "app/deliverable/events"
import { EventGroup, StageInfoMap } from "types"
import { titlecase } from "utils"
import { useMemo } from "react"

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
}

export type DetailsViewProps = {
  stages: StageInfoMap
  trackerEvents: EventGroup[]
}

function DetailsView({ stages, trackerEvents }: DetailsViewProps) {
  const sortedEvents = useMemo(
    () => trackerEvents.sort(sortEventGroupsByTime).slice(0, Math.min(trackerEvents.length, 36)).reverse(),
    [trackerEvents]
  )

  const trackerData: TrackerDatum[] = useMemo(
    () =>
      sortedEvents.map(eg => {
        const tooltip = eg.start?.timestamp && formatTimestamp(eg.start.timestamp, DateTime.DATETIME_MED)
        if (eg.failure) {
          return { ...TrackerData.FAILURE, tooltip }
        }

        if (eg.success) {
          return { ...TrackerData.SUCCESS, tooltip }
        }

        return { ...TrackerData.TIMED_OUT, tooltip }
      }),
    [sortedEvents]
  )

  const firstTs = sortedEvents.at(0)?.start?.timestamp
  const lastTs = sortedEvents.at(sortedEvents.length - 1)?.start?.timestamp

  return (
    <>
      <Grid numItemsMd={2} numItemsLg={Math.min(3, Object.entries(stages).length)} className="gap-6 mt-6">
        {Object.entries(stages).map(([stageName, info]) => (
          <Card key={stageName}>
            <Metric>{titlecase(stageName)}</Metric>
            <List className="mt-4">
              <ListItem>
                <Flex>
                  <Text>Current installed version</Text>
                  <Text>{info.latestVersion}</Text>
                </Flex>
              </ListItem>
              <ListItem>
                <Flex>
                  <Text>Last update date</Text>
                  <Text>{DateTime.fromISO(info.timestamp).toLocaleString()}</Text>
                </Flex>
              </ListItem>
              <ListItem>
                <Flex>
                  <Text>Configuration</Text>
                  <Link to="">
                    <Text color="blue">LATEST</Text>
                  </Link>
                </Flex>
              </ListItem>
            </List>
          </Card>
        ))}
      </Grid>
      <Divider className="lg:hidden" />
      <Grid numItemsMd={2} className="gap-6 lg:mt-6">
        <Card>
          <Flex justifyContent="start" className="space-x-6" alignItems="start">
            <Icon icon={IconBrandGithub} variant="light" size="lg" color="blue" />
            <div>
              <Title className="">Repository</Title>
              <Text className="mt-1">The source code for this deliverable can be found at the following link.</Text>
            </div>
          </Flex>
          <Flex className="mt-6 pt-4 border-t">
            <Link
              to={(Object.values(stages)[0] && Object.values(stages)[0].repository) || "#"}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="xs" variant="light" icon={IconExternalLink} iconPosition="right">
                Visit
              </Button>
            </Link>
          </Flex>
        </Card>
        <Card>
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
            <Flex justifyContent="around" className="h-full">
              <Flex flexDirection="col" className="h-full w-1/4" justifyContent="center">
                <Text>No events found</Text>
              </Flex>
            </Flex>
          )}
        </Card>
      </Grid>
    </>
  )
}

export default DetailsView
