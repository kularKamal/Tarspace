import { Button, ButtonProps } from "@tremor/react"
import { ChangeEvent, MouseEvent, useRef } from "react"

export type FileUploadButtonProps = ButtonProps & {
  handleFile: (file: File) => void
  text?: string
  enclosingForm?: boolean
}

export function FileUploadButton({
  handleFile,
  enclosingForm = true,
  text = "Upload",
  ...buttonProps
}: FileUploadButtonProps) {
  buttonProps.type ??= "submit"

  // Create a reference to the hidden file input element
  const hiddenFileInput = useRef<HTMLInputElement>(null)

  // Programatically click the hidden file input element
  // when the Button component is clicked
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (!hiddenFileInput.current) {
      return
    }

    hiddenFileInput.current.click()
  }

  // Call a function (passed as a prop from the parent component)
  // to handle the user-selected file
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) {
      return
    }

    const fileUploaded = event.target.files[0]
    handleFile(fileUploaded)
  }

  const Content = (
    <>
      <Button onClick={handleClick} {...buttonProps}>
        {text}
      </Button>
      <input type="file" onChange={handleChange} ref={hiddenFileInput} className="hidden" />
    </>
  )

  return enclosingForm ? <form onSubmit={e => e.preventDefault()}>{Content}</form> : Content
}
