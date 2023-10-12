import { Dialog, Transition } from "@headlessui/react"
import { Button, Flex } from "@tremor/react"
import { Fragment, ReactElement } from "react"
import { createPortal } from "react-dom"

import { ScreenOverlay } from "components"
import { ModalToggler } from "hooks"

export type ModalProps = {
  isShowing: boolean
  hide: ModalToggler
  children: ReactElement | ReactElement[]
}

export function Modal({ isShowing = false, hide, children }: ModalProps) {
  return createPortal(
    <>
      <Transition
        appear
        show={isShowing || false}
        as={Fragment}
        enter="transition-opacity duration-75"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-150"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <Dialog as="div" className="relative z-50" onClose={hide}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <ScreenOverlay zIndex={0} />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-xl transform overflow-hidden ring-tremor bg-white p-6 text-left align-middle shadow-tremor transition-all rounded-xl">
                  {children}

                  <Flex justifyContent="end" className="border-t pt-4 mt-8">
                    <Button variant="secondary" onClick={_ => hide()}>
                      Close
                    </Button>
                  </Flex>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>,
    document.body
  )
}
