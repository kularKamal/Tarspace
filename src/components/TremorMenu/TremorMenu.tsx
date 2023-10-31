import { Menu, Transition } from "@headlessui/react"
import { Fragment, ReactElement } from "react"
import { twMerge } from "tailwind-merge"

export type TremorMenuProps = {
  button: ReactElement
  children: ReactElement[] | ReactElement
}

export function TremorMenu({ button, children }: TremorMenuProps) {
  return (
    <Menu as="div" className="relative inline-block text-left min-w-[10rem] text-tremor-default">
      {button}
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          as="div"
          className={twMerge(
            // common
            "absolute z-10 divide-y overflow-y-auto max-h-[228px] w-full left-0 outline-none rounded-tremor-default my-1 border",
            // light
            "bg-tremor-background border-tremor-border divide-tremor-border shadow-tremor-dropdown",
            // dark
            "dark:bg-dark-tremor-background dark:border-dark-tremor-border dark:divide-dark-tremor-border dark:shadow-dark-tremor-dropdown"
          )}
        >
          {children}
        </Menu.Items>
      </Transition>
    </Menu>
  )
}
