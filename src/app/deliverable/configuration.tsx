import { Text as CMText, Extension } from "@codemirror/state"
import { CouchdbDoc, URL_SEPARATOR } from "@iotinga/ts-backpack-couchdb-client"
import {
  IconAlertTriangle,
  IconCloudDownload,
  IconCloudUpload,
  IconDeviceFloppy,
  IconFileZip,
  IconSettingsOff,
} from "@tabler/icons-react"
import { Button, Card, Flex, Icon, Select, SelectItem, Text, TextInput, Title } from "@tremor/react"
import CodeMirror, { ReactCodeMirrorRef } from "@uiw/react-codemirror"
import axios from "axios"
import { EditorView } from "codemirror"
import { Dispatch, MouseEvent, SetStateAction, useCallback, useContext, useEffect, useRef, useState } from "react"
import { useEventListener } from "usehooks-ts"

import { FileUploadButton, Modal } from "components"
import { Configuration } from "config"
import { AppContext, AuthContext } from "contexts"
import { ModalToggler, useDebouncedState, useModal } from "hooks"
import { ConfigurationDoc } from "types"
import {
  CONFIGURATION_FILENAME,
  FileValidationStatus,
  SUPPORTED_MIMETYPES,
  getCodeMirrorMode,
  titlecase,
  validateFile,
} from "utils"

