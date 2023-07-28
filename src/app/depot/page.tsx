import { Flex, Grid, Metric, Text } from "@tremor/react"
import Breadcrumbs from "components/Breadcrumbs"
import DeliverableCard from "components/DeliverableCard"

// import "./styles.css"

function Page() {
  return (
    <>
      <Flex>
        <div>
          <Metric className="text-left">Deliverables</Metric>
          <Text className="text-left">Lorem ipsum dolor sit amet, consetetur sadipscing elitr.</Text>
        </div>
        <Breadcrumbs />
      </Flex>

      <Grid numItemsMd={2} className="mt-8 gap-6">
        <DeliverableCard />
        <DeliverableCard />
        <DeliverableCard />
        <DeliverableCard />
        <DeliverableCard />
        <DeliverableCard />
        <DeliverableCard />
        <DeliverableCard />
      </Grid>
    </>
  )
}

export default Page
