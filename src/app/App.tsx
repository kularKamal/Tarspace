import { Icon } from "@iconify/react"
import { Button, Card, Divider, Flex, Title } from "@tremor/react"

import Container from "components/Container"
import NavBar from "components/NavBar"

import "./App.css"
import { Link } from "react-router-dom"

const ChevronIcon = () => <Icon height={18} icon="tabler:chevron-right" />

const InlineCode = (props: { text: string }) => (
  <span className="font-mono bg-gray-100 px-2 py-1 ml-2 border-2 rounded-md">{props.text}</span>
)

const PageCard = (props: { route: string }) => (
  <Card>
    <Flex>
      <div>
        <Title>
          PageTest <InlineCode text={props.route} />
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
  return (
    <Container>
      <NavBar title="App" />
      <Divider />
      <Flex flexDirection="col" className="gap-4 px-auto">
        <PageCard route="/depot" />
        <PageCard route="/login" />
        <PageCard route="/projects/:project" />
      </Flex>
    </Container>
  )
}

export default App
