import { IconLogout } from "@tabler/icons-react"
import { Bold, Button, Divider, Flex, Text, Title } from "@tremor/react"
import { FC, useContext } from "react"
import { Link, useNavigate } from "react-router-dom"

import { Search } from "components"
import { AuthContext } from "contexts"

const LogoutIcon = () => <IconLogout height={24} />

export type NavBarProps = { title?: string }

export const NavBar: FC<NavBarProps> = props => {
  const { signOut, username } = useContext(AuthContext)
  const navigate = useNavigate()

  return (
    <>
      <Flex>
        <Link to="/">
          <Title>{props.title || "IOTINGA Space"}</Title>
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
