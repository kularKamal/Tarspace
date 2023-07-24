import { Icon as IconifyIcon } from "@iconify/react"
import { Card, Divider, Flex, Grid, Icon, Metric, Text } from "@tremor/react"
import Breadcrumbs from "components/Breadcrumbs"
import Container from "components/Container"
import NavBar from "components/NavBar"
import { useLoaderData, useLocation } from "react-router-dom"

const ProjectsIcon = () => <IconifyIcon height={32} icon="tabler:flask" />

type LoaderData = { project: string }
type Params = { params: LoaderData }

export const loader = async ({ params }: Params) => ({ projectName: params.project })

function Page() {
  const { project: projectName } = useLoaderData() as LoaderData
  const projects = 32
  const location = useLocation()

  return (
    <Container className="h-full">
      <NavBar title={projectName} />
      <Divider />

      <Flex>
        <div>
          <Metric className="text-left">Deliverables</Metric>
          <Text className="text-left">Lorem ipsum dolor sit amet, consetetur sadipscing elitr.</Text>
        </div>
        <Breadcrumbs
          crumbs={[
            {
              name: projectName || "Project",
              route: location.pathname,
            },
          ]}
        />
      </Flex>

      <Grid numItemsMd={2} className="mt-6 gap-6">
        <Card>
          <Icon icon={ProjectsIcon} variant="light" size="xl" color="red" />
          <div className="truncate">
            <Text>Projects</Text>
            <Metric className="truncate">{projects}</Metric>
          </div>
        </Card>
        <Card>
          {/* Placeholder to set height */}
          <div className="h-28" />
        </Card>
      </Grid>
    </Container>
  )
}

export default Page
