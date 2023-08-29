import { IconBrandGithub, IconExternalLink } from "@tabler/icons-react"
import { Button, Card, Flex, Grid, Icon, List, ListItem, Metric, Text, Title } from "@tremor/react"
import { DateTime } from "luxon"
import { Link } from "react-router-dom"

import { StageInfoMap } from "types"
import { titlecase } from "utils"

export type DetailsViewProps = {
  stages: StageInfoMap
}

export function DetailsView({ stages }: DetailsViewProps) {
  return (
    <>
      <Grid numItemsMd={2} numItemsLg={Math.min(3, Object.entries(stages).length)} className="gap-6 mt-6">
        {Object.entries(stages).map(([stageName, info]) => (
          <Card key={stageName}>
            <Metric>{titlecase(stageName)}</Metric>
            <List className="mt-4">
              <ListItem>
                <Flex>
                  <Text>Current installed version</Text>
                  <Text>{info.latestVersion}</Text>
                </Flex>
              </ListItem>
              <ListItem>
                <Flex>
                  <Text>Last update date</Text>
                  <Text>{DateTime.fromISO(info.timestamp).toLocaleString()}</Text>
                </Flex>
              </ListItem>
              <ListItem>
                <Flex>
                  <Text>Configuration</Text>
                  <Link to="">
                    <Text color="blue">LATEST</Text>
                  </Link>
                </Flex>
              </ListItem>
            </List>
          </Card>
        ))}
      </Grid>
      <Grid numItemsMd={2} className="gap-6">
        <div className="mt-6">
          <Card>
            <Icon icon={IconBrandGithub} variant="light" size="lg" color="blue" />
            <Title className="mt-6">Repository</Title>
            <Text className="mt-2">The source code for this deliverable can be found at the following link.</Text>
            <Flex className="mt-6 pt-4 border-t">
              <Link
                to={(Object.values(stages)[0] && Object.values(stages)[0].repository) || "#"}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="xs" variant="light" icon={IconExternalLink} iconPosition="right">
                  Visit
                </Button>
              </Link>
            </Flex>
          </Card>
        </div>
      </Grid>
    </>
  )
}
