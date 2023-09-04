import { Text as CMText, Extension } from "@codemirror/state"
import { IconDeviceFloppy, IconPaperclip, IconPencil } from "@tabler/icons-react"
import { Button, Card, Flex, Tab, TabGroup, TabList, TabPanel, TabPanels, Text } from "@tremor/react"
import CodeMirror, { ReactCodeMirrorRef } from "@uiw/react-codemirror"
import { EditorView } from "codemirror"
import { DateTime } from "luxon"
import { MouseEvent, useContext, useEffect, useRef, useState } from "react"
import { useEventListener } from "usehooks-ts"

import { VFSBrowser } from "components/VFSBrowser"
import { AppContext, AuthContext } from "contexts"
import { ConfigurationDoc, CouchdbAttachmentsWithExclusiveUnion } from "types"
import { getCodeMirrorMode } from "utils/editor"

const EXT: Extension[] = [
  EditorView.theme({
    ".cm-scroller": {
      height: "100%",
      overflow: "auto",
      "-webkit-user-select": "none",
      "-moz-user-select": "none",
      "-ms-user-select": "none",
      "user-select": "none",
    },
    ".cm-content, .cm-gutter, .cm-editor": {
      height: "100%",
      minHeight: "20vh",
    },
    "&.cm-editor.cm-focused": {
      outline: "none",
    },
  }),
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
      .view<(string | undefined)[], ConfigurationDoc>("configurations", {
        include_docs: true,
        inclusive_end: true,
        att_encoding_info: true,
        start_key: [customer, project, deliverable, "production"],
        end_key: [customer, project, deliverable, "production"],
      })
      .then(resp => {
        if (resp.rows.length === 0) {
          return
        }

        const doc = resp.rows[0].doc
        setConfigDoc(doc || null)

        const text = CMText.of(configString.split("\n"))
        setBaseText(text)
        setCurrentText(text)
      })
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
      project: project,
      deliverable: deliverable,
      stage: "production",
      timestamp: now.toISO() as string,
    }
    await CouchdbManager.db(userDb)
      .createOrUpdateDoc(newConfig)
      .then(resp => {
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

  const a: CouchdbAttachmentsWithExclusiveUnion = {
    "dir/file2.yaml": {
      content_type: "",
      data: "",
      digest: "",
      revpos: 1,
    },
    "dir/subdir/file3.yaml": {
      content_type: "",
      data: "",
      digest: "",
      revpos: 1,
    },
    "file1.yaml": {
      content_type: "",
      data: "",
      digest: "",
      revpos: 1,
    },
  }

  return (
    <Card className="mt-6 p-0 min-h-[20vh]">
      <TabGroup>
        <Flex className="space-x-6 sticky py-6 pr-6 top-0 z-10 bg-tremor-background shadow-tremor-card">
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
              theme={"light"}
              extensions={extensions}
              ref={editor}
              onChange={(_, viewUpdate) => {
                if (viewUpdate.docChanged) {
                  setCurrentText(viewUpdate.state.doc)
                }
              }}
              autoFocus
              indentWithTab
            />
          </TabPanel>
          <TabPanel className="h-[60vh] mt-0 p-6">
            <VFSBrowser attachments={configDoc._attachments ?? {}} rootFolderName={deliverable} />
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </Card>
  )
}
