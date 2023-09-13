import { Text as CMText, Extension } from "@codemirror/state"
import { CouchdbDoc, URL_SEPARATOR } from "@iotinga/ts-backpack-couchdb-client"
import { IconDeviceFloppy, IconPaperclip, IconPencil } from "@tabler/icons-react"
import { Button, Card, Flex, Tab, TabGroup, TabList, TabPanel, TabPanels, Text, Title } from "@tremor/react"
import CodeMirror, { ReactCodeMirrorRef } from "@uiw/react-codemirror"
import axios from "axios"
import { EditorView } from "codemirror"
import { DateTime } from "luxon"
import { MouseEvent, useContext, useEffect, useRef, useState } from "react"
import { useEventListener } from "usehooks-ts"

import { AttachmentDownloader, VFSBrowser } from "components/VFSBrowser/VFSBrowser"
import { Configuration } from "config"
import { AppContext, AuthContext } from "contexts"
import { ConfigurationDoc } from "types"
import { getCodeMirrorMode } from "utils/editor"

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
  getCodeMirrorMode("a.json") ?? [],
]

export enum ConfigurationFormat {
  JSON = "json",
  YAML = "yaml",
}

export type ConfigurationEditorProps = {
  customer: string
  project: string
  deliverable: string
}
export function ConfigurationEditor({ customer, project, deliverable }: ConfigurationEditorProps) {
  const { CouchdbManager } = useContext(AppContext)
  const { username, userDb } = useContext(AuthContext)
  const designDoc = username as string

  const editor = useRef<ReactCodeMirrorRef>(null)
  const [extensions, setExtensions] = useState<Extension[]>(EXT)
  const [mode, setMode] = useState("javascript")
  const [isSaving, setIsSaving] = useState(false)

  const [configDoc, setConfigDoc] = useState<ConfigurationDoc | null>(null)
  const configString = JSON.stringify(configDoc?.configuration || {}, null, 2)

  const [baseText, setBaseText] = useState<CMText>(CMText.empty)
  const [currentText, setCurrentText] = useState(baseText)

  useEventListener("beforeunload", e => {
    if (!currentText || !baseText) {
      return
    }

    if (!currentText.eq(baseText)) {
      e.preventDefault()
      e.returnValue = ""
    }
  })

  useEffect(() => {
    if (!userDb) {
      return
    }

    CouchdbManager.db(userDb)
      .design(designDoc)
      .view<(string | undefined)[], ConfigurationDoc>("configurations-latest", {
        reduce: true,
        key: [customer, project, deliverable, "production"],
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
        const text = CMText.of(configString.split("\n"))
        setBaseText(text)
        setCurrentText(text)
      })
      .catch(_ => {})
  }, [CouchdbManager, configString, customer, deliverable, designDoc, project, userDb])

  async function handleSave(event: MouseEvent<HTMLButtonElement>) {
    if (!userDb || !configDoc) {
      return
    }

    setIsSaving(true)
    const now = DateTime.now()
    const newConfig: ConfigurationDoc = {
      _id: `configuration:${project}@${customer}/${deliverable}/production/${now.toMillis()}`,
      type: "configuration",
      configuration: JSON.parse(currentText.toString()),
      project: [project, customer].join("@"),
      deliverable: deliverable,
      stage: "production",
      timestamp: now.toISO() as string,
    }
    await CouchdbManager.db(userDb)
      .createOrUpdateDoc(newConfig)
      .then(_ => {
        setIsSaving(false)
        setConfigDoc(newConfig)
      })
  }

  if (!configDoc) {
    return (
      <Card className="mt-6 h-1/3">
        <Text>Empty</Text>
      </Card>
    )
  }

  // HACK: remove this when the couchd client supports attachments
  const downloader: AttachmentDownloader = async (attachments, filename) => {
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
  }

  return (
    <Card className="mt-6 p-0 min-h-[20vh]">
      <TabGroup>
        <Flex className="space-x-6 sticky py-6 pr-6 top-0 z-10 bg-tremor-background dark:bg-dark-tremor-background border-b-tremor-border dark:border-b-dark-tremor-background-subtle border-b rounded-t-tremor-default">
          <Title className="ml-6">Production</Title>
          <TabList className="mx-6" variant="solid">
            <Tab icon={IconPencil}>Configuration</Tab>
            <Tab icon={IconPaperclip}>Attachments</Tab>
          </TabList>
          <Button
            icon={IconDeviceFloppy}
            onClick={handleSave}
            variant="secondary"
            size="xs"
            disabled={currentText.eq(baseText)}
            tooltip={currentText.eq(baseText) ? "No changes to save" : undefined}
            loading={isSaving}
          >
            Save
          </Button>
        </Flex>
        <TabPanels>
          <TabPanel className="mt-0">
            {/* <Select placeholder="Select format..." className="z-10">
                <SelectItem value="JSON" />
                <SelectItem value="YAML" />
              </Select> */}

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
          </TabPanel>
          <TabPanel className="h-[60vh] mt-0 p-4">
            <VFSBrowser
              attachments={configDoc._attachments ?? {}}
              rootFolderName={deliverable}
              downloader={downloader}
            />
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </Card>
  )
}
