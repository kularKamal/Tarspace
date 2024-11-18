import { Flex, Grid, List, ListItem, Text, Title } from "@tremor/react"
import { useContext, useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { PageHeading } from "components"
import { ClickableCard } from "components/ClickableCard"
import { AppContext, AuthContext } from "contexts"
import useSWR from "swr"

function Page() {
  const { username } = useContext(AuthContext)

  const designDoc = username as string
  // if (userCtx !== undefined && userCtx.roles.includes("_admin")) {
  //   dbName = "companylog-ia6ch3s4"
  //   designDoc = "companylog"
  // }

  const { customer } = useParams()

  const [projects, setProjects] = useState<Record<string, number>>({})

  const [notFound, setNotFound] = useState(false)
  const navigate = useNavigate()

  if (notFound) {
    navigate("/not-found")
  }

  return (
    <>
      <PageHeading title="Customer" />

      <Grid numItemsMd={3} className="gap-6">
        {Object.entries(projects).map(([project, total]) => (
          <Link to={project} key={project}>
            <ClickableCard>
              <Title>{project}</Title>
              <List className="mt-4">
                <ListItem>
                  <Flex>
                    <Text>Deliverables</Text>
                    <Text>{total}</Text>
                  </Flex>
                </ListItem>
              </List>
            </ClickableCard>
          </Link>
        ))}
      </Grid>
    </>
  )
}

export default Page
