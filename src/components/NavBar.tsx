import { IconLogout } from "@tabler/icons-react"
import { Bold, Button, Divider, Flex, Icon, Text } from "@tremor/react"
import { useContext } from "react"
import { Link, useNavigate } from "react-router-dom"

import { Search } from "components"
import { AuthContext } from "contexts"

function Logo() {
  const fill = "#216BFF"
  const size = 40

  return (
    <svg
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      x="0px"
      y="0px"
      viewBox="0 0 56.7 56.7"
      width={size}
      height={size}
    >
      <g>
        <circle cx="45.6" cy="8.6" r="5.8" fill={fill} />
        <g>
          <g>
            <path
              fill={fill}
              d="M54.2,19.9c-0.7-2.1-1.6-4-2.7-5.8c-0.9,1-2.1,1.7-3.4,2.2c-4.3,1.4-8.8-0.9-10.2-5.2
				c-0.9-2.7-0.2-5.6,1.5-7.7c-6-2.7-12.9-3.2-19.6-1C5.3,7.1-2.5,22.5,2.2,36.9s20.1,22.2,34.5,17.5S58.8,34.3,54.2,19.9z
				 M47.4,38.9c-0.9,7.9-8.1,13.5-16,12.6s-13.5-8.1-12.6-16s8.1-13.5,16-12.6C42.7,23.9,48.4,31,47.4,38.9z"
            />
          </g>
        </g>
      </g>
    </svg>
  )
}

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
          <Icon icon={Logo} />
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
