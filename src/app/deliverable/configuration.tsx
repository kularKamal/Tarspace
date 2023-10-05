import { Text as CMText, Extension } from "@codemirror/state"
import { CouchdbDoc, URL_SEPARATOR } from "@iotinga/ts-backpack-couchdb-client"
import { IconCloudDownload, IconCloudUpload, IconSettingsOff } from "@tabler/icons-react"
import { Button, Card, Flex, Select, SelectItem, Text } from "@tremor/react"
import CodeMirror, { ReactCodeMirrorRef } from "@uiw/react-codemirror"
import axios from "axios"
import { EditorView } from "codemirror"
import { DateTime } from "luxon"
import { MouseEvent, useCallback, useContext, useEffect, useRef, useState } from "react"
import { useEventListener } from "usehooks-ts"

import { Configuration } from "config"
import { AppContext, AuthContext } from "contexts"
import { ConfigurationDoc } from "types"
import { getCodeMirrorMode, titlecase } from "utils"

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
export function ConfigurationEditor({ customer, project, deliverable, stages }: ConfigurationEditorProps) {
  const { CouchdbManager } = useContext(AppContext)
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
  const isZipConfig = attachment ? attachment[0].endsWith(".zip") : false

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

    CouchdbManager.db(userDb)
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

        return CouchdbManager.db(userDb).get<ConfigurationDoc>(value._id, {
          // attachments: true,
          att_encoding_info: true,
        })
      })
      .then(resp => {
        setConfigDoc(resp)
      })
      .catch(_ => {})
  }, [CouchdbManager, customer, deliverable, designDoc, project, selectedStage, userDb])

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

  async function handleSave(event: MouseEvent<HTMLButtonElement>) {
    if (!userDb || !configDoc || !selectedStage) {
      return
    }

    setIsSaving(true)

    const now = DateTime.now()
    const newConfig: ConfigurationDoc = {
      _id: `configuration:${project}@${customer}/${deliverable}/${selectedStage}/${now.toMillis()}`,
      type: "configuration",
      configuration: JSON.parse(currentText.toString()),
      project: [project, customer].join("@"),
      deliverable: deliverable,
      stage: selectedStage,
      timestamp: now.toISO() as string,
    }
    await CouchdbManager.db(userDb)
      .createOrUpdateDoc(newConfig)
      .then(_ => {
        setIsSaving(false)
        setConfigDoc(newConfig)
      })
  }

  if (!configDoc || !configDoc.configuration || !selectedStage || !attachment) {
    return (
      <Card className="mt-6">
        <EmptyView />
      </Card>
    )
  }

  return (
    <Card className="mt-6 p-0 min-h-[20vh]">
      <Flex className="space-x-6 sticky py-6 pr-6 top-0 z-10 bg-tremor-background dark:bg-dark-tremor-background border-b-tremor-border dark:border-b-dark-tremor-background-subtle border-b rounded-t-tremor-default">
        <Select className="ml-6 w-auto" value={selectedStage} onValueChange={value => setSelectedStage(value)}>
          {stages.map(stage => (
            <SelectItem key={stage} value={stage}>
              {titlecase(stage)}
            </SelectItem>
          ))}
        </Select>
        {/* <Button
          icon={IconDeviceFloppy}
          onClick={handleSave}
          variant="secondary"
          size="xs"
          disabled={currentText.eq(baseText)}
          tooltip={currentText.eq(baseText) ? "No changes to save" : undefined}
          loading={isSaving}
        >
          Save
        </Button> */}
      </Flex>
      {isZipConfig ? (
        <Flex className="p-8 space-x-6" alignItems="center">
          <Text className="w-full">{attachment[0]}</Text>
          {/* <Button variant="light" icon={IconCloudUpload} size="lg">
            Upload
          </Button> */}
          <Button
            variant="light"
            icon={IconCloudDownload}
            size="lg"
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
          editable={false}
          autoFocus
          indentWithTab
        />
      )}
    </Card>
  )
}

const EmptyView = () => (
  <Flex className="min-h-[50vh]" justifyContent="around">
    <Flex flexDirection="col" className="h-full w-1/5" justifyContent="center">
      <IconSettingsOff size={48} stroke={1} className="text-tremor-content-subtle" />
      <Text className="mt-6 text-tremor-content-subtle text-center">This deliverable has not been configured yet.</Text>
      <Button className="mt-6" variant="secondary" icon={IconCloudUpload}>
        Upload configuration
      </Button>
    </Flex>
  </Flex>
)
