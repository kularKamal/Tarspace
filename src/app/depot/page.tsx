import { Text, Metric, Grid, Divider, Flex } from "@tremor/react"
import DeliverableCard from "components/DeliverableCard"
import NavBar from "components/NavBar"

// import "./styles.css"
import Container from "components/Container"
import Breadcrumbs from "components/Breadcrumbs"

function Page() {
  return (
    <Container>
      <NavBar title="Depot" />
      <Divider />

      <Flex>
        <div>
          <Metric className="text-left">Deliverables</Metric>
          <Text className="text-left">Lorem ipsum dolor sit amet, consetetur sadipscing elitr.</Text>
        </div>
        <Breadcrumbs
          crumbs={[
            {
              name: "Depot",
              route: "/depot",
            },
          ]}
        />
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
    </Container>
  )
}

export default Page
