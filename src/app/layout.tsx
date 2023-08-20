import { Divider } from "@tremor/react"
import { Outlet } from "react-router-dom"

import Container from "components/Container"
import NavBar from "components/NavBar"

function Layout() {
  return (
    <Container>
      <NavBar />
      <Outlet />
    </Container>
  )
}

export default Layout
