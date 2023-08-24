import { CouchdbDoc } from "@iotinga/ts-backpack-couchdb-client"
import { IconBrandGithub, IconChevronRight, IconCloudDownload, IconExternalLink } from "@tabler/icons-react"
import {
  Button,
  Card,
  Flex,
  Grid,
  Icon,
  List,
  ListItem,
  Metric,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
  Text,
  Title,
} from "@tremor/react"
import { DateTime } from "luxon"
import { useContext, useEffect, useState } from "react"
import { Link, useLocation, useParams } from "react-router-dom"

import { EventsView } from "app/deliverable/events"
import { VersionEvents, VersionsView } from "app/deliverable/versions"
import { Breadcrumbs, BreadcrumbsElement } from "components"
import { AppContext, AuthContext } from "contexts"
import { EventDoc, EventGroup, StageInfoMap } from "types"
import { isStageName } from "utils"

const ChevronIcon = () => <IconChevronRight height={18} />
const DownloadIcon = () => <IconCloudDownload size={32} />

function Page() {
  const location = useLocation()
  const crumbs: BreadcrumbsElement[] = [
    {
      name: location.pathname.split("/").pop() as string,
      route: location.pathname,
    },
  ]

  const params = useParams()

  const { CouchdbManager } = useContext(AppContext)
  const { username } = useContext(AuthContext)

  const dbName = "userdb-" + Buffer.from(username as string).toString("hex")
  const designDoc = username as string

  const [events, setEvents] = useState<VersionEvents>({})
  const [lastPublishedVersions, setLastPublishedVersions] = useState<StageInfoMap>({})

  useEffect(() => {
    CouchdbManager.db(dbName)
      .design(designDoc)
      .view<(string | undefined)[], EventDoc>("latest-published-version", {
        reduce: false,
        include_docs: true,
        start_key: [params.customer, params.project, params.deliverable],
        end_key: [params.customer, params.project, params.deliverable, "\uffff"],
      })
      .then(resp => {
        const map: StageInfoMap = {}
        resp.rows.forEach(row => {
          const stageName = row.key.pop()
          if (isStageName(stageName) && row.doc) {
            map[stageName] = {
              latestVersion: row.value as string,
              timestamp: row.doc.timestamp,
              configurationId: row.doc.config_id as string,
              repository: row.doc.repository,
            }
          }
        })
        setLastPublishedVersions(map)
      })

    CouchdbManager.db(dbName)
      .design(designDoc)
      .view<(string | undefined)[], EventGroup & CouchdbDoc>("grouped-events", {
        reduce: true,
        group: true,
        start_key: [params.customer, params.project, params.deliverable],
        end_key: [params.customer, params.project, params.deliverable, "\uffff"],
      })
      .then(resp => {
        const groupedEvents: VersionEvents = {}
        resp.rows.forEach(row => {
          const partialId = row.key.pop()
          if (partialId === undefined) {
            return
          }
          const value = row.value as EventGroup
          value.partialId = partialId
          groupedEvents[value.version] ??= []
          groupedEvents[value.version].push(value)
        })
        // groupedEvents.sort(sortEventGroups)
        setEvents(groupedEvents)
      })
  }, [CouchdbManager, dbName, designDoc, params])

  return (
    <>
      <Flex>
        <div>
          <Metric className="text-left">Deliverable</Metric>
          <Text className="text-left">{params.deliverable}</Text>
        </div>
        <Breadcrumbs crumbs={crumbs} />
      </Flex>

      <TabGroup className="mt-6">
        <TabList variant="line">
          <Tab id="details">Details</Tab>
          <Tab>Versions</Tab>
          <Tab>Events</Tab>
          <Tab>Artifacts</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <Grid
              numItemsMd={2}
              numItemsLg={Math.min(3, Object.entries(lastPublishedVersions).length)}
              className="gap-6 mt-6"
            >
              {Object.entries(lastPublishedVersions).map(([stageName, info]) => (
                <Card key={stageName}>
                  <Metric>{stageName}</Metric>
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
            <Grid numItems={2} className="gap-6">
              <div className="mt-6">
                <Card>
                  <Icon icon={IconBrandGithub} variant="light" size="xl" color="blue" />
                  <Title className="mt-6">Repository</Title>
                  <Text className="mt-2">The source code for this deliverable can be found at the following link.</Text>
                  <Flex className="mt-6 pt-4 border-t">
                    <Link
                      to={
                        (Object.values(lastPublishedVersions)[0] &&
                          Object.values(lastPublishedVersions)[0].repository) ||
                        "#"
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="xs" variant="light" icon={IconExternalLink} iconPosition="right">
                        Visit
                      </Button>
                    </Link>
                  </Flex>
                </Card>
              </div>
            </Grid>
          </TabPanel>
          <TabPanel>
            <VersionsView events={events} />
          </TabPanel>
          <TabPanel>
            <Card className="mt-6">
              <EventsView events={Object.values(events).flat()} />
            </Card>
          </TabPanel>
          <TabPanel>
            {/* <Grid numItemsMd={3} className="gap-4 mt-6">
              <ArtifactCard />
              <ArtifactCard />
              <ArtifactCard />
              <ArtifactCard />
              <ArtifactCard />
              <ArtifactCard />
              <ArtifactCard />
              <ArtifactCard />
            </Grid> */}
            {/* <ArtifactsTable /> */}
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </>
  )
}

export default Page
