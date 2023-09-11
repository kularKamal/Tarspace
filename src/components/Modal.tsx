import { Dialog, Transition } from "@headlessui/react"
import { Button, Flex } from "@tremor/react"
import { Fragment, ReactElement, useState } from "react"

import { ScreenOverlay } from "components/ScreenOverlay"

export type ModalProps = {
  children: ReactElement
}

export function Modal({ children }: ModalProps) {
  const [showModal, setShowModal] = useState(false)

  const closeModal = () => setShowModal(false)

  return (
    <>
      <Button onClick={() => setShowModal(true)}>Open regular modal</Button>
      <Transition appear show={showModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeModal}>
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
                    <Button variant="secondary" onClick={closeModal}>
                      Close
                    </Button>
                  </Flex>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}
