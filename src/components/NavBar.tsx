import { IconLogout } from "@tabler/icons-react"
import { Bold, Button, Col, Divider, Flex, Grid, Text } from "@tremor/react"
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
        </Col>
      </Grid>
      <Divider />
    </>
  )
}
