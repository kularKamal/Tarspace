import { Flex, Metric, Text } from "@tremor/react"

import { Breadcrumbs } from "components"

function Page() {
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
