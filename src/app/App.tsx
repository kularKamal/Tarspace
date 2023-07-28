import { Button, Card, Divider, Flex, Grid, Icon, Metric, Text, Title } from "@tremor/react"

import Container from "components/Container"
import NavBar from "components/NavBar"

import { IconChevronRight, IconFlask, IconPackage } from "@tabler/icons-react"
import { Link } from "react-router-dom"
import "./App.css"

const ChevronIcon = () => <IconChevronRight height={18} />

const InlineCode = (props: { text: string }) => (
  <span className="font-mono bg-gray-100 px-2 py-1 ml-2 border-2 rounded-md">{props.text}</span>
)

const PageCard = (props: { route: string }) => (
  <Card>
    <Flex>
      <div>
        <Title>
          Page <InlineCode text={props.route} />
        </Title>
      </div>
    </Flex>
    <Flex className="mt-6 pt-4 border-t">
      <Link to={props.route}>
        <Button size="xs" variant="light" icon={ChevronIcon} iconPosition="right">
          Navigate
        </Button>
      </Link>
    </Flex>
  </Card>
)

function App() {
  const projects = 4
  const deliverables = 27

  return (
    <>
      <Grid numItemsMd={2} className="mt-6 gap-6">
        <Card>
          <Flex justifyContent="start" className="space-x-4">
            <Icon icon={IconFlask} variant="light" size="xl" color="blue" />
            <div className="truncate">
              <Text>Projects</Text>
              <Metric className="truncate">{projects}</Metric>
            </div>
          </Flex>
        </Card>
        <Card>
          <Flex justifyContent="start" className="space-x-4">
            <Icon icon={IconPackage} variant="light" size="xl" color="blue" />
            <div className="truncate">
              <Text>Deliverables</Text>
              <Metric className="truncate">{deliverables}</Metric>
            </div>
          </Flex>
        </Card>
      </Grid>

      <Divider />
      <Grid numItemsMd={1} className="gap-6 px-auto">
        <PageCard route="/login" />
        <PageCard route="/projects/office_automation" />
        <PageCard route="/projects/office_automation/iotinga-cli" />
      </Grid>
    </>
  )
}

export default App
