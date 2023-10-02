import { Button, Card, Flex, Metric, Text, TextInput } from "@tremor/react"
import { useContext, useRef, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"

import { Container } from "components"
import { AuthContext } from "contexts"
import { ReactComponent as IotingaLogo } from "logo-full.svg"
import { LocationState } from "types"

function Page() {
  const { signIn } = useContext(AuthContext)
  const navigate = useNavigate()
  const state = useLocation().state as LocationState

  const [hasError, setHasError] = useState(false)
  const usernameRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const username = usernameRef.current?.value
    const password = passwordRef.current?.value

    if (username && password) {
      signIn(username, password).then(signedIn => {
        setHasError(!signedIn)
        if (signedIn) {
          navigate(state ? state.from : "/")
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
            <form className="mt-8" onSubmit={onSubmit}>
              <div className="mt-4">
                <Text>Username</Text>
                <TextInput className="mt-2" placeholder="user.name" ref={usernameRef} error={hasError}></TextInput>
              </div>
              <div className="mt-6">
                <Flex flexDirection="row" justifyContent="between">
                  <Text>Password</Text>
                  <Button variant="light" tooltip="Contact us!" tabIndex={-1} onClick={e => e.preventDefault()}>
                    Forgot password?
                  </Button>
                </Flex>
                <TextInput
                  className="mt-2"
                  placeholder="••••••••"
                  ref={passwordRef}
                  error={hasError}
                  errorMessage={hasError ? "Wrong username or password" : undefined}
                  type="password"
                ></TextInput>
              </div>
              <Button type="submit" size="lg" className="w-full mt-8">
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
