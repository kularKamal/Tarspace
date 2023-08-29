import { IconCloudDownload, IconFilesOff, IconFolderOpen } from "@tabler/icons-react"
import { Button, Flex, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow, Text } from "@tremor/react"
import axios from "axios"
import { FC, useContext, useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { AppContext, AuthContext } from "contexts"
import { DeliverableDoc } from "types"
import { humanizeFileSize } from "utils"

export type FilesViewProps = {
  customer: string
  project: string
  deliverable: string
  version: string
}

export function FilesView({ customer, project, deliverable, version }: FilesViewProps) {
  const { CouchdbManager } = useContext(AppContext)
  const { username } = useContext(AuthContext)

  const dbName = "userdb-" + Buffer.from(username as string).toString("hex")
  const designDoc = username as string

  const [uploads, setUploads] = useState<[string, string][]>([])

  useEffect(() => {
    CouchdbManager.db(dbName)
      .design(designDoc)
      .view<(string | undefined)[], DeliverableDoc>("deliverables", {
        reduce: false,
        include_docs: true,
        start_key: [customer, project, deliverable, version],
        end_key: [customer, project, deliverable, version],
      })
      .then(resp => {
        if (resp.total_rows < 1) {
          return
        }

        const uploads = resp.rows.filter(row => row.doc !== undefined).at(0)?.doc?.uploads
        if (uploads) {
          setUploads(Object.entries(uploads))
        }
      })
  }, [CouchdbManager, customer, dbName, deliverable, designDoc, project, version])

  if (uploads.length < 1) {
    return <EmptyView />
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Name</TableHeaderCell>
          <TableHeaderCell>Type</TableHeaderCell>
          <TableHeaderCell>Size</TableHeaderCell>
          <TableHeaderCell>Action</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {uploads.map(([filename, url]) => (
          <FileRow filename={filename} url={url} key={filename} />
        ))}
      </TableBody>
    </Table>
  )
}

type FileRowProps = {
  filename: string
  url: string
}

const FileRow: FC<FileRowProps> = ({ filename, url }) => {
  const [size, setSize] = useState(0)
  const [type, setType] = useState("-")
  const [err, setErr] = useState(false)

  useEffect(() => {
    axios
      .head(url)
      .then(resp => {
        setSize(parseInt(resp.headers["content-length"]))
        setType(resp.headers["content-type"])
      })
      .catch(_ => setErr(true))
  }, [url])

  return (
    <TableRow>
      <TableCell className="w-full">
        <Text>{filename}</Text>
      </TableCell>
      <TableCell>
        <Text className="font-mono">{type}</Text>
      </TableCell>
      <TableCell>
        <Text>{err ? "-" : humanizeFileSize(size)}</Text>
      </TableCell>
      <TableCell className="">
        <Link to={url}>
          <Button
            variant="light"
            icon={IconCloudDownload}
            size="lg"
            disabled={err}
            tooltip={err ? "Broken link" : undefined}
          >
            Download
          </Button>
        </Link>
      </TableCell>
    </TableRow>
  )
}

const EmptyView = () => (
  <Flex justifyContent="around" className="my-4">
    <Flex flexDirection="col" className="h-full w-1/4" justifyContent="center">
      <IconFolderOpen size={32} stroke={1} className="text-tremor-content-subtle" />
      <Text className="mt-4 text-tremor-content-subtle text-center">No files</Text>
    </Flex>
  </Flex>
)
