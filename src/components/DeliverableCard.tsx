import { IconChevronRight, IconCloudDownload } from "@tabler/icons-react"
import { Badge, Button, Card, Flex, Subtitle, Title } from "@tremor/react"
import { FC } from "react"

const DownloadIcon = () => <IconCloudDownload size={32} />
const ChevronIcon = () => <IconChevronRight size={18} />

type ArtifactCardProps = Record<string, never>

const ArtifactCard: FC<ArtifactCardProps> = () => (
  <Card>
    <Flex>
      <div>
        <Flex className="gap-2">
          <Title>Artifact name</Title>
          <Badge size="xs">0.0.1</Badge>
        </Flex>
        <Subtitle>Artifact description</Subtitle>
      </div>
      <Button variant="light" icon={DownloadIcon} size="xl" />
    </Flex>
    {/* <Flex className="mt-6 pt-4 border-t">
      <Button size="xs" variant="light" icon={ChevronIcon} iconPosition="right">
        Details
      </Button>
    </Flex> */}
  </Card>
)

export default ArtifactCard
