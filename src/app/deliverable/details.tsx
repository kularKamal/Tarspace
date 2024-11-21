import {
  IconAlertTriangle,
  IconBrandGithub,
  IconChecklist,
  IconCloudDownload,
  IconExternalLink,
  IconRocket,
  IconRocketOff,
  IconSettingsOff,
} from "@tabler/icons-react"
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
import { memo, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import urlJoin from "url-join"

import { BuildsTracker, Modal, Skeleton } from "components"
import { AppContext, AuthContext } from "contexts"
import { useModal } from "hooks"
import { DeliverableDoc, EventGroup, STAGES_ORDER, STAGE_NAMES, StageInfo, StageInfoMap, StageName } from "types"
import { formatTimestamp, semverCompare, titlecase } from "utils"
import { DeliverableInformations } from "types/api"
import useSWR, { mutate } from "swr"
import { Logger } from "@iotinga/ts-backpack-common"
import axios from "axios"

export type DetailsViewProps = {
  stages: StageInfoMap
  trackerEvents: EventGroup[]
}

type DeliverableVersionInfo = Record<
  string,
  {
    zip: string
    docs?: string
  }
>

function DetailsView({ stages, trackerEvents }: DetailsViewProps) {
  const { customer, project, deliverable } = useParams()

  const { username } = useContext(AuthContext)

  const [uploads, setUploads] = useState<DeliverableVersionInfo>({})

  const stagesEntries = useMemo(() => Object.entries(stages), [stages])

  const publishAction = useCallback((stage: string, version: string) => {}, [customer, deliverable, project])

  // Fetch project information
  const {
    data: deliverableInfo,
    isLoading,
    error,
  } = useSWR("deliverable", async () => {
    const response = await axios.get<DeliverableInformations>(
      `http://localhost:8000/space/api/v1/customers/${customer}/projects/${project}/deliverables/${deliverable}`,
      { withCredentials: true }
    )
    return response.data
  })

  if (isLoading) {
    return <div>Loading customers...</div> // Indication during loading
  }

  if (error) {
    return <div>Error fetching customers: {error.message}</div> // Display an error if the API fails
  }

  if (!deliverableInfo) {
    return <Skeleton className="h-screen w-full" />
  }

  const latestBuild = deliverableInfo.latest_build_events
  const Stages = deliverableInfo.stages

  return (
    <>
      <Grid numItemsMd={1} numItemsLg={3} className="gap-6 mt-6">
        {Object.keys(Stages).length === 0 ? (
          <>
            <LoadingStageCard />
            <LoadingStageCard />
            <LoadingStageCard />
          </>
        ) : (
          Object.entries(Stages) // Itera attraverso le coppie [nome dello stage, dati]
            .map(([stageName, stageInfo]) => (
              <StageCard
                key={stageName}
                stageName={stageName}
                info={stageInfo} // Passa i dati di ogni stage
                uploads={uploads}
              />
            ))
        )}
      </Grid>
      <Divider className="lg:hidden" />
      <Grid numItemsMd={2} className="gap-6 lg:mt-6">
        <Card>
          <BuildsTracker trackerEvents={trackerEvents} />
        </Card>
        <Card>
          <PublishCard
            deliverable={deliverable}
            trackerEvents={trackerEvents}
            stages={stages}
            publishAction={publishAction}
          />
        </Card>
      </Grid>
    </>
  )
}
export default DetailsView

type StageCardProps = {
  uploads: DeliverableVersionInfo
  info: {
    current_published_version: string
    last_published_at: string
    download_uri: string
    current_configuration_uri: string
  }
  stageName: string
}

const StageCard = ({ uploads, info, stageName }: StageCardProps) =>
  info ? (
    <Card>
      <Flex flexDirection="row" justifyContent="between" alignItems="baseline">
        <Metric>{titlecase(stageName)}</Metric>
        {uploads[info.current_published_version] && (
          <Link to={uploads[info.current_published_version].zip}>
            <Button icon={IconCloudDownload} variant="light" size="lg" tooltip="Download deliverable files" />
          </Link>
        )}
      </Flex>
      <List className="mt-4">
        <ListItem>
          <Flex>
            <Text>Current version</Text>
            <Link
              to={
                info.current_configuration_uri
                  ? urlJoin(info.current_configuration_uri, `./tree/v${info.current_published_version}`)
                  : ""
              }
            >
              <Button icon={IconBrandGithub} variant="light" tooltip="See the source code for this release">
                {info.current_published_version}
              </Button>
            </Link>
          </Flex>
        </ListItem>
        <ListItem>
          <Flex>
            <Text>Documentation</Text>
            {uploads[info.current_published_version] && uploads[info.current_published_version].docs ? (
              <Link
                to={uploads[info.current_published_version].docs as string}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button icon={IconExternalLink} variant="light" tooltip="See the documentation for this version">
                  Visit
                </Button>
              </Link>
            ) : (
              <Text>-</Text>
            )}
          </Flex>
        </ListItem>
        <ListItem>
          <Flex>
            <Text>Last update date</Text>
            <Text>{formatTimestamp(info.last_published_at, DateTime.DATETIME_MED)}</Text>
          </Flex>
        </ListItem>
      </List>
    </Card>
  ) : (
    <EmptyStageCard stageName={stageName} />
  )

type PublishCardProps = {
  deliverable?: string
  trackerEvents: EventGroup[]
  stages: StageInfoMap
  publishAction: (stage: string, version: string) => void
}
const PublishCard = memo<PublishCardProps>(({ deliverable, trackerEvents, stages, publishAction }) => {
  const versionStage: Record<string, StageName> = Object.fromEntries(
    (Object.entries(stages) as [StageName, StageInfo][]).map(pair => [pair[1].latestVersion, pair[0]])
  )

  const [selectedVersion, setSelectedVersion] = useState<string>("")
  const [selectedStage, setSelectedStage] = useState<StageName | "">("")
  const { isShowing, toggle: toggleModal } = useModal()

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
      <Modal
        isShowing={isShowing}
        hide={toggleModal}
        actions={
          <>
            <Button variant="secondary" onClick={() => toggleModal()}>
              Close
            </Button>
            <Button
              icon={IconRocket}
              onClick={() => {
                publishAction(selectedStage, selectedVersion)
                toggleModal()
              }}
            >
              Publish
            </Button>
          </>
        }
      >
        <Flex className="space-x-5" justifyContent="start" alignItems="start">
          <Icon size="lg" color="emerald" variant="light" icon={IconChecklist} />
          <Flex flexDirection="col" className="space-y-2 w-full mt-2" justifyContent="start" alignItems="start">
            <Title className="mb-2">Confirm action</Title>
            <List>
              {deliverable && (
                <ListItem>
                  <Flex>
                    <Text>Deliverable</Text>
                    <Text>{deliverable}</Text>
                  </Flex>
                </ListItem>
              )}
              <ListItem>
                <Flex>
                  <Text>Version</Text>
                  <Text>{selectedVersion}</Text>
                </Flex>
              </ListItem>
              <ListItem>
                <Flex>
                  <Text>Target stage</Text>
                  <Text className="font-mono">{selectedStage}</Text>
                </Flex>
              </ListItem>
            </List>
          </Flex>
        </Flex>
      </Modal>
      <Flex justifyContent="between">
        <Title className="w-full">Publish deliverable</Title>
        <Flex justifyContent="end" className="space-x-3">
          {showOldVersionWarning && (
            <Icon size="md" icon={IconAlertTriangle} color="amber" variant="light" tooltip={versionWarning} />
          )}
          <Link to="">
            <Button
              icon={IconRocket}
              variant="secondary"
              size="sm"
              disabled={selectedVersion === "" || selectedStage === ""}
              onClick={() => toggleModal()}
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
          {trackerEvents
            .filter(eg => eg.success)
            .map(eg => (
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

const LoadingStageCard = () => (
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

const EmptyStageCard = ({ stageName }: { stageName: string }) => (
  <Card className="h-full">
    <Flex flexDirection="col" className="space-y-12" alignItems="start">
      <Metric>{titlecase(stageName)}</Metric>
      <Flex className="space-x-2" justifyContent="center">
        <Icon icon={IconRocketOff} size="xl" className="text-tremor-content-subtle" />

        <div>
          <Title>No deployment found</Title>
          <Text className="text-tremor-content-subtle">There{"'"}s nothing on this stage.</Text>
        </div>
      </Flex>
    </Flex>
  </Card>
)
