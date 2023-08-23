import { Outlet } from "react-router-dom"

import { Container, NavBar } from "components"

function Layout() {
  return (
    <Container>
      <NavBar />
      <Outlet />
    </Container>
  )
}

export default Layout
