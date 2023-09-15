import { IconLogout } from "@tabler/icons-react"
import { Bold, Button, Divider, Flex, Text } from "@tremor/react"
import { useContext } from "react"
import { Link, useNavigate } from "react-router-dom"

import { Search } from "components"
import { AuthContext } from "contexts"
import { ReactComponent as IotingaLogo } from "logo-full.svg"

const LogoutIcon = () => <IconLogout height={24} />

export type NavBarProps = { title?: string }
export function NavBar(props: NavBarProps) {
  const { signOut, username } = useContext(AuthContext)
  const navigate = useNavigate()

  return (
    <>
      <Flex>
        <Link to="/">
          {/* <Title>{props.title || "IOTINGA Space"}</Title> */}
          <IotingaLogo width={40} height={40} />
        </Link>
        <Search />
        <div className="inline-flex items-center">
          <Text className="mr-4">
            Hello, <Bold>{username}</Bold>
          </Text>
          <Button
            tooltip="Logout"
            icon={LogoutIcon}
            variant="light"
            color="gray"
            onClick={() => {
              signOut()
              navigate("/login")
            }}
          ></Button>
        </div>
      </Flex>
      <Divider />
    </>
  )
}
