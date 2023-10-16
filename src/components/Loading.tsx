import { Transition } from "@headlessui/react"
import { Flex, Text } from "@tremor/react"
import { useEffect, useState } from "react"

import { Spinner } from "components/Spinner"

export type LoadingProps = {
  delay?: number
  text?: string
}

export function Loading({ delay = 100, text = "Loading..." }: LoadingProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShow(true)
    }, delay)
    return () => {
      clearTimeout(timeout)
    }
  }, [delay])

  return (
    <Transition
      show={show}
      as="div"
      enter="transition-opacity duration-50"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-50"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
      className="w-full h-full grid place-items-center opacity-1"
    >
      <Flex flexDirection="col" justifyContent="center" alignItems="center" className="space-y-4">
        <div className="max-w-[10vw]">
          <Spinner />
        </div>
        <Text>{text}</Text>
      </Flex>
    </Transition>
  )
}
