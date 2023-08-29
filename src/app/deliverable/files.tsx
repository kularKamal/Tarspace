import { IconCloudDownload } from "@tabler/icons-react"
import { Button, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow, Text } from "@tremor/react"
import { humanizeFileSize } from "utils"

export type FilesViewProps = {
  customer: string
  project: string
  deliverable: string
}

export function FilesView() {
  return (
    <Table>
      <TableHead>
        <TableHeaderCell>Name</TableHeaderCell>
        <TableHeaderCell>Extension</TableHeaderCell>
        <TableHeaderCell>Size</TableHeaderCell>
        <TableHeaderCell>Action</TableHeaderCell>
      </TableHead>
      <TableBody>
        <TableRow>
          <TableCell className="w-full">
            <Text>file</Text>
          </TableCell>
          <TableCell>
            <Text className="font-mono">.tar.gz</Text>
          </TableCell>
          <TableCell>
            <Text>{humanizeFileSize(64277)}</Text>
          </TableCell>
          <TableCell className="py-1">
            <Button variant="light" icon={IconCloudDownload} size="lg">
              Download
            </Button>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="w-full">
            <Text>file</Text>
          </TableCell>
          <TableCell>
            <Text className="font-mono">.tar.gz</Text>
          </TableCell>
          <TableCell>
            <Text>{humanizeFileSize(64277)}</Text>
          </TableCell>
          <TableCell className="py-1">
            <Button variant="light" icon={IconCloudDownload} size="lg">
              Download
            </Button>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="w-full">
            <Text>file</Text>
          </TableCell>
          <TableCell>
            <Text className="font-mono">.tar.gz</Text>
          </TableCell>
          <TableCell>
            <Text>{humanizeFileSize(64277)}</Text>
          </TableCell>
          <TableCell className="py-1">
            <Button variant="light" icon={IconCloudDownload} size="lg">
              Download
            </Button>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  )
}
