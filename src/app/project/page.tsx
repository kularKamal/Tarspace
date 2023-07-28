import { Flex, Metric, Text } from "@tremor/react"
import { useLocation, useParams } from "react-router-dom"

import Breadcrumbs from "components/Breadcrumbs"

function Page() {
  const { project } = useParams()
  const projects = 4
  const deliverables = 27
  const location = useLocation()

  return (
    <>
      <Flex>
        <div>
          <Metric className="text-left">Project</Metric>
          <Text className="text-left">Lorem ipsum dolor sit amet, consetetur sadipscing elitr.</Text>
        </div>
        <Breadcrumbs />
      </Flex>
    </>
  )
}

export default Page
