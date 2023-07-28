import { IconLogout } from "@tabler/icons-react"
import { Button, Flex, Title } from "@tremor/react"

const LogoutIcon = () => <IconLogout height={24} />

const NavBar = (props: { title?: string }) => (
  <Flex>
    <Title>{props.title || "Space"}</Title>
    <div>
      <Button tooltip="Logout" icon={LogoutIcon} variant="light" color="gray"></Button>
    </div>
  </Flex>
)

export default NavBar
