import { Button, Card, Flex, Metric, TextInput } from "@tremor/react"
import Container from "components/Container"
import { useContext, useRef, useState } from "react"
import { AuthContext } from "../../contexts/AuthContext"

function Page() {
  const { signIn } = useContext(AuthContext)
  const [hasError, setHasError] = useState(false)
  const usernameRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const username = usernameRef.current?.value
    const password = passwordRef.current?.value

    if (username && password) {
      signIn(username, password).then(signedIn => setHasError(!signedIn))
    }
  }

  return (
    <Container className="h-full">
      <Flex className="h-full" flexDirection="col" alignItems="center" justifyContent="center">
        <Card className="max-w-sm">
          <Metric>Login</Metric>
          <form className="mt-8" onSubmit={onSubmit}>
            <TextInput className="mt-1" placeholder="Username" ref={usernameRef} error={hasError}></TextInput>
            <TextInput className="mt-4" placeholder="Password" ref={passwordRef} error={hasError}></TextInput>
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
