import { Logger } from "@iotinga/ts-backpack-common"
import { Card, Flex, Grid, List, ListItem, Text, Title } from "@tremor/react"
import { useCallback, useContext, useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { AppContext, AuthContext } from "contexts"

const logger = new Logger("App")

function App() {
  const { CouchdbManager } = useContext(AppContext)
  const { username, userDb } = useContext(AuthContext)

  const designDoc = username as string
  // if (userCtx !== undefined && userCtx.roles.includes("_admin")) {
  //   dbName = "companylog-ia6ch3s4"
  //   designDoc = "companylog"
  // }

  const { project, customer } = useParams()

  const [projects, setProjects] = useState<string[][]>([])
  const [customers, setCustomers] = useState<string[]>([])

  const [notFound, setNotFound] = useState(false)
  const navigate = useNavigate()

  if (notFound) {
    navigate("/not-found")
  }

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
      })
  }, [userDb, CouchdbManager, designDoc, project, customer])

  const numProjects = useCallback((customer: string) => projects.filter(key => key[0] === customer).length, [projects])

  return (
    <Grid numItemsMd={3} className="gap-6">
      {customers.map(customer => (
        <Link to={`/deliverables/${customer}`} key={customer}>
          <Card className="w-full hover:ring transition transition-all">
            <Title>{customer}</Title>
            <List className="mt-4">
              <ListItem>
                <Flex>
                  <Text>Projects</Text>
                  <Text>{numProjects(customer)}</Text>
                </Flex>
              </ListItem>
            </List>
          </Card>
        </Link>
      ))}
    </Grid>
  )
}

export default App
