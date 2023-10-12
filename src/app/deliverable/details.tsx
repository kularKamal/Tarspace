import { IconAlertTriangle, IconBrandGithub, IconCloudDownload, IconRocket, IconSettingsOff } from "@tabler/icons-react"
import {
  Badge,
  Button,
  Card,
  Divider,
  Flex,
  Grid,
  Icon,
  List,
  ListItem,
  Metric,
  Select,
  SelectItem,
  Text,
  Title,
} from "@tremor/react"
import { DateTime } from "luxon"
import { memo, useContext, useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import urlJoin from "url-join"

import { BuildsTracker, Skeleton } from "components"
import { AppContext, AuthContext } from "contexts"
import { DeliverableDoc, EventGroup, StageInfo, StageInfoMap, StageName } from "types"
import { formatTimestamp, semverCompare, titlecase } from "utils"

export type DetailsViewProps = {
  stages: StageInfoMap
  trackerEvents: EventGroup[]
}

type VersionUploads = Record<string, string>

function DetailsView({ stages, trackerEvents }: DetailsViewProps) {
  const { customer, project, deliverable } = useParams()

  const { CouchdbManager } = useContext(AppContext)
  const { username, userDb } = useContext(AuthContext)
  const designDoc = username as string

  const [uploads, setUploads] = useState<VersionUploads>({})

  useEffect(() => {
    if (!userDb) {
      return
    }

    CouchdbManager.db(userDb)
      .design(designDoc)
      .viewQueries<(string | undefined)[], DeliverableDoc>("deliverables", {
        queries: Object.values(stages).map(stageInfo => ({
          reduce: false,
          include_docs: true,
          start_key: [customer, project, deliverable, stageInfo.latestVersion],
          end_key: [customer, project, deliverable, stageInfo.latestVersion],
        })),
      })
      .then(resp => {
        const map: VersionUploads = {}
        resp.results
          .flatMap(res => (res.rows[0].doc ? [res.rows[0].doc] : []))
          .forEach(doc => doc.uploads && (map[doc.version] = Object.values(doc.uploads)[0]))

        setUploads(map)
      })
  }, [CouchdbManager, customer, userDb, deliverable, designDoc, project, stages])

  const stagesEntries = useMemo(() => Object.entries(stages), [stages])

  return (
    <>
      <Grid numItemsMd={2} numItemsLg={Math.min(3, stagesEntries.length)} className="gap-6 mt-6">
        {stagesEntries.length === 0 ? (
          <>
            <EmptyStageCard />
            <EmptyStageCard />
          </>
        ) : (
          stagesEntries.map(([stageName, info]) => (
            <Card key={stageName}>
              <Flex flexDirection="row" justifyContent="between" alignItems="baseline">
                <Metric>{titlecase(stageName)}</Metric>
                <Link to={uploads[info.latestVersion]}>
                  <Button icon={IconCloudDownload} variant="light" size="lg" tooltip="Download deliverable files" />
                </Link>
              </Flex>
              <List className="mt-4">
                <ListItem>
                  <Flex>
                    <Text>Current version</Text>
                    <Link to={info.repository ? urlJoin(info.repository, `./tree/v${info.latestVersion}`) : ""}>
                      <Button icon={IconBrandGithub} variant="light" tooltip="See the source code for this release">
                        {info.latestVersion}
                      </Button>
                    </Link>
                  </Flex>
                </ListItem>
                <ListItem>
                  <Flex>
                    <Text>Last update date</Text>
                    <Text>{formatTimestamp(info.timestamp, DateTime.DATETIME_MED)}</Text>
                  </Flex>
                </ListItem>
              </List>
            </Card>
          ))
        )}
      </Grid>
      <Divider className="lg:hidden" />
      <Grid numItemsMd={2} className="gap-6 lg:mt-6">
        <Card>
          <BuildsTracker trackerEvents={trackerEvents} />
        </Card>
        <Card>
          <PublishCard trackerEvents={trackerEvents} stages={stages} />
        </Card>
      </Grid>
    </>
  )
}

export default DetailsView

type PublishCardProps = {
  trackerEvents: EventGroup[]
  stages: StageInfoMap
}
const PublishCard = memo<PublishCardProps>(({ trackerEvents, stages }) => {
  const versionStage: Record<string, StageName> = Object.fromEntries(
    (Object.entries(stages) as [StageName, StageInfo][]).map(pair => [pair[1].latestVersion, pair[0]])
  )

  const [selectedVersion, setSelectedVersion] = useState<string>("")
  const [selectedStage, setSelectedStage] = useState<StageName | "">("")

  const showOldVersionWarning =
    selectedStage &&
    selectedVersion &&
    semverCompare(selectedVersion, stages[selectedStage]?.latestVersion || "0.0.0") <= 0

  const versionWarning = "You're trying to publish a version that's older or equal to the one already on the stage"

  if (Object.keys(stages).length === 0) {
    return (
      <Flex flexDirection="col" className="h-full space-y-8" justifyContent="center">
        <Flex className="space-x-4" justifyContent="center">
          <Icon icon={IconSettingsOff} size="xl" className="text-tremor-content-subtle" />

          <div>
            <Title>No configuration found</Title>
            <Text className="text-tremor-content-subtle">This deliverable has not been configured yet.</Text>
          </div>
        </Flex>
      </Flex>
    )
  }

  return (
    <>
      <Flex justifyContent="between">
        <Title className="w-full">Publish deliverable</Title>
        <Flex justifyContent="end" className="space-x-2">
          {showOldVersionWarning && (
            <Icon size="md" icon={IconAlertTriangle} color="amber" variant="light" tooltip={versionWarning} />
          )}
          <Link to="">
            <Button
              icon={IconRocket}
              variant="secondary"
              size="sm"
              disabled={selectedVersion === "" || selectedStage === ""}
            >
              Publish
            </Button>
          </Link>
        </Flex>
      </Flex>
      <Flex className="mt-6 space-x-4">
        <Text>Publish</Text>
        <Select
          className="w-full"
          placeholder="Select version..."
          value={selectedVersion}
          onValueChange={setSelectedVersion}
        >
          {trackerEvents.map(eg => (
            <SelectItem key={eg.version} value={eg.version} className="[&>span]:w-full">
              <Flex justifyContent="between">
                <Text>{eg.version}</Text>
                {versionStage[eg.version] && <Badge>{titlecase(versionStage[eg.version])}</Badge>}
              </Flex>
            </SelectItem>
          ))}
        </Select>
        <Text>on</Text>
        <Select
          value={selectedStage}
          onValueChange={value => setSelectedStage(value as StageName | "")}
          placeholder="Select stage..."
        >
          {Object.keys(stages).map(stage => (
            <SelectItem key={stage} value={stage}>
              {titlecase(stage)}
            </SelectItem>
          ))}
        </Select>
      </Flex>
    </>
  )
})

function EmptyStageCard() {
  return (
    <Card>
      <Flex flexDirection="row" justifyContent="between">
        <Skeleton className="h-tremor-metric w-32" />
      </Flex>
      <List className="mt-4">
        <ListItem>
          <Flex>
            <Skeleton className="h-tremor-default w-32" />
            <Skeleton className="h-tremor-title w-32" />
          </Flex>
        </ListItem>
        <ListItem>
          <Flex>
            <Skeleton className="h-tremor-default w-32" />
            <Skeleton className="h-tremor-default w-32" />
          </Flex>
        </ListItem>
      </List>
    </Card>
  )
}
