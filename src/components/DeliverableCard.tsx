import { Badge, Button, Card, Flex, Subtitle, Title } from "@tremor/react"
import { Icon } from "@iconify/react"

const DownloadIcon = () => <Icon height={32} icon="tabler:cloud-download" />
const ChevronIcon = () => <Icon height={18} icon="tabler:chevron-right" />

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
      <Button variant="light" icon={DownloadIcon} />
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
