import { Button, Flex, Title } from "@tremor/react"
import { Icon } from "@iconify/react"

const LogoutIcon = () => <Icon height={24} icon="tabler:logout" />

const NavBar = (props: { title?: string }) => (
  <Flex>
    <Title>{props.title}</Title>
    <div>
      <Button tooltip="Logout" icon={LogoutIcon} variant="light" color="gray"></Button>
    </div>
  </Flex>
)

export default NavBar
