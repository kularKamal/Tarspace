import { IconArrowLeft } from "@tabler/icons-react"
import { Button, Flex, Metric, Subtitle, Title } from "@tremor/react"
import { Link } from "react-router-dom"

export function NotFoundPage() {
  return (
    <Flex className="w-full h-full" justifyContent="center">
      <Flex flexDirection="col" justifyContent="center" className="max-w-[30vh] text-center">
        <Metric className="text-6xl mb-6">404</Metric>
        <Title>Oops… You just found an error page</Title>
        <Subtitle>We are sorry but the page you are looking for was not found</Subtitle>
        <Link to={"/"}>
          <Button icon={IconArrowLeft} className="mt-6">
            Go back to home
          </Button>
        </Link>
      </Flex>
    </Flex>
  )
}
