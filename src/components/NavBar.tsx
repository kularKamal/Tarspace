import { Menu } from "@headlessui/react"
import { IconChevronDown, IconLogout, IconMoon, IconSun } from "@tabler/icons-react"
import { Bold, Col, Divider, Flex, Grid, Icon, Text } from "@tremor/react"
import { useContext } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useDarkMode } from "usehooks-ts"

import { Search, TremorMenu, TremorMenuItem } from "components"
import { AuthContext } from "contexts"
import { ReactComponent as IotingaLogo } from "logo-full.svg"

export type NavBarProps = { title?: string }
export function NavBar(props: NavBarProps) {
  return (
    <>
      <Grid numItems={11}>
        <Col numColSpan={2}>
          <Link to="/">
            <IotingaLogo width={40} height={40} />
          </Link>
        </Col>

        <Col numColSpan={7}>
          <Flex flexDirection="row" justifyContent="center">
            <Search />
          </Flex>
        </Col>

        <Col numColSpan={2}>
          <Flex flexDirection="row" justifyContent="end">
            <UserMenu />
          </Flex>
        </Col>
      </Grid>
      <Divider />
    </>
  )
}

function UserMenu() {
  const { signOut, username } = useContext(AuthContext)
  const navigate = useNavigate()
  const { isDarkMode, toggle } = useDarkMode()

  const MenuButton = (
    <div>
      <Menu.Button className="inline-flex w-full justify-end">
        <Text className="mr-1 mt-2">
          Hello, <Bold>{username}</Bold>
        </Text>
        <Icon icon={IconChevronDown} color="gray" variant="simple" className="mt-0.5" />
      </Menu.Button>
    </div>
  )

  return (
    <TremorMenu button={MenuButton}>
      <TremorMenuItem
        value="Logout"
        icon={IconLogout}
        onClick={() => {
          signOut()
          navigate("/login")
        }}
      />
      <TremorMenuItem
        value={isDarkMode ? "Light mode" : "Dark mode"}
        icon={isDarkMode ? IconSun : IconMoon}
        onClick={() => toggle()}
      />
    </TremorMenu>
  )
}
