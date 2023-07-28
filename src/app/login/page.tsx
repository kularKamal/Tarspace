import { Button, Card, Flex, Metric, TextInput } from "@tremor/react"
import Container from "components/Container"
import { Form } from "react-router-dom"

function Page() {
  return (
    <Container className="h-full">
      <Flex className="h-full" flexDirection="col" alignItems="center" justifyContent="center">
        <Card className="max-w-sm">
          <Metric>Login</Metric>
          <Form className="mt-8">
            <TextInput className="mt-1" placeholder="Username"></TextInput>

            <TextInput className="mt-4" placeholder="Password"></TextInput>

            <Button size="lg" className="w-full mt-8">
              Login
            </Button>
          </Form>
        </Card>
      </Flex>
    </Container>
  )
}

export default Page
