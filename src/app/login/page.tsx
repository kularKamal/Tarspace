import { IconPlanet } from "@tabler/icons-react"
import { Button, Card, Flex, Metric, Text, TextInput } from "@tremor/react"
import { useContext, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"

import { Container } from "components"
import { AuthContext } from "contexts"
import { ReactComponent as IotingaLogo } from "logo-full.svg"
import { LocationState } from "types"

interface LoginFormElements extends HTMLFormControlsCollection {
  username: HTMLInputElement
  password: HTMLInputElement
}

interface LoginForm extends HTMLFormElement {
  readonly elements: LoginFormElements
}

function Page() {
  const { signIn } = useContext(AuthContext)
  const navigate = useNavigate()
  const state = useLocation().state as LocationState

  const [hasError, setHasError] = useState(false)

  function onSubmit(e: React.FormEvent<LoginForm>) {
    e.preventDefault()
    const username = e.currentTarget.elements.username.value
    const password = e.currentTarget.elements.password.value

    if (username && password) {
      signIn(username, password).then(signedIn => {
        setHasError(!signedIn)
        if (signedIn) {
          // navigate(state ? state.from : "/")
          navigate("/")
        }
      })
    }
  }

  return (
    <>
      <Link to="https://iotinga.com">
        <IotingaLogo className="m-4 fixed" width={48} height={48} />
      </Link>

      <Container className="h-full">
        <Flex className="h-full" flexDirection="col" alignItems="center" justifyContent="center">
          <Card className="w-1/3 p-10">
            <Metric className="mb-1">Welcome back</Metric>
            <Text>Sign in to your account</Text>
            <form className="mt-8" onSubmit={onSubmit} id="loginForm">
              <label htmlFor="username">
                <Text className="mt-4">Username</Text>
              </label>
              <TextInput
                className="mt-2"
                placeholder="user.name"
                name="username"
                error={hasError}
                form="loginForm"
              ></TextInput>
              <Flex flexDirection="row" justifyContent="between" className="mt-6">
                <label htmlFor="password">
                  <Text>Password</Text>
                </label>
                <Button
                  type="button"
                  variant="light"
                  tooltip="Contact us!"
                  tabIndex={-1}
                  onClick={e => e.preventDefault()}
                >
                  Forgot password?
                </Button>
              </Flex>
              <TextInput
                className="mt-2"
                placeholder="••••••••"
                name="password"
                error={hasError}
                errorMessage={hasError ? "Wrong username or password" : undefined}
                type="password"
                form="loginForm"
              ></TextInput>
              <Button type="submit" form="loginForm" size="lg" className="w-full mt-8" icon={IconPlanet}>
                Login
              </Button>
            </form>
          </Card>
        </Flex>
      </Container>
    </>
  )
}

export default Page
