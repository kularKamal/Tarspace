import { Text as CMText, Extension } from "@codemirror/state"
import {
  IconAlertTriangle,
  IconCloudDownload,
  IconCloudUpload,
  IconDeviceFloppy,
  IconFileZip,
  IconPlus,
  IconSettingsOff,
} from "@tabler/icons-react"
import { Button, Card, Flex, Icon, Select, SelectItem, Text, Title } from "@tremor/react"
import CodeMirror, { ReactCodeMirrorRef } from "@uiw/react-codemirror"
import axios from "axios"
import { EditorView } from "codemirror"
import { MouseEvent, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { useDarkMode, useEventListener } from "usehooks-ts"

import { FileUploadButton, Modal } from "components"
import { Configuration } from "config"
import { AppContext, AuthContext } from "contexts"
import { ModalToggler, useModal } from "hooks"
import { ConfigurationDoc, STAGE_NAMES } from "types"
import {
  CONFIGURATION_FILENAME,
  FileValidationStatus,
  SUPPORTED_MIMETYPES,
  getCodeMirrorMode,
  titlecase,
  validateFile,
} from "utils"

const getExt = (dark: boolean): Extension[] => [
  EditorView.theme(
    {
      ".cm-scroller": {
        height: "100%",
        overflow: "auto",
      },
      ".cm-gutters": {
        userSelect: "none",
        // backgroundColor: "inherit",
        // borderRight: 0,
      },
      ".cm-content, .cm-gutter, .cm-editor": {
        height: "100%",
        minHeight: "20vh",
      },
      "&.cm-editor.cm-focused": {
        outline: "none",
      },
      ".cm-foldGutter span": {
        fontSize: "1.1rem",
        lineHeight: "1.1rem",
        color: "rgb(130, 130, 130, 0.5)",
      },
      ".cm-foldGutter span:hover": {
        color: "#999999",
      },
    },
    {
      dark,
    }
  ),
]

export type ConfigurationEditorProps = {
  customer: string
  project: string
  deliverable: string
  stages: string[]
}
export default function ConfigurationEditor({ customer, project, deliverable, stages }: ConfigurationEditorProps) {
  const { username } = useContext(AuthContext)
  const designDoc = username as string

  const { isDarkMode } = useDarkMode()

  const editor = useRef<ReactCodeMirrorRef>(null)
  const [extensions, setExtensions] = useState<Extension[]>(getExt(isDarkMode))
  const [isSaving, setIsSaving] = useState(false)

  const [selectedStage, setSelectedStage] = useState<string>(STAGE_NAMES.PRODUCTION)
  const [configDoc, setConfigDoc] = useState<ConfigurationDoc | null>(null)

  const [baseText, setBaseText] = useState<CMText>(CMText.empty)
  const [currentText, setCurrentText] = useState(baseText)
  const configString = baseText.toString()

  const attachment = useMemo(
    () => (configDoc && configDoc._attachments ? Object.entries(configDoc._attachments)[0] : null),
    [configDoc]
  )
  const isZipConfig = attachment ? attachment[1].content_type === "application/zip" : false

  useEffect(() => {
    setExtensions(getExt(isDarkMode))
  }, [isDarkMode])

  useEventListener("beforeunload", e => {
    if (!currentText || !baseText) {
      return
    }

    if (!currentText.eq(baseText)) {
      e.preventDefault()
      e.returnValue = ""
    }
  })

  // useEffect(() => {
  //   if (!userDb || !selectedStage) {
  //     return
  //   }

  //   CouchdbClient.db(userDb)
  //     .design(designDoc)
  //     .view<(string | undefined)[], ConfigurationDoc>("configurations-latest", {
  //       reduce: true,
  //       key: [customer, project, deliverable, selectedStage],
  //     })
  //     .then(resp => {
  //       if (resp.rows.length === 0) {
  //         throw Error
  //       }

  //       const value = resp.rows[0].value as Pick<CouchdbDoc, "_id">
  //       if (!value._id) {
  //         throw Error
  //       }

  //       return CouchdbClient.db(userDb).get<ConfigurationDoc>(value._id, {
  //         // attachments: true,
  //         att_encoding_info: true,
  //       })
  //     })
  //     .then(resp => {
  //       setConfigDoc(resp)
  //     })
  //     .catch(_ => setConfigDoc(null))
  // }, [CouchdbClient, customer, deliverable, designDoc, project, selectedStage, userDb])

  const downloadAttachment = useCallback(
    (filename: string) => {
      // if (!configDoc) {
      //   return Promise.reject()
      // }
      // // HACK: remove this when the couchdb client supports attachments
      // const path = [
      //   `${Configuration.couchdb.protocol}://${Configuration.couchdb.host}:${Configuration.couchdb.port}`,
      //   userDb,
      //   encodeURIComponent(configDoc._id ?? ""),
      //   filename,
      // ].join(URL_SEPARATOR)
      // return axios
      //   .get(path, {
      //     responseType: "blob",
      //     withCredentials: true,
      //   })
      //   .then(resp => resp.data as Blob)
    },
    [configDoc]
  )

  useEffect(() => {
    if (!attachment) {
      return
    }

    const filename = attachment[0]

    // downloadAttachment(filename)
    //   .then(data => {
    //     if (!data) {
    //       return
    //     }

    //     return data.text()
    //   })
    //   .then(textData => {
    //     if (!textData) {
    //       return
    //     }

    //     setExtensions(old => old.concat(getCodeMirrorMode(filename) ?? []))

    //     const text = CMText.of(textData.split("\n"))
    //     setBaseText(text)
    //     setCurrentText(text)
    //   })
    //   .catch(_ => {})
  }, [attachment, configString, downloadAttachment])

  const handleSave = async (event: MouseEvent<HTMLButtonElement>) => {
    // if (!userDb || !configDoc?.configuration || !selectedStage) {
    //   return
    // }
    // setIsSaving(true)
    // const blob = new Blob([currentText.toString()])
    // CliAPIClient.uploadConfiguration(
    //   [project, customer].join("@"),
    //   deliverable,
    //   selectedStage,
    //   configDoc.configuration || "config.yaml",
    //   attachment ? attachment[0] : "config.yaml",
    //   blob
    // ).then(
    //   resp => {
    //     setIsSaving(false)
    //   },
    //   err => {
    //     setIsSaving(false)
    //   }
    // )
  }

  const { isShowing, toggle: toggleModal } = useModal()
  const [validationStatus, setValidationStatus] = useState<FileValidationStatus | null>(null)

  const handleUpload = async (file: File) => {
    if (!selectedStage) {
      return
    }

    const validation = await validateFile(file)
    if (!validation.valid) {
      setValidationStatus(validation)
      toggleModal(true)
      return
    }

    setIsSaving(true)

    // CliAPIClient.uploadConfiguration(
    //   [project, customer].join("@"),
    //   deliverable,
    //   selectedStage,
    //   file.type === SUPPORTED_MIMETYPES.zip ? CONFIGURATION_FILENAME : file.name,
    //   file.name,
    //   file
    // ).then(
    //   resp => {
    //     setIsSaving(false)
    //   },
    //   err => {
    //     setIsSaving(false)
    //   }
    // )
  }

  return (
    <Card className="mt-6 p-0 min-h-[20vh]">
      <UploadErrorModal isShowing={isShowing} toggleModal={toggleModal} validationStatus={validationStatus} />
      <Flex className="space-x-6 sticky py-6 pr-6 top-0 z-10 bg-tremor-background dark:bg-dark-tremor-background border-b border-b-tremor-border dark:border-b-dark-tremor-background-subtle rounded-t-tremor-default">
        <Select
          className="ml-6 w-auto"
          value={selectedStage}
          onValueChange={value => setSelectedStage(value)}
          enableClear={false}
        >
          {stages.map(stage => (
            <SelectItem key={stage} value={stage}>
              {titlecase(stage)}
            </SelectItem>
          ))}
        </Select>
        <Flex justifyContent="end" alignItems="baseline" className="space-x-4">
          {configDoc && attachment && (
            <>
              <FileUploadButton
                handleFile={handleUpload}
                icon={IconCloudUpload}
                variant="secondary"
                size="xs"
                type="submit"
                tooltip="Upload a new configuration file"
              />
              <Button
                icon={IconCloudDownload}
                variant="secondary"
                size="xs"
                tooltip="Download the current configuration file"
                onClick={_ => {
                  if (!configDoc || !configDoc._attachments) {
                    return
                  }

                  const filename = Object.keys(configDoc._attachments)[0]
                  // downloadAttachment(filename).then(data => {
                  //   const a = document.createElement("a")
                  //   const url = window.URL.createObjectURL(data)
                  //   a.href = url
                  //   a.download = filename
                  //   a.click()
                  //   window.URL.revokeObjectURL(url)
                  // })
                }}
              >
                Download
              </Button>
            </>
          )}
          <Button
            icon={IconDeviceFloppy}
            onClick={handleSave}
            size="xs"
            disabled={currentText.eq(baseText)}
            tooltip={currentText.eq(baseText) ? "No changes to save" : undefined}
            loading={isSaving}
          >
            Save
          </Button>
        </Flex>
      </Flex>
      {isZipConfig ? (
        <ArchiveView />
      ) : !configDoc ? (
        <EmptyView
          handleFile={handleUpload}
          handleCreate={() =>
            setConfigDoc({
              configuration: "config.yaml",
              type: "configuration",
              project: project,
              deliverable: deliverable,
              timestamp: "",
              stage: selectedStage,
            })
          }
        />
      ) : (
        <CodeMirror
          height="100%"
          width="100%"
          value={configString}
          extensions={extensions}
          theme={isDarkMode ? "dark" : "light"}
          ref={editor}
          onChange={(_, viewUpdate) => {
            if (viewUpdate.docChanged) {
              setCurrentText(viewUpdate.state.doc)
            }
          }}
          autoFocus
          indentWithTab
        />
      )}
    </Card>
  )
}

const ArchiveView = () => (
  <Flex flexDirection="col" className="h-full space-y-8" justifyContent="center">
    <Flex className="space-x-2 h-[15vh]" justifyContent="center">
      <Icon icon={IconFileZip} size="xl" className="text-tremor-content-subtle" />

      <div>
        <Title>Configuration is archive</Title>
        <Text className="text-tremor-content-subtle">This configuration is not editable directly.</Text>
      </div>
    </Flex>
  </Flex>
)

type EmptyViewProps = {
  handleFile: (file: File) => void
  handleCreate: () => void
}
function EmptyView({ handleFile, handleCreate }: EmptyViewProps) {
  return (
    <Flex className="min-h-[50vh]" justifyContent="around">
      <Flex flexDirection="col" className="h-full w-1/3 space-y-8" justifyContent="center">
        <Flex className="space-x-4" justifyContent="center">
          <Icon icon={IconSettingsOff} size="xl" className="text-tremor-content-subtle" />

          <div>
            <Title>No configuration found</Title>
            <Text className="text-tremor-content-subtle">This stage has not been configured yet.</Text>
          </div>
        </Flex>
        <Flex className="space-x-4 w-full" justifyContent="center" alignItems="stretch">
          <Button
            icon={IconPlus}
            onClick={() => {
              // handleFile(new File([""], "config.yaml", { type: "application/x-yaml" }))
              handleCreate()
            }}
          >
            Create
          </Button>
          <FileUploadButton handleFile={handleFile} icon={IconCloudUpload} text="Upload" variant="secondary" />
        </Flex>
      </Flex>
    </Flex>
  )
}

type UploadErrorModalProps = {
  isShowing: boolean
  toggleModal: ModalToggler
  validationStatus: FileValidationStatus | null
}
const UploadErrorModal = ({ isShowing, toggleModal, validationStatus }: UploadErrorModalProps) => (
  <Modal isShowing={isShowing} hide={toggleModal}>
    <Flex className="space-x-5" justifyContent="start" alignItems="start">
      <Icon size="lg" color="amber" variant="light" icon={IconAlertTriangle} />
      <Flex flexDirection="col" className="space-y-2 w-full mt-2" justifyContent="start" alignItems="start">
        <Title className="mb-2">Could not upload file</Title>
        <Text>
          {validationStatus?.message} (<span className="font-mono">{validationStatus?.context}</span>).{" "}
          {validationStatus?.help}
        </Text>
      </Flex>
    </Flex>
  </Modal>
)
