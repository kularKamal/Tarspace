import { Logger } from "@iotinga/ts-backpack-common"
import { IconBoxOff, IconChevronRight, IconFlask, IconPackage } from "@tabler/icons-react"
import {
  Button,
  Card,
  Flex,
  Grid,
  Icon,
  Metric,
  SearchSelect,
  SearchSelectItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
} from "@tremor/react"
import { useContext, useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { AppContext, AuthContext } from "contexts"

const logger = new Logger("App")

const ChevronIcon = () => <IconChevronRight height={18} />

const DeliverablesTable = (props: { customer: string; project: string; deliverables: string[] }) => (
  <Table className="mt-6">
    <TableHead>
      <TableRow>
        <TableHeaderCell>ID</TableHeaderCell>
        <TableHeaderCell className="text-right"></TableHeaderCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {props.deliverables.map((d, index) => (
        <TableRow key={index}>
          <TableCell>{d}</TableCell>
          <TableCell className="text-right">
            <Link to={`/deliverables/${props.customer}/${props.project}/${d}`}>
              <Button size="xs" variant="light" icon={ChevronIcon} iconPosition="right">
                See details
              </Button>
            </Link>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
)

const EmptyView = () => (
  <Flex className="min-h-[50vh]" justifyContent="around">
    <Flex flexDirection="col" className="h-full w-1/4" justifyContent="center">
      <IconBoxOff size={48} stroke={1} className="text-tremor-content-subtle" />
      <Text className="mt-6 text-tremor-content-subtle text-center">
        Select a customer and project to show deliverables
      </Text>
    </Flex>
  </Flex>
)

function App() {
  const { CouchdbManager } = useContext(AppContext)
  const { username, userDb } = useContext(AuthContext)

  const designDoc = username as string
  // if (userCtx !== undefined && userCtx.roles.includes("_admin")) {
  //   dbName = "companylog-ia6ch3s4"
  //   designDoc = "companylog"
  // }

  const { project, customer } = useParams()

  const [deliverables, setDeliverables] = useState<string[][]>([])
  const [projects, setProjects] = useState<string[][]>([])
  const [customers, setCustomers] = useState<string[]>([])

  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(customer ?? null)
  const [selectedProject, setSelectedProject] = useState<string | null>(project ?? null)

  const [notFound, setNotFound] = useState(false)
  const navigate = useNavigate()

  if (notFound) {
    navigate("/not-found")
  }

  useEffect(() => {
    if (!userDb) {
      return
    }

    if (!(project && customer) && !(selectedProject && selectedCustomer)) {
      return
    }

    CouchdbManager.db(userDb)
      .design(designDoc)
      .view("deliverables", {
        group_level: 3,
        reduce: true,
        start_key: [selectedCustomer, selectedProject],
        end_key: [selectedCustomer, selectedProject, "\uffff"],
      })
      .then(resp => {
        if (resp.total_rows === 0) {
          setNotFound(true)
        }

        setDeliverables(resp.rows.map(row => row.key as string[]))
      })
  }, [userDb, CouchdbManager, designDoc, project, customer, selectedCustomer, selectedProject])

  useEffect(() => {
    if (!userDb) {
      return
    }

    CouchdbManager.db(userDb)
      .design(designDoc)
      .view("events-build", {
        group_level: 2,
        reduce: true,
      })
      .then(resp => {
        const projects = resp.rows.map(row => row.key as string[])
        const customers = Array.from(new Set(projects.map(key => key[0])))
        setProjects(projects)
        setCustomers(customers)
        if (customers.length === 1 && !customer) {
          setSelectedCustomer(customers[0])
        }
      })
  }, [userDb, CouchdbManager, designDoc, project, customer])

  const deliverableNames = deliverables.map(key => key[2])

  return (
    <>
      <Grid numItemsMd={2} className="mt-6 gap-6">
        <Card>
          <Flex justifyContent="start" className="space-x-4">
            <Icon icon={IconFlask} variant="light" size="xl" color="blue" />
            <div className="truncate">
              <Text>Projects</Text>
              <Metric className="truncate">{projects.length}</Metric>
            </div>
          </Flex>
        </Card>
        <Card>
          <Flex justifyContent="start" className="space-x-4">
            <Icon icon={IconPackage} variant="light" size="xl" color="blue" />
            <div className="truncate">
              <Text>Deliverables</Text>
              <Metric className="truncate">{deliverables.length === 0 ? "-" : deliverables.length}</Metric>
            </div>
          </Flex>
        </Card>
      </Grid>

      <Card className="mt-6 mx-auto">
        <Flex className="space-x-4" justifyContent="start" alignItems="center">
          <SearchSelect
            value={selectedCustomer || ""}
            onValueChange={value => {
              setSelectedCustomer(value)
              setSelectedProject(null)
            }}
            placeholder="Customer"
            className="max-w-xs"
          >
            {customers.map(customer => (
              <SearchSelectItem key={customer} value={customer}>
                {customer}
              </SearchSelectItem>
            ))}
          </SearchSelect>

          <SearchSelect
            value={selectedProject || ""}
            onValueChange={value => {
              setSelectedProject(value)
              // fetchDeliverables()
            }}
            placeholder="Project"
            className="max-w-xs"
            disabled={selectedCustomer === undefined}
          >
            {projects
              .filter(key => key[0] === selectedCustomer)
              .map((key, index) => (
                <SearchSelectItem key={index} value={key[1]}>
                  {key[1]}
                </SearchSelectItem>
              ))}
          </SearchSelect>
        </Flex>

        {selectedCustomer === null || selectedProject === null ? (
          <EmptyView />
        ) : (
          <DeliverablesTable customer={selectedCustomer} project={selectedProject} deliverables={deliverableNames} />
        )}
      </Card>
    </>
  )
}

export default App
