import { Transition } from "@headlessui/react"
import { useEffect, useState } from "react"

export type LoadingProps = {
  delay?: number
  fill?: string
}

export function Loading({ delay = 100, fill = "#216BFF" }: LoadingProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShow(true)
    }, delay)
    return () => {
      clearTimeout(timeout)
    }
  }, [delay])

  // if (!show) {
  //   return null
  // }

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
      className="w-full h-full bg-tremor-background-muted grid place-items-center opacity-1"
    >
      <svg
        className="max-w-[10vw] animate-[spin_2s_ease-in-out_infinite]"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        x="0px"
        y="0px"
        viewBox="0 0 56.7 56.7"
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
    </Transition>
  )
}
