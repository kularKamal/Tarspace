import { IconSearch, IconSearchOff, IconZoomExclamation } from "@tabler/icons-react"
import { Button, Card, Col, Divider, Flex, Grid, TableCell, Text, TextInput, Title } from "@tremor/react"
import { FC, useContext, useReducer, useRef, useState } from "react"

import { CouchdbDoc } from "@iotinga/ts-backpack-couchdb-client"
import { Spinner } from "components/Spinner"
import { AppContext } from "contexts/AppContext"
import { AuthContext } from "contexts/AuthContext"
import useClickAway from "hooks/useClickAway"
import { useIndexableData, useLunr } from "hooks/useLunr"
import { Link } from "react-router-dom"
import { DeliverableDoc } from "types/couchdb"

const SEARCH_FIELDS = ["name", "project", "version", "artifacts", "repository"]
type SearcheableKeys = "name" | "project" | "version" | "artifacts" | "repository"
type SearcheableDeliverable = Pick<DeliverableDoc, SearcheableKeys> & CouchdbDoc

type SearchResultsProps = {
  queryIsEmpty: boolean
  results: SearcheableDeliverable[]
  loading: boolean
}

const SearchResults: FC<SearchResultsProps> = ({ queryIsEmpty, results, loading }) => {
  let Content = <SearchNoResultsView />

  if (queryIsEmpty) {
    Content = <SearchEmptyView />
  } else if (results.length !== 0) {
    Content = (
      <>
        {results.map((result, index, array) => (
          <>
            <Link to={`/deliverables/${result.project.replace("@", "/")}/${result.name}`} key={result._id}>
              <Grid numItems={3} className="gap-4" key={result._id}>
                <Col numColSpan={1}>
                  <Flex flexDirection="col" alignItems="start">
                    <Title>{result.name}</Title>
                    <Text>{result.version}</Text>
                  </Flex>
                </Col>
                <Col numColSpan={2}>
                  <Text>Project: {result.project}</Text>
                  <Text>Repo: {result.repository}</Text>
                  <Text>Artifacts: {result.artifacts.join(", ")}</Text>
                </Col>
              </Grid>
            </Link>
            {index === array.length - 1 ? null : <Divider />}
          </>
        ))}
      </>
    )
  }

  return (
    <Card className="z-20 mt-2 mb-32 absolute overflow-y-auto max-h-[80vh]">
      {loading ? (
        <Flex role="status" flexDirection="col" justifyContent="center" alignItems="center" className="h-20">
          <Spinner />
        </Flex>
      ) : (
        Content
      )}
    </Card>
  )
}

const SearchEmptyView = () => (
  <Flex className="h-20" justifyContent="center">
    <IconZoomExclamation size={32} stroke={1} className="text-tremor-content-subtle" />
    <Text className="ml-3 mb-1 text-tremor-content-subtle text-center">Start typing to search</Text>
  </Flex>
)

const SearchNoResultsView = () => (
  <Flex className="h-20" justifyContent="center">
    <IconSearchOff size={32} stroke={1} className="text-tremor-content-subtle" />
    <Text className="ml-3 mb-1 text-tremor-content-subtle text-center">No results found</Text>
  </Flex>
)

export const Search: FC = () => {
  const { CouchdbManager } = useContext(AppContext)
  const { userDb, username } = useContext(AuthContext)

  const [deliverables, setDeliverables] = useState<Record<string, DeliverableDoc>>({})
  const [query, setQuery] = useState<string>("")
  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(true)

  const lunrIndexConfig = useIndexableData(Object.values(deliverables), "_id", SEARCH_FIELDS)
  const results = useLunr(query, lunrIndexConfig)

  const resultsRef = useRef(null)
  useClickAway(resultsRef, () => {
    if (showResults) {
      setShowResults(false)
    }
  })

  async function fetchDeliverables() {
    if (userDb === undefined || username === undefined) {
      return
    }

    await CouchdbManager.db(userDb)
      .design(username)
      .view("deliverables", {
        reduce: false,
        include_docs: true,
      })
      .then(resp => {
        const map: Record<string, DeliverableDoc> = {}
        resp.rows
          .filter(row => row.doc !== undefined)
          .forEach(row => {
            map[row.id] = row.doc as DeliverableDoc
          })
        setDeliverables(map)
        setLoading(false)
      })
  }

  return (
    <div
      style={{
        transition: "width ease 400ms",
        width: showResults ? "50%" : undefined,
      }}
    >
      <Flex flexDirection="col" justifyContent="around">
        <form
          className="w-full z-20"
          onSubmit={e => e.preventDefault()}
          style={{
            transition: "width ease 400ms",
          }}
        >
          <label htmlFor="default-search" className="mb-2 text-sm font-medium text-gray-900 sr-only">
            Search
          </label>
          <div className="relative" ref={resultsRef}>
            <TextInput
              type="text"
              id="default-search"
              className="z-20 bg-tremor-background-muted focus:outline-none focus:ring-0 focus:ring-offset-0"
              placeholder="Search..."
              autoComplete="off"
              autoCorrect="off"
              icon={IconSearch}
              onClickCapture={() => {
                if (!showResults) {
                  setShowResults(true)
                }
                fetchDeliverables()
              }}
              onChange={e => {
                if (!showResults) {
                  setShowResults(true)
                }
                setQuery(e.target.value)
              }}
              required
            />
            <Button type="submit" variant="light" className="absolute right-2.5 bottom-2 font-medium py-2"></Button>
            {showResults ? (
              <SearchResults
                queryIsEmpty={query === ""}
                results={results.map(result => deliverables[result.ref])}
                loading={loading}
              />
            ) : null}
          </div>
        </form>
        {showResults ? <SearchOverlay /> : null}
      </Flex>
    </div>
  )
}

const SearchOverlay: FC = () => (
  <div
    className="w-full h-full fixed top-0 left-0 z-10 pointer-events-none"
    style={{
      backgroundColor: "rgba(0, 0, 0, 0.3)",
      transition: "opacity ease 400ms, width 0s, height 0s",
    }}
  ></div>
)
