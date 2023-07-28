import { IconChevronRight, IconCloudDownload } from "@tabler/icons-react"
import { Badge, Button, Card, Flex, Subtitle, Title } from "@tremor/react"

const DownloadIcon = () => <IconCloudDownload size={32} />
const ChevronIcon = () => <IconChevronRight size={18} />

const DeliverableCard = () => (
  <Card>
    <Flex>
      <div>
        <Flex className="gap-2">
          <Title>Deliverable name</Title>
          <Badge size="xs">0.0.1</Badge>
        </Flex>
        <Subtitle>Deliverable description</Subtitle>
      </div>
      <Button variant="light" icon={DownloadIcon} size="xl" />
    </Flex>
    <Flex className="mt-6 pt-4 border-t">
      {/* FIXME: align icon vertically */}
      <Button size="xs" variant="light" icon={ChevronIcon} iconPosition="right">
        Details
      </Button>
    </Flex>
  </Card>
)

export default DeliverableCard
