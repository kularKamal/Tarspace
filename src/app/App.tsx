import { Logger } from "@iotinga/ts-backpack-common"
import { Card, Flex, Grid, List, ListItem, Text, Title } from "@tremor/react"
import { useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"

import axios from "axios"
import useSWR, { mutate } from "swr"

import { CustomersInformations } from "types/api"

const logger = new Logger("App")

function App() {
  const {
    data: customers,
    isLoading,
    error,
  } = useSWR("app", async () => {
    logger.info("Fetching customers data")
    const response = await axios.get<CustomersInformations>("http://localhost:8000/space/api/v1/customers", {
      withCredentials: true,
    })
    logger.info("Response received:", response.data)
    return response.data
  })

  const navigate = useNavigate()

  // Retry mechanism
  useEffect(() => {
    if (!Array.isArray(customers) && !isLoading) {
      const retryTimeout = setTimeout(() => {
        logger.info("Retrying fetch for customers")
        mutate("api/deliverables")
      }, 3000) // Retry after 3 seconds
      return () => clearTimeout(retryTimeout)
    }
  }, [customers, isLoading])

  if (isLoading) {
    return <div>Loading customers...</div> // Indication during loading
  }

  if (error) {
    return <div>Error fetching customers: {error.message}</div> // Display an error if the API fails
  }

  if (!Array.isArray(customers)) {
    return <div>No customers found. Retrying...</div>
  }

  return (
    <Grid numItemsMd={3} className="gap-6">
      {customers.map(customer => (
        <Link to={`/deliverables/${customer.name}`} key={customer.id}>
          <Card className="w-full hover:ring transition transition-all">
            <Title>{customer.name}</Title>
            <List className="mt-4">
              <ListItem>
                <Flex>
                  <Text>Projects</Text>
                  <Text>{customer.number_of_projects}</Text>
                </Flex>
              </ListItem>
            </List>
          </Card>
        </Link>
      ))}
    </Grid>
  )
}

export default App
