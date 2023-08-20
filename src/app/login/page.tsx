import { Button, Card, Flex, Metric, TextInput } from "@tremor/react"
import { useContext, useRef, useState } from "react"

import Container from "components/Container"
import { AuthContext } from "contexts/AuthContext"
import { useLocation, useNavigate } from "react-router-dom"
import { LocationState } from "types/misc"

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
    <Container className="h-full">
      <Flex className="h-full" flexDirection="col" alignItems="center" justifyContent="center">
        <Card className="max-w-sm">
          <Metric>Login</Metric>
          <form className="mt-8" onSubmit={onSubmit}>
            <TextInput className="mt-1" placeholder="Username" ref={usernameRef} error={hasError}></TextInput>
            <TextInput
              className="mt-4"
              placeholder="Password"
              ref={passwordRef}
              error={hasError}
              errorMessage={hasError ? "Wrong username or password" : undefined}
              type="password"
            ></TextInput>
            <Button type="submit" size="lg" className="w-full mt-8">
              Login
            </Button>
          </form>
        </Card>
      </Flex>
    </Container>
  )
}

export default Page