const EXT: Extension[] = [
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
      dark: false,
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
  const { CouchdbClient, CliAPIClient } = useContext(AppContext)
  const { username, userDb } = useContext(AuthContext)
  const designDoc = username as string

  const editor = useRef<ReactCodeMirrorRef>(null)
  const [extensions, setExtensions] = useState<Extension[]>(EXT)
  const [isSaving, setIsSaving] = useState(false)

  const [selectedStage, setSelectedStage] = useState<string | null>(null)
  const [configDoc, setConfigDoc] = useState<ConfigurationDoc | null>(null)

  const [baseText, setBaseText] = useState<CMText>(CMText.empty)
  const [currentText, setCurrentText] = useState(baseText)
  const configString = baseText.toString()

  const attachment = configDoc && configDoc._attachments ? Object.entries(configDoc._attachments)[0] : null
  const isZipConfig = attachment ? attachment[1].content_type === "application/zip" : false

  useEventListener("beforeunload", e => {
    if (!currentText || !baseText) {
      return
    }

    if (!currentText.eq(baseText)) {
      e.preventDefault()
      e.returnValue = ""
    }
  })

  useEffect(() => setSelectedStage(stages[0]), [stages])

  useEffect(() => {
    if (!userDb || !selectedStage) {
      return
    }

    CouchdbClient.db(userDb)
      .design(designDoc)
      .view<(string | undefined)[], ConfigurationDoc>("configurations-latest", {
        reduce: true,
        key: [customer, project, deliverable, selectedStage],
      })
      .then(resp => {
        if (resp.rows.length === 0) {
          throw Error
        }

        const value = resp.rows[0].value as Pick<CouchdbDoc, "_id">
        if (!value._id) {
          throw Error
        }

        return CouchdbClient.db(userDb).get<ConfigurationDoc>(value._id, {
          // attachments: true,
          att_encoding_info: true,
        })
      })
      .then(resp => {
        setConfigDoc(resp)
      })
      .catch(_ => {})
  }, [CouchdbClient, customer, deliverable, designDoc, project, selectedStage, userDb])

  const downloadAttachment = useCallback(
    (filename: string) => {
      if (!configDoc) {
        return Promise.reject()
      }

      // HACK: remove this when the couchdb client supports attachments
      const path = [
        `${Configuration.couchdb.protocol}://${Configuration.couchdb.host}:${Configuration.couchdb.port}`,
        userDb,
        encodeURIComponent(configDoc._id ?? ""),
        filename,
      ].join(URL_SEPARATOR)

      return axios
        .get(path, {
          responseType: "blob",
          withCredentials: true,
        })
        .then(resp => resp.data as Blob)
    },
    [configDoc, userDb]
  )

  useEffect(() => {
    if (!configDoc || !configDoc._attachments) {
      return
    }

    const filename = Object.keys(configDoc._attachments)[0]

    downloadAttachment(filename)
      .then(data => {
        if (!data) {
          return
        }

        return data.text()
      })
      .then(textData => {
        if (!textData) {
          return
        }

        setExtensions(old => old.concat(getCodeMirrorMode(filename) ?? []))

        const text = CMText.of(textData.split("\n"))
        setBaseText(text)
        setCurrentText(text)
      })
      .catch(_ => {})
  }, [configDoc, configString, downloadAttachment, userDb])

  const handleSave = useCallback(
    async (event: MouseEvent<HTMLButtonElement>) => {
      if (!userDb || !configDoc || !selectedStage || !attachment) {
        return
      }

      setIsSaving(true)

      const blob = new Blob([currentText.toString()])
      CliAPIClient.uploadConfiguration(
        [project, customer].join("@"),
        deliverable,
        selectedStage,
        configDoc.configuration || "",
        attachment[0],
        blob
      ).then(resp => {
        setIsSaving(false)
      })
    },
    [CliAPIClient, attachment, configDoc, currentText, customer, deliverable, project, selectedStage, userDb]
  )

  const { isShowing, toggle: toggleModal } = useModal()
  const [validationStatus, setValidationStatus] = useState<FileValidationStatus | null>(null)

  const handleUpload = useCallback(
    async (file: File) => {
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

      CliAPIClient.uploadConfiguration(
        [project, customer].join("@"),
        deliverable,
        selectedStage,
        file.type === SUPPORTED_MIMETYPES.zip ? CONFIGURATION_FILENAME : file.name,
        file.name,
        file
      ).then(resp => {
        setIsSaving(false)
      })
    },
    [CliAPIClient, customer, deliverable, project, selectedStage, toggleModal]
  )

  if (!configDoc || !configDoc.configuration || !selectedStage || !attachment) {
    return (
      <Card className="mt-6">
        <UploadErrorModal isShowing={isShowing} toggleModal={toggleModal} validationStatus={validationStatus} />
        <EmptyView handleFile={handleUpload} setSelectedStage={setSelectedStage} />
      </Card>
    )
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
              if (!configDoc._attachments) {
                return
              }

              const filename = Object.keys(configDoc._attachments)[0]
              downloadAttachment(filename).then(data => {
                const a = document.createElement("a")
                const url = window.URL.createObjectURL(data)
                a.href = url
                a.download = filename
                a.click()
                window.URL.revokeObjectURL(url)
              })
            }}
          >
            Download
          </Button>
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
        <Flex flexDirection="col" className="h-full space-y-8" justifyContent="center">
          <Flex className="space-x-2 h-[15vh]" justifyContent="center">
            <Icon icon={IconFileZip} size="xl" className="text-tremor-content-subtle" />

            <div>
              <Title>Configuration is archive</Title>
              <Text className="text-tremor-content-subtle">This configuration is not editable directly.</Text>
            </div>
          </Flex>
        </Flex>
      ) : (
        <CodeMirror
          height="100%"
          width="100%"
          value={configString}
          extensions={extensions}
          theme="light"
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

type EmptyViewProps = {
  handleFile: (file: File) => void
  setSelectedStage: Dispatch<SetStateAction<string | null>>
}
function EmptyView({ handleFile, setSelectedStage }: EmptyViewProps) {
  const [stageName, setStageName] = useDebouncedState("", 100)

  return (
    <Flex className="min-h-[50vh]" justifyContent="around">
      <Flex flexDirection="col" className="h-full w-1/3 space-y-8" justifyContent="center">
        <Flex className="space-x-4" justifyContent="center">
          <Icon icon={IconSettingsOff} size="xl" className="text-tremor-content-subtle" />

          <div>
            <Title>No configuration found</Title>
            <Text className="text-tremor-content-subtle">This deliverable has not been configured yet.</Text>
          </div>
        </Flex>
        <Flex className="space-x-4 w-full" justifyContent="center">
          <TextInput placeholder="Name a stage..." onChange={e => setStageName(e.target.value)} />
          <FileUploadButton
            handleFile={f => {
              setSelectedStage(stageName)
              handleFile(f)
            }}
            icon={IconCloudUpload}
            text="Upload configuration"
            variant="secondary"
            disabled={stageName === ""}
          />
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
