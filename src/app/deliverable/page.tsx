import { CouchdbDoc } from "@iotinga/ts-backpack-couchdb-client"
import { IconChevronRight, IconCloudDownload } from "@tabler/icons-react"
import {
  Card,
  Flex,
  Grid,
  Metric,
  SearchSelect,
  SearchSelectItem,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
  Text,
} from "@tremor/react"
import { Breadcrumbs, BreadcrumbsElement } from "components/Breadcrumbs"
import { AppContext } from "contexts/AppContext"
import { AuthContext } from "contexts/AuthContext"
import { FC, useContext, useEffect, useState } from "react"
import { useLocation, useParams } from "react-router-dom"
import { ArtifactDoc, DeliverableDoc } from "types/couchdb"

const ChevronIcon = () => <IconChevronRight height={18} />
const DownloadIcon = () => <IconCloudDownload size={32} />

type Artifact = {
  name: string
  url: string
}

type ArtifactTableProps = { artifacts: string[] }

const ArtifactsTable: FC<ArtifactTableProps> = props => {
  const { CouchdbManager } = useContext(AppContext)
  const { username } = useContext(AuthContext)

  let dbName = "userdb-" + Buffer.from(username as string).toString("hex")
  let designDoc = username as string

  const [artifacts, setArtifacts] = useState<ArtifactDoc[]>([])
  const [selectedArtifact, setSelectedArtifact] = useState<string | null>(null)
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null)

  useEffect(() => {
    CouchdbManager.db(dbName)
      .design(designDoc)
      .viewQueries("artifacts", {
        queries: props.artifacts.map(a => ({
          reduce: false,
          include_docs: true,
          start_key: ["IRSAP", "NOW2", a],
          end_key: ["IRSAP", "NOW2", a, "\uffff"],
        })),
      })
      .then(resp => {
        setArtifacts(
          resp.results
            .flatMap(q => q.rows)
            .map(row => row.doc)
            .filter(doc => doc !== undefined) as ArtifactDoc[]
        )
      })
  }, [CouchdbManager, dbName, designDoc, props.artifacts])

  return (
    <Card>
      <Flex className="space-x-4" justifyContent="start" alignItems="center">
        <SearchSelect
          value={selectedArtifact || ""}
          onValueChange={value => {
            setSelectedArtifact(value)
            setSelectedVersion(null)
          }}
          placeholder="Customer"
          className="max-w-xs"
        >
          {props.artifacts.map(artifact => (
            <SearchSelectItem key={artifact} value={artifact}>
              {artifact}
            </SearchSelectItem>
          ))}
        </SearchSelect>

        <SearchSelect
          value={selectedVersion || ""}
          onValueChange={value => {
            setSelectedVersion(value)
          }}
          placeholder="Project"
          className="max-w-xs"
          disabled={selectedArtifact === undefined}
        >
          {artifacts
            .filter(doc => doc.name === selectedArtifact)
            .map((doc, index) => (
              <SearchSelectItem key={index} value={doc.version}>
                {doc.version}
              </SearchSelectItem>
            ))}
        </SearchSelect>
      </Flex>
    </Card>
  )
}

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

  let dbName = "userdb-" + Buffer.from(username as string).toString("hex")
  let designDoc = username as string

  const [publishEvents, setPublishEvents] = useState<CouchdbDoc[]>([])
  const [deliverables, setDeliverables] = useState<DeliverableDoc[]>([])

  useEffect(() => {
    CouchdbManager.db(dbName)
      .design(designDoc)
      .view("events-publish", {
        reduce: false,
        include_docs: true,
        start_key: [params.customer, params.project, params.deliverable],
        end_key: [params.customer, params.project, params.deliverable, "\uffff"],
      })
      .then(resp => {
        setPublishEvents(resp.rows.map(row => row.doc).filter(doc => doc !== undefined) as CouchdbDoc[])
      })

    CouchdbManager.db(dbName)
      .design(designDoc)
      .view("deliverables", {
        reduce: false,
        include_docs: true,
        start_key: [params.customer, params.project, params.deliverable],
        end_key: [params.customer, params.project, params.deliverable, "\uffff"],
      })
      .then(resp => {
        setDeliverables(resp.rows.map(row => row.doc).filter(doc => doc !== undefined) as DeliverableDoc[])
      })
  }, [CouchdbManager, dbName, designDoc, params])

  return (
    <>
      <Flex>
        <div>
          <Metric className="text-left">Deliverable</Metric>
          <Text className="text-left">Lorem ipsum dolor sit amet, consetetur sadipscing elitr.</Text>
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
            <Grid numItemsMd={2} numItemsLg={3} className="gap-6 mt-6">
              <Card>
                {/* Placeholder to set height */}
                <div className="h-28" />
              </Card>
              <Card>
                {/* Placeholder to set height */}
                <div className="h-28" />
              </Card>
              <Card>
                {/* Placeholder to set height */}
                <div className="h-28" />
              </Card>
            </Grid>
            <div className="mt-6">
              <Card>
                <div className="h-80" />
              </Card>
            </div>
          </TabPanel>
          <TabPanel></TabPanel>
          <TabPanel></TabPanel>
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
