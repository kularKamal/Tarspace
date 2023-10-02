import { Badge, Card, Flex, Grid, Metric, Table, TableBody, TableCell, TableRow, Text, Title } from "@tremor/react"
import { useContext, useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { Breadcrumbs } from "components"
import { AppContext, AuthContext } from "contexts"
import { EventDoc, StageInfoMap } from "types"
import { formatTimestamp, isStageName, titlecase } from "utils"

// const ChevronIcon = () => <IconChevronRight height={18} />

// const DeliverablesTable = (props: { deliverables: string[] }) => (
//   <Table className="mt-6">
//     <TableHead>
//       <TableRow>
//         <TableHeaderCell>ID</TableHeaderCell>
//         <TableHeaderCell>ID</TableHeaderCell>
//         <TableHeaderCell>ID</TableHeaderCell>
//         <TableHeaderCell>ID</TableHeaderCell>
//         <TableHeaderCell>ID</TableHeaderCell>
//         <TableHeaderCell className="text-right"></TableHeaderCell>
//       </TableRow>
//     </TableHead>
//     <TableBody>
//       {props.deliverables.map((d, index) => (
//         <TableRow key={index}>
//           <TableCell>{d}</TableCell>
//           <TableCell className="text-right">
//             <Link to={d}>
//               <Button size="xs" variant="light" icon={ChevronIcon} iconPosition="right">
//                 See details
//               </Button>
//             </Link>
//           </TableCell>
//         </TableRow>
//       ))}
//     </TableBody>
//   </Table>
// )

function Page() {
  const { CouchdbManager } = useContext(AppContext)
  const { username, userDb } = useContext(AuthContext)

  const designDoc = username as string
  // if (userCtx !== undefined && userCtx.roles.includes("_admin")) {
  //   dbName = "companylog-ia6ch3s4"
  //   designDoc = "companylog"
  // }

  const { project, customer } = useParams()

  const [deliverables, setDeliverables] = useState<string[]>([])
  const [lastPublishedVersions, setLastPublishedVersions] = useState<Record<string, StageInfoMap>>({})

  const [notFound, setNotFound] = useState(false)
  const navigate = useNavigate()

  if (notFound) {
    navigate("/not-found")
  }

  useEffect(() => {
    if (!userDb) {
      return
    }

    CouchdbManager.db(userDb)
      .design(designDoc)
      .view("deliverables", {
        group_level: 3,
        reduce: true,
        start_key: [customer, project],
        end_key: [customer, project, "\uffff"],
      })
      .then(resp => {
        if (resp.total_rows === 0) {
          setNotFound(true)
        }
        setDeliverables(resp.rows.map(row => (row.key as string[])[2]))
      })
  }, [CouchdbManager, customer, designDoc, project, userDb])

  useEffect(() => {
    if (!userDb) {
      return
    }

    CouchdbManager.db(userDb)
      .design(designDoc)
      .viewQueries<(string | undefined)[], EventDoc>("latest-published-version", {
        queries: deliverables.map(d => ({
          reduce: false,
          include_docs: true,
          start_key: [customer, project, d],
          end_key: [customer, project, d, "\uffff"],
        })),
      })
      .then(resp => {
        const map: Record<string, StageInfoMap> = {}
        // const a = resp.results.flatMap(res => res.rows)
        resp.results
          .flatMap(res => res.rows)
          .forEach(row => {
            const stageName = row.key.pop()
            const deliverableName = row.key.pop() as string

            deliverableName in map || (map[deliverableName] = {})
            if (isStageName(stageName) && row.doc) {
              map[deliverableName][stageName] = {
                latestVersion: row.value as string,
                timestamp: row.doc.timestamp,
                configurationId: row.doc.config_id as string,
                repository: row.doc.repository,
              }
            }
          })
        setLastPublishedVersions(map)
      })
  }, [CouchdbManager, customer, deliverables, designDoc, project, userDb])

  return (
    <>
      <Flex flexDirection="col" alignItems="start" className="space-y-4 mb-6">
        <Breadcrumbs />
        <Metric className="text-left">Project</Metric>
      </Flex>

      <Grid numItemsMd={2} className="gap-6">
        {deliverables.map(deliverable => (
          <Link to={deliverable} key={deliverable}>
            <Card className="w-full hover:ring transition transition-all">
              <Title>{deliverable}</Title>
              {/* <List className="mt-4">
                {lastPublishedVersions[deliverable] &&
                  Object.entries(lastPublishedVersions[deliverable]).map(([stageName, stageInfo]) => (
                    // TODO: use a table?
                    <ListItem key={stageName + deliverable}>
                      <Flex>
                        <Text>{titlecase(stageName)}</Text>
                        <Text>{stageInfo.latestVersion}</Text>
                        <Text>{formatTimestamp(stageInfo.timestamp)}</Text>
                      </Flex>
                    </ListItem>
                  ))}
              </List> */}
              <Table className="mt-4">
                <TableBody>
                  {lastPublishedVersions[deliverable] &&
                    Object.entries(lastPublishedVersions[deliverable]).map(([stageName, stageInfo]) => (
                      // TODO: use a table?
                      <TableRow key={stageName + deliverable}>
                        <TableCell>
                          <Text>{titlecase(stageName)}</Text>
                        </TableCell>
                        <TableCell>
                          <Badge color="gray">{stageInfo.latestVersion}</Badge>
                        </TableCell>
                        <TableCell>
                          <Text>{formatTimestamp(stageInfo.timestamp)}</Text>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </Card>
          </Link>
        ))}
      </Grid>
    </>
  )
}

export default Page
